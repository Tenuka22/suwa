import json
import re
import time
from typing import List, Optional
from urllib.parse import quote

from playwright.sync_api import Page as PlaywrightPage
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from scrapling.fetchers import StealthyFetcher

from .config import (
    CARD_NAME_SELECTOR, CARD_SELECTOR, MAPS_URL, MODAL_ADDRESS_SELECTOR,
    MODAL_CATEGORY_SELECTOR, MODAL_CLOSE_BUTTON, MODAL_HOURS_SELECTOR,
    MODAL_NAME_SELECTOR, MODAL_PHONE_SELECTOR, MODAL_RATING_ARIA_SELECTOR,
    MODAL_REVIEWS_SELECTOR, MODAL_WEBSITE_SELECTOR, MODAL_PRICE_SELECTOR,
    SCROLL_CONTAINER_SELECTORS
)
from .models import Place
from .utils import extract_coordinates_from_url

class GoogleMapsScraper:
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.places: List[Place] = []
        self._extracted_names: set = set()

    def _safe_get_text(self, page: PlaywrightPage, selector: str, timeout_ms: int = 2000) -> Optional[str]:
        try:
            elem = page.locator(selector).first
            if elem.count() > 0:
                text = elem.inner_text(timeout=timeout_ms)
                return text.strip() if text else None
        except Exception:
            pass
        return None

    def _safe_get_attr(self, page: PlaywrightPage, selector: str, attr: str, timeout_ms: int = 2000) -> Optional[str]:
        try:
            elem = page.locator(selector).first
            if elem.count() > 0:
                return elem.get_attribute(attr, timeout=timeout_ms)
        except Exception:
            pass
        return None

    def _extract_from_modal(self, page: PlaywrightPage) -> Optional[Place]:
        try:
            # Wait for modal and for dynamic content (reviews, ratings) to settle
            try:
                page.wait_for_selector(MODAL_NAME_SELECTOR, timeout=5000)
                # Small additional sleep for dynamic data like review counts
                time.sleep(1.2)
            except:
                pass

            name = self._safe_get_text(page, MODAL_NAME_SELECTOR, timeout_ms=1000)
            if not name:
                name = page.title().split(" - ")[0] if " - " in page.title() else None

            if not name or name in self._extracted_names:
                return None

            rating = None
            rating_aria = self._safe_get_attr(page, MODAL_RATING_ARIA_SELECTOR, "aria-label", timeout_ms=1000)
            if rating_aria:
                match = re.search(r"(\d+\.?\d*)", rating_aria)
                if match:
                    rating = float(match.group(1))

            reviews = None
            reviews_text = self._safe_get_text(page, MODAL_REVIEWS_SELECTOR, timeout_ms=1000)
            if reviews_text:
                # Handle cases like "1,234 reviews" or "(123)"
                match = re.search(r"([\d,]+)", reviews_text)
                if match:
                    reviews = int(match.group(1).replace(",", ""))

            category = self._safe_get_text(page, MODAL_CATEGORY_SELECTOR, timeout_ms=500)
            address = self._safe_get_text(page, MODAL_ADDRESS_SELECTOR, timeout_ms=500)
            phone = self._safe_get_text(page, MODAL_PHONE_SELECTOR, timeout_ms=500)
            hours = self._safe_get_text(page, MODAL_HOURS_SELECTOR, timeout_ms=500)
            website = self._safe_get_attr(page, MODAL_WEBSITE_SELECTOR, "href", timeout_ms=500)
            
            # --- Price Level ---
            price_level = self._safe_get_attr(page, MODAL_PRICE_SELECTOR, "aria-label", timeout_ms=500)
            if price_level and ":" in price_level:
                price_level = price_level.split(":")[-1].strip()

            current_url = page.url
            lat, lng = extract_coordinates_from_url(current_url)

            # --- Place ID ---
            place_id = None
            if current_url:
                id_match = re.search(r"1s([^:]+)", current_url)
                if id_match:
                    place_id = id_match.group(1).split("!")[0]

            return Place(
                name=name, address=address, rating=rating, review_count=reviews,
                latitude=lat, longitude=lng, phone=phone, website=website,
                category=category, hours=hours, price_level=price_level,
                place_id=place_id, url=current_url,
            )
        except Exception as e:
            print(f"    ❌ Error extracting from modal: {e}")
            return None

    def _close_modal(self, page: PlaywrightPage) -> bool:
        try:
            close_btn = page.locator(MODAL_CLOSE_BUTTON).first
            if close_btn.count() > 0:
                try:
                    close_btn.wait_for(state="visible", timeout=1000)
                    close_btn.click(timeout=2000)
                    time.sleep(0.5)
                    return True
                except:
                    pass
            page.keyboard.press("Escape")
            time.sleep(0.5)
            return True
        except Exception:
            return False

    def _scroll_results_feed(self, page: PlaywrightPage, scroll_amount: int = 800) -> bool:
        try:
            for selector in SCROLL_CONTAINER_SELECTORS:
                container = page.locator(selector).first
                if container.count() > 0:
                    page.evaluate(f"""
                        () => {{
                            const container = document.querySelector('{selector}');
                            if (container) {{
                                container.scrollTop += {scroll_amount};
                                return true;
                            }}
                            return false;
                        }}
                    """)
                    time.sleep(1.5)
                    return True
            page.evaluate(f"window.scrollBy(0, {scroll_amount})")
            page.keyboard.press("PageDown")
            time.sleep(1.5)
            return True
        except Exception as e:
            print(f"    ⚠️ Scroll error: {e}")
            return False

    def search_and_extract(self, query: str, limit: int = 50) -> List[Place]:
        print(f"🔍 Searching for: '{query}'")
        print(f"📊 Extraction limit: {limit} places")
        print("-" * 60)

        search_url = f"{MAPS_URL}/search/{quote(query)}"
        extracted_results: List[Place] = []
        scroll_after = 5
        items_since_scroll = 0
        total_scrolls = 0
        max_scrolls = 50
        zero_card_retries = 0

        def extraction_workflow(page: PlaywrightPage) -> PlaywrightPage:
            nonlocal extracted_results, items_since_scroll, total_scrolls, zero_card_retries

            try:
                time.sleep(2)
                while len(extracted_results) < limit and total_scrolls < max_scrolls:
                    card_locator = page.locator(CARD_SELECTOR)
                    card_count = card_locator.count()
                    
                    if card_count == 0:
                        zero_card_retries += 1
                        print(f"  ⚠️ No cards found (Retry {zero_card_retries}/3), scrolling...")
                        self._scroll_results_feed(page, scroll_amount=1000)
                        total_scrolls += 1
                        
                        if zero_card_retries >= 3:
                            print("  🛑 Sidebar seems to have vanished or no more results.")
                            # Try to re-trigger search view if possible by clicking search button? 
                            # Or just break.
                            break
                        continue
                    
                    zero_card_retries = 0 # Reset if cards found
                    print(f"\n  📋 Found {card_count} visible cards")

                    new_extractions_this_round = 0
                    for i in range(card_count):
                        if len(extracted_results) >= limit:
                            break

                        try:
                            card = card_locator.nth(i)
                            card_name_elem = card.locator(CARD_NAME_SELECTOR).first
                            card_name = None
                            if card_name_elem.count() > 0:
                                try:
                                    card_name = card_name_elem.inner_text(timeout=500)
                                except:
                                    pass
                            
                            if card_name and card_name.strip() in self._extracted_names:
                                continue

                            print(f"\n  ➡️  Processing card {i + 1}/{card_count}: {card_name or 'Unknown'}")
                            card.scroll_into_view_if_needed(timeout=2000)
                            card.click(timeout=3000)
                            
                            place = self._extract_from_modal(page)
                            if place and place.name:
                                if place.name not in self._extracted_names:
                                    extracted_results.append(place)
                                    self._extracted_names.add(place.name)
                                    new_extractions_this_round += 1
                                    items_since_scroll += 1
                                    print(f"    ✅ Extracted: {place.name}")
                                else:
                                    print(f"    ⏭️  Already extracted: {place.name}")
                            time.sleep(0.3)
                        except Exception as e:
                            print(f"    ❌ Error processing card {i}: {e}")
                            self._close_modal(page)
                            continue

                    if len(extracted_results) < limit:
                        if items_since_scroll >= scroll_after or new_extractions_this_round == 0:
                            print(f"\n  📜 Scrolling results feed (scroll #{total_scrolls + 1})...")
                            self._scroll_results_feed(page, scroll_amount=1200)
                            total_scrolls += 1
                            items_since_scroll = 0
                            time.sleep(1)
            except Exception as e:
                if "Target page, context or browser has been closed" not in str(e):
                    print(f"\n  ❌ Extraction workflow error: {e}")
            return page

        StealthyFetcher.fetch(
            search_url, headless=self.headless, network_idle=False,
            page_action=extraction_workflow, google_search=False, timeout=600000,
        )

        self.places = extracted_results
        return self.places

    def print_summary(self) -> None:
        """Print a summary of extracted data."""
        print("\n" + "=" * 60)
        print("EXTRACTION SUMMARY")
        print("=" * 60)
        print(f"Total places: {len(self.places)}")
        print(f"With coordinates: {sum(1 for p in self.places if p.latitude)}")
        print(f"With ratings: {sum(1 for p in self.places if p.rating)}")
        print(f"With reviews: {sum(1 for p in self.places if p.review_count is not None)}")
        print(f"With phone: {sum(1 for p in self.places if p.phone)}")
        print(f"With website: {sum(1 for p in self.places if p.website)}")
        print(f"With hours: {sum(1 for p in self.places if p.hours)}")
        print("=" * 60)

        for i, place in enumerate(self.places, 1):
            print(f"\n{i}. {place.name}")
            print(f"   Category: {place.category or 'N/A'}")
            print(f"   Address: {place.address or 'N/A'}")
            print(f"   Rating: {place.rating or 'N/A'} ({place.review_count or 0} reviews)")
            if place.latitude: print(f"   Coords: {place.latitude}, {place.longitude}")
            if place.phone: print(f"   Phone: {place.phone}")
            if place.website: print(f"   Website: {place.website}")
            if place.hours: print(f"   Hours: {place.hours}")
            if place.price_level: print(f"   Price: {place.price_level}")
            if place.place_id: print(f"   PlaceID: {place.place_id}")

    def save_to_json(self, filename: str) -> None:
        """Save extracted data to JSON file."""
        data = [place.to_dict() for place in self.places]
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"\n💾 Data saved to {filename}")
