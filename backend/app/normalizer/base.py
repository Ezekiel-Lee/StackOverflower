from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Optional

from app.normalizer.schemas import NormalizedReading


class VendorAuthError(Exception):
    """Raised by an adapter when the stored token is invalid/expired and the
    caller needs to re-authenticate the user with that vendor (e.g. surface
    a "reconnect your device" prompt in the app)."""


class VendorAdapter(ABC):
    """
    Every wearable vendor integration implements this interface. The rest of
    the backend (the sync service, the /devices endpoints, alert-rule
    evaluation) only ever talks to a VendorAdapter -- never to a specific
    vendor's SDK or response format directly. That's the whole point of the
    normalizer: swapping or adding a vendor means writing one new class here,
    not touching anything downstream.
    """

    #: Short, unique key stored on Device.vendor and used by the registry
    #: (registry.py) to look this adapter up, e.g. "vendor_a".
    vendor_key: str = ""

    @abstractmethod
    def fetch_readings(
        self, access_token: str, since: datetime
    ) -> List[NormalizedReading]:
        """
        Call the vendor's API for readings recorded after `since`, and
        return them already converted to NormalizedReading. Implementations
        should raise VendorAuthError on a 401/expired-token response rather
        than letting the vendor's own exception type leak out.
        """
        raise NotImplementedError

    def fetch_battery_level(self, access_token: str) -> Optional[int]:
        """
        Optional: 0-100 battery percentage, or None if this vendor doesn't
        report one. Default implementation returns None so adapters that
        don't support it don't need to override this method at all.
        """
        return None
