from datetime import datetime, timezone

from app.sensors import (
    generate_seed_readings,
    normalize_sensor_list,
    normalize_sensor_type,
    parse_supported_sensors_csv,
)


def test_normalize_sensor_type_maps_steps_alias():
    assert normalize_sensor_type("steps") == "stepCount"
    assert normalize_sensor_type("heartRate") == "heartRate"
    assert normalize_sensor_type("  stepCount  ") == "stepCount"


def test_normalize_sensor_list_none_and_empty():
    assert normalize_sensor_list(None) is None
    assert normalize_sensor_list([]) == []
    assert normalize_sensor_list(["steps", "heartRate", "stepCount"]) == [
        "stepCount",
        "heartRate",
    ]


def test_parse_supported_sensors_csv():
    assert parse_supported_sensors_csv("heartRate, steps, activeEnergy") == [
        "heartRate",
        "stepCount",
        "activeEnergy",
    ]


def test_generate_seed_readings_skips_stress_and_is_chronological():
    now = datetime(2026, 9, 29, 16, 0, tzinfo=timezone.utc)
    payloads, skipped = generate_seed_readings(
        ["heartRate", "stepCount", "bloodOxygen", "stress", "activeEnergy", "sleep"],
        now=now,
    )
    assert skipped == ["stress"]
    types = {item["sensor_type"] for item in payloads}
    assert types == {"heartRate", "stepCount", "bloodOxygen", "activeEnergy", "sleep"}
    assert "stress" not in types
    assert payloads == sorted(payloads, key=lambda item: item["recorded_at"])
    sleep_rows = [item for item in payloads if item["sensor_type"] == "sleep"]
    assert sleep_rows
    assert all(item["unit"] == "minutes" for item in sleep_rows)
    steps = [item["value"] for item in payloads if item["sensor_type"] == "stepCount"]
    assert steps == sorted(steps)
    energy = [item["value"] for item in payloads if item["sensor_type"] == "activeEnergy"]
    assert energy == sorted(energy)


def test_generate_seed_readings_only_requested_types():
    payloads, skipped = generate_seed_readings(["heartRate", "stepCount"])
    assert skipped == []
    assert {item["sensor_type"] for item in payloads} == {"heartRate", "stepCount"}
