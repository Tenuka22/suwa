from dataclasses import asdict, dataclass
from typing import Dict, Optional

@dataclass
class Place:
    """Data class for storing place information."""
    name: str
    address: Optional[str] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    category: Optional[str] = None
    hours: Optional[str] = None
    price_level: Optional[str] = None
    place_id: Optional[str] = None
    url: Optional[str] = None

    def to_dict(self) -> Dict:
        return asdict(self)
