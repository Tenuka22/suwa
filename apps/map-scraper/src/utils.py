import re
from typing import Optional

def extract_coordinates_from_url(url: str) -> tuple:
    """
    Extract lat/lng from Google Maps URL or data.
    Google Maps URLs can have coordinates in various formats.
    """
    if not url:
        return None, None

    # Priority 1: !3dLat!4dLng (Most accurate for the specific place)
    match = re.search(r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)", url)
    if match:
        return float(match.group(1)), float(match.group(2))

    # Priority 2: @Lat,Lng (Viewport center, usually very close)
    match = re.search(r"@(-?\d+\.\d+),(-?\d+\.\d+)", url)
    if match:
        return float(match.group(1)), float(match.group(2))

    # Priority 3: Other common patterns
    patterns = [
        r"3d(-?\d+\.?\d*)\s*!\s*4d(-?\d+\.?\d*)",
        r"ll=(-?\d+\.?\d*),(-?\d+\.?\d*)",
        r"!8m2!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)",
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            try:
                return float(match.group(1)), float(match.group(2))
            except (ValueError, IndexError):
                continue
                
    return None, None
