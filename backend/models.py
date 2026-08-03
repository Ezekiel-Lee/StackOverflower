"""
SQLAlchemy ORM models.

Tables mirror the schema agreed in the team requirements doc:
users, devices, sensor_readings, alert_rules, notifications, device_sessions.

Design notes:
- UUID primary keys (uuid4) so device/user IDs are safe to expose in the API.
- sensor_readings is the high-write table — indexed on (device_id, recorded_at)
  since almost every query filters by device and a time range.
- Raw high-frequency BLE samples should NOT all land here — the mobile app
  aggregates/throttles before calling POST /devices/{id}/data (see team doc
  section 5, "Important" note).
"""
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True)  # nullable if using Firebase/Supabase Auth
    created_at = Column(DateTime, default=datetime.utcnow)

    devices = relationship("Device", back_populates="owner", cascade="all, delete-orphan")
    alert_rules = relationship("AlertRule", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Device(Base):
    __tablename__ = "devices"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    owner_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    model = Column(String, nullable=True)
    ble_identifier = Column(String, nullable=True)  # MAC address or BLE device UUID
    firmware_version = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="devices")
    readings = relationship("SensorReading", back_populates="device", cascade="all, delete-orphan")
    sessions = relationship("DeviceSession", back_populates="device", cascade="all, delete-orphan")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    device_id = Column(UUID(as_uuid=False), ForeignKey("devices.id"), nullable=False)
    sensor_type = Column(String, nullable=False)  # e.g. "heartRate", "steps", "accelerometer"
    value = Column(Float, nullable=False)
    unit = Column(String, nullable=True)  # e.g. "bpm", "steps", "°C"
    recorded_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    quality_status = Column(String, nullable=True)  # e.g. "ok", "invalid", "out_of_range"

    device = relationship("Device", back_populates="readings")

    __table_args__ = (
        Index("ix_sensor_readings_device_time", "device_id", "recorded_at"),
    )


class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    sensor_type = Column(String, nullable=False)
    minimum_value = Column(Float, nullable=True)
    maximum_value = Column(Float, nullable=True)
    enabled = Column(Boolean, default=True)

    user = relationship("User", back_populates="alert_rules")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    severity = Column(String, nullable=False, default="info")  # info | warning | critical
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="notifications")


class DeviceSession(Base):
    __tablename__ = "device_sessions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    device_id = Column(UUID(as_uuid=False), ForeignKey("devices.id"), nullable=False, index=True)
    connected_at = Column(DateTime, default=datetime.utcnow)
    disconnected_at = Column(DateTime, nullable=True)
    disconnect_reason = Column(String, nullable=True)  # e.g. "user", "out_of_range", "battery_dead"

    device = relationship("Device", back_populates="sessions")
