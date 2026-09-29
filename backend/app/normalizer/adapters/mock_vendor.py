import random
from datetime import datetime, timedelta
from typing import List

from app.normalizer.base import VendorAdapter
from app.normalizer.schemas import NormalizedReading


class MockVendorAdapter(VendorAdapter):
    """
    No wearable vendor has been confirmed with the client yet (see the
    System Maintenance Document, Section 15), so this adapter doesn't call
    any real API -- it generates plausible-looking heart-rate readings
    instead. It exists so:

    1. The rest of the pipeline (sync service, ingestion, alert rules,
       dashboard) can be built and demoed today, without waiting on a
       vendor decision.
    2. It's a concrete, working example of the adapter shape for whoever
       writes the first real one -- copy this file, replace fetch_readings'
       body with a real HTTP call, keep the return type identical.

    access_token is accepted (per the interface) but ignored here.
    """

    vendor_key = "mock"

    def fetch_readings(self, access_token: str, since: datetime) -> List[NormalizedReading]:
        now = datetime.utcnow()
        readings = []
        t = since
        while t < now:
            readings.append(
                NormalizedReading(
                    sensor_type="heartRate",
                    value=float(random.randint(58, 100)),
                    unit="bpm",
                    recorded_at=t,
                )
            )
            t += timedelta(minutes=5)
        return readings

    def fetch_battery_level(self, access_token: str):
        return random.randint(20, 100)
