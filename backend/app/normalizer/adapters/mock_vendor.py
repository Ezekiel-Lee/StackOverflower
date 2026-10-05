import random
from datetime import datetime, timedelta
from typing import List

from app.normalizer.base import VendorAdapter
from app.normalizer.schemas import NormalizedReading
from app.sensors import (
    ACTIVE_ENERGY,
    BLOOD_OXYGEN,
    HEART_RATE,
    SLEEP,
    STEP_COUNT,
    SENSOR_UNITS,
)


class MockVendorAdapter(VendorAdapter):
    """
    No wearable vendor has been confirmed with the client yet (see the
    System Maintenance Document, Section 15), so this adapter doesn't call
    any real API -- it generates plausible-looking development readings
    instead. It exists so:

    1. The rest of the pipeline (sync service, ingestion, alert rules,
       dashboard) can be built and demoed today, without waiting on a
       vendor decision.
    2. It's a concrete, working example of the adapter shape for whoever
       writes the first real one -- copy this file, replace fetch_readings'
       body with a real HTTP call, keep the return type identical.

    access_token is accepted (per the interface) but ignored here.
    Stress is a reserved canonical type with no defined scale, so this
    adapter never emits it.
    """

    vendor_key = "mock"

    def fetch_readings(self, access_token: str, since: datetime) -> List[NormalizedReading]:
        now = datetime.utcnow()
        readings: List[NormalizedReading] = []
        t = since
        tick = 0
        steps = 100.0
        energy = 20.0
        while t < now:
            readings.append(
                NormalizedReading(
                    sensor_type=HEART_RATE,
                    value=float(random.randint(58, 100)),
                    unit=SENSOR_UNITS[HEART_RATE],
                    recorded_at=t,
                )
            )
            if tick % 3 == 0:
                readings.append(
                    NormalizedReading(
                        sensor_type=BLOOD_OXYGEN,
                        value=float(random.randint(94, 100)),
                        unit=SENSOR_UNITS[BLOOD_OXYGEN],
                        recorded_at=t,
                    )
                )
            if tick % 6 == 0:
                steps += float(random.randint(80, 250))
                energy += float(random.randint(8, 25))
                readings.append(
                    NormalizedReading(
                        sensor_type=STEP_COUNT,
                        value=steps,
                        unit=SENSOR_UNITS[STEP_COUNT],
                        recorded_at=t,
                    )
                )
                readings.append(
                    NormalizedReading(
                        sensor_type=ACTIVE_ENERGY,
                        value=energy,
                        unit=SENSOR_UNITS[ACTIVE_ENERGY],
                        recorded_at=t,
                    )
                )
            t += timedelta(minutes=5)
            tick += 1

        if since < now:
            readings.append(
                NormalizedReading(
                    sensor_type=SLEEP,
                    value=float(random.randint(390, 510)),
                    unit=SENSOR_UNITS[SLEEP],
                    recorded_at=since + timedelta(minutes=1),
                )
            )
        return readings

    def fetch_battery_level(self, access_token: str):
        return random.randint(20, 100)
