from src.config import DEFAULT_EXTRACTION_LIMIT, DEFAULT_PLACE, OUTPUT_FILE
from src.scraper import GoogleMapsScraper


def main():
    """Main execution function."""
    print("Google Maps Scraper (Modularized)")
    print("Strategy: Click card → Extract modal → Next card (Direct)")
    print("=" * 60)

    # Initialize scraper
    scraper = GoogleMapsScraper(headless=True)

    # Perform search and extraction
    scraper.search_and_extract(query=DEFAULT_PLACE, limit=DEFAULT_EXTRACTION_LIMIT)

    # Print summary
    scraper.print_summary()

    # Save to file
    scraper.save_to_json(OUTPUT_FILE)

    print("\n✅ Done!")


if __name__ == "__main__":
    main()
