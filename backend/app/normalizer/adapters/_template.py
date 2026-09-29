"""
Template for a real vendor adapter -- copy this file to adapters/<vendor>.py,
rename the class, and fill in the vendor's actual API details. This file is
NOT registered in registry.py and is never imported by the app; it exists
purely as a starting point once a real wearable vendor is confirmed with the
client (see the System Maintenance Document, Section 15).

Steps to turn this into a real adapter:
1. Copy this file to adapters/<vendor_key>.py and rename the class.
2. Fill in the real base URL, auth header shape, and response field names
   in fetch_readings below.
3. Set vendor_key to a short unique string (e.g. "fitbit").
4. Register it in registry.py: ADAPTER_REGISTRY["<vendor_key>"] = YourAdapter()
5. Set device.vendor to that same key when a user connects a device of that
   vendor.
"""
import requests
from datetime import datetime
from typing import List

from app.normalizer.base import VendorAdapter, VendorAuthError
from app.normalizer.schemas import NormalizedReading


class TemplateVendorAdapter(VendorAdapter):
    vendor_key = "template"  # replace with the real vendor's key

    BASE_URL = "https://api.example-vendor.com/v1"

    def fetch_readings(self, access_token: str, since: datetime) -> List[NormalizedReading]:
        resp = requests.get(
            f"{self.BASE_URL}/readings",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"since": since.isoformat()},
            timeout=10,
        )
        if resp.status_code == 401:
            raise VendorAuthError("Vendor token expired or invalid")
        resp.raise_for_status()

        raw_items = resp.json()["data"]  # <- adjust to the vendor's actual envelope

        # This mapping is the entire point of an adapter: translate the
        # vendor's field names/units/timestamp format into ours.
        return [
            NormalizedReading(
                sensor_type="heartRate",              # map the vendor's own field/enum here
                value=item["hr"],                      # <- vendor's field name
                unit="bpm",
                recorded_at=datetime.fromisoformat(item["ts"]),  # <- vendor's timestamp format
            )
            for item in raw_items
        ]

    def fetch_battery_level(self, access_token: str):
        resp = requests.get(
            f"{self.BASE_URL}/device/battery",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        if resp.status_code != 200:
            return None
        return resp.json().get("batteryPercent")
