# Google Maps URL
MAPS_URL = "https://www.google.com/maps"

# Selectors based on actual HTML structure
CARD_SELECTOR = "div.Nv2PK"  # Result card in the list
CARD_NAME_SELECTOR = "div.qBF1Pd"  # Name inside card
CARD_RATING_SELECTOR = "span.MW4etd"  # Rating inside card
CARD_REVIEWS_SELECTOR = "span.UY7F9"  # Review count inside card

# Modal selectors (when a card is clicked)
MODAL_NAME_SELECTOR = "h1.DUwDvf.lfPIob"
MODAL_RATING_ARIA_SELECTOR = "span.ceNzKf"  # aria-label has rating
MODAL_REVIEWS_SELECTOR = 'span[aria-label*="reviews"]'
MODAL_CATEGORY_SELECTOR = "button.DkEaL"
MODAL_ADDRESS_SELECTOR = 'button[data-item-id="address"] .Io6YTe'
MODAL_PHONE_SELECTOR = 'button[data-item-id*="phone"] .Io6YTe'
MODAL_HOURS_SELECTOR = 'button[data-item-id="oh"] .Io6YTe'
MODAL_WEBSITE_SELECTOR = 'a[data-item-id="authority"]'
MODAL_PRICE_SELECTOR = 'span[aria-label*="Price:"]'
MODAL_CLOSE_BUTTON = 'button[aria-label="Close"]'

# Scroll container for results feed
SCROLL_CONTAINER_SELECTORS = [
    'div[role="feed"]',
    ".m6QErb.DxyBCb",
    ".m6QErb",
]

# Extraction settings
DEFAULT_EXTRACTION_LIMIT = 10
DEFAULT_PLACE = "Hospitals near Galle"
OUTPUT_FILE = "places_data.json"
