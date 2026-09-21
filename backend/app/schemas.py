"""
Pydantic schemas — the actual "API contract" the mobile team codes against.

Keep these in sync with the wireframe review checklist: every field a screen
displays or edits should map to a field here.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


# ---------- Users / Auth ----------
# Note: no UserCreate/Token schemas here anymore -- the mobile app talks to
# Firebase Auth directly for sign-up/sign-in and gets its own ID token.
# POST /auth/sync (called after Firebase sign-in) just returns UserOut.

class UserOut(BaseModel):
    id: str
    email: EmailStr
    name: str
    created_at: datetime
    role: str

    model_config = ConfigDict(from_attributes=True)


# ---------- Devices ----------

class DeviceCreate(BaseModel):
    name: str
    model: Optional[str] = None
    ble_identifier: Optional[str] = None
    firmware_version: Optional[str] = None


class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    model: Optional[str] = None


class DeviceOut(BaseModel):
    id: str
    owner_id: str
    name: str
    model: Optional[str]
    ble_identifier: Optional[str]
    firmware_version: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------- Sensor readings ----------

class SensorReadingCreate(BaseModel):
    sensor_type: str
    value: float
    unit: Optional[str] = None
    recorded_at: Optional[datetime] = None  # defaults to server time if omitted
    quality_status: Optional[str] = "ok"


class SensorReadingOut(BaseModel):
    id: str
    device_id: str
    sensor_type: str
    value: float
    unit: Optional[str]
    recorded_at: datetime
    quality_status: Optional[str]

    model_config = ConfigDict(from_attributes=True)


# ---------- Alert rules ----------

class AlertRuleCreate(BaseModel):
    sensor_type: str
    minimum_value: Optional[float] = None
    maximum_value: Optional[float] = None
    enabled: bool = True


class AlertRuleOut(BaseModel):
    id: str
    user_id: str
    sensor_type: str
    minimum_value: Optional[float]
    maximum_value: Optional[float]
    enabled: bool

    model_config = ConfigDict(from_attributes=True)


# ---------- Notifications ----------

class NotificationOut(BaseModel):
    id: str
    severity: str
    message: str
    created_at: datetime
    read_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


# ---------- Device sessions (connection history) ----------

class DeviceSessionCreate(BaseModel):
    # connected_at defaults to server time if omitted -- mirrors
    # SensorReadingCreate.recorded_at so both endpoints behave the same way
    # when the caller doesn't have a precise client-side timestamp.
    connected_at: Optional[datetime] = None


class DeviceSessionUpdate(BaseModel):
    # Called to close out a session once the device disconnects.
    disconnected_at: Optional[datetime] = None
    disconnect_reason: Optional[str] = None


class DeviceSessionOut(BaseModel):
    id: str
    device_id: str
    connected_at: datetime
    disconnected_at: Optional[datetime]
    disconnect_reason: Optional[str]

    model_config = ConfigDict(from_attributes=True)


# ---------- Patients (Doctor-role RBAC — DWSO-94) ----------
# These endpoints are the one deliberate exception to "you can only see your
# own data": a doctor-role user can read/update another user's profile. See
# app/routers/patients_router.py for the role check that guards this.

class PatientOut(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str
    patient_code: Optional[str]
    age: Optional[int]
    address: Optional[str]
    dob: Optional[datetime]
    emergency_contact: Optional[str]
    medical_details: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class PatientSummary(BaseModel):
    # Lighter-weight shape for search results (matches the wireframe's
    # "P_ID 111 : Name 1" list) -- avoids sending medical_details for a
    # whole result list.
    id: str
    name: str
    patient_code: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    address: Optional[str] = None
    dob: Optional[datetime] = None
    emergency_contact: Optional[str] = None
    medical_details: Optional[str] = None
