# DSS Wearable App

A wearable health-monitoring application consisting of:

* **Mobile app:** Expo + React Native + Expo Router
* **Backend API:** FastAPI + SQLAlchemy + PostgreSQL
* **Authentication:** Firebase Authentication
* **Database:** PostgreSQL
* **API documentation:** FastAPI Swagger/OpenAPI

The mobile application communicates with the backend API for device management, sensor data, alerts, and notifications. Firebase Authentication handles user sign-up/sign-in, while the backend verifies Firebase ID tokens and maintains the application's local user records.

---

## Project Structure

```text
dss-wearable-app/
│
├── mobile/                         # Expo / React Native application
│   ├── app/                        # Expo Router file-based routes
│   ├── assets/
│   ├── package.json
│   └── ...
│
├── backend/                        # FastAPI backend
│   ├── app/
│   │   ├── main.py                 # FastAPI app, router wiring, CORS
│   │   ├── database.py             # SQLAlchemy engine/session
│   │   ├── models.py               # ORM models
│   │   ├── schemas.py              # Pydantic API contracts
│   │   ├── auth.py                 # Firebase ID token verification
│   │   └── routers/
│   │       ├── auth_router.py      # /auth/sync, /auth/me
│   │       ├── devices_router.py   # /devices
│   │       ├── sensor_data_router.py
│   │       └── alerts_router.py    # /alert-rules, /notifications
│   │
│   ├── tests/
│   ├── requirements.txt
│   └── ...
│
├── firebase-service-account.json   # Local only — NEVER commit
├── .gitignore
└── README.md
```

---

# Mobile App

The mobile application is built with **Expo and React Native** using Expo Router for file-based navigation.

## Getting Started

Navigate to the mobile project:

```bash
cd mobile
```

Install dependencies:

```bash
npm install
```

Start the Expo development server:

```bash
npx expo start
```

The terminal output provides options to open the application in:

* Development build
* Android emulator
* iOS simulator
* Expo Go

You can start developing by editing files inside:

```text
mobile/app/
```

This project uses file-based routing through Expo Router.

## Reset the Expo Starter Project

When starting development from the default Expo template, you can run:

```bash
npm run reset-project
```

This moves the starter code into `app-example` and creates a blank `app` directory for the application.

## Mobile Development Resources

* Expo documentation
* Expo Router documentation
* Expo tutorial
* React Native development tools

---

# Backend API

The backend is a **FastAPI + SQLAlchemy + PostgreSQL** API matching the team's data model.

The current data model contains:

```text
users
devices
sensor_readings
alert_rules
notifications
device_sessions
```

Authentication is handled by Firebase Authentication.

The mobile application signs users in directly through the Firebase SDK. The backend does **not** receive or store user passwords.

---

# Authentication Flow

```text
Mobile App                    Backend API                 Firebase
-----------                   -----------                 --------

Sign up / Sign in
      |
      |-------------------------------> Firebase Auth
      |                                      |
      |<-------------------------------- ID token
      |
      |
      | POST /auth/sync
      | Authorization: Bearer <token>
      |-------------------->
      |                    verify_id_token()
      |                          |
      |                          |----------------> Firebase Admin SDK
      |                          |
      |                          |<--------------- verified claims
      |                    create/update user
      |<------------------- local user
      |
      |
      | Other API requests
      | Authorization: Bearer <token>
      |-------------------->
      |                    verify token
      |                    find local user
      |<------------------- response
```

### Important Authentication Rules

* Sign-up, sign-in, and password reset happen entirely through the Firebase SDK.
* The backend never sees or stores a user's password.
* `POST /auth/sync` should be called after a successful Firebase sign-in.
* `/auth/sync` creates or updates the corresponding local `users` record.
* Protected endpoints require the user to have already been synchronized.
* Calling a protected endpoint before synchronization returns `401`.
* `users.id` is the Firebase UID directly rather than a separately generated UUID.

---

# Firebase Setup

Firebase only needs to be configured once per development environment.

## 1. Create or Select a Firebase Project

Open the Firebase Console and create a project or use the project's existing Firebase project.

## 2. Enable Authentication

Go to:

```text
Authentication
→ Sign-in method
```

Enable at least:

```text
Email/Password
```

Additional providers such as Google can be enabled later if required by the mobile application.

## 3. Generate a Service Account

Go to:

```text
Project Settings
→ Service Accounts
→ Generate new private key
```

Download the generated JSON file.

Save it locally as:

```text
backend/firebase-service-account.json
```

**Never commit this file to Git.**

It should already be included in `.gitignore`.

## 4. Optional Environment Variable

If the service-account file is stored somewhere else:

```bash
export FIREBASE_CREDENTIALS_PATH="/path/to/your-key.json"
```

Each developer running the backend locally needs access to their own copy of the Firebase service-account credentials.

Do not share credentials through Git, Slack, or other unsecured channels. Use the team's approved password manager or secure credential-sharing system.

---

# API Endpoints

The backend currently provides the following endpoints:

| Endpoint                  | Purpose                                |
| ------------------------- | -------------------------------------- |
| `POST /auth/sync`         | Create/update local user from Firebase |
| `GET /auth/me`            | Get current authenticated user         |
| `POST /devices`           | Register a device                      |
| `GET /devices`            | List user's devices                    |
| `PATCH /devices/{id}`     | Rename/update a device                 |
| `DELETE /devices/{id}`    | Remove a device                        |
| `POST /devices/{id}/data` | Ingest sensor data                     |
| `GET /devices/{id}/data`  | Retrieve historical sensor data        |
| `POST /alert-rules`       | Create an alert threshold              |
| `GET /alert-rules`        | List alert rules                       |
| `GET /notifications`      | Retrieve notifications                 |
| `GET /health`             | API health check                       |

Historical sensor data can be filtered using:

```text
GET /devices/{id}/data?sensor_type=&from=&to=
```

Sensor-data ingestion also performs threshold checks against configured alert rules.

---

# API Authentication

All protected endpoints use the Firebase ID token:

```http
Authorization: Bearer <firebase-id-token>
```

The normal flow is:

1. User signs in through Firebase on the mobile app.
2. Firebase returns an ID token.
3. Mobile app calls:

```http
POST /auth/sync
```

4. Backend verifies the Firebase token.
5. Backend creates or updates the local user.
6. Mobile app can then access protected endpoints.

The backend does not create a user automatically when another protected endpoint is called.

---

# Running the Backend

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it.

### macOS / Linux

```bash
source venv/bin/activate
```

### Windows

```powershell
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

# PostgreSQL

The backend uses PostgreSQL in normal development.

Set the database connection:

```bash
export DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/dss_wearable"
```

For example, PostgreSQL can be started with Docker:

```bash
docker run \
  --name dss-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=dss_wearable \
  -p 5432:5432 \
  -d postgres:16
```

Then start the API:

```bash
uvicorn app.main:app --reload
```

The API will be available at:

```text
http://localhost:8000
```

Swagger documentation is available at:

```text
http://localhost:8000/docs
```

---

# Using Swagger

To test protected endpoints through Swagger:

1. Obtain a Firebase ID token from the mobile application after signing in.
2. Call:

```http
POST /auth/sync
```

with the token.
3. Click **Authorize** in Swagger.
4. Paste the Firebase ID token.
5. Do **not** manually add the `Bearer` prefix if Swagger is configured to add it automatically.

---

# Running Backend Tests

Tests use:

* In-memory SQLite
* Mocked Firebase token verification

Therefore, running the test suite does not require a real PostgreSQL database or Firebase project.

Run:

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

The current test suite contains 21 tests covering:

* Authentication synchronization
* Current-user lookup
* Device ownership isolation
* Sensor-data ingestion
* Historical sensor-data filtering
* Threshold breach detection
* Notification creation

---

# Mobile ↔ Backend Integration

The mobile application communicates with the FastAPI backend using HTTP requests.

The general flow is:

```text
┌─────────────────────┐
│     Expo Mobile     │
│      App            │
└──────────┬──────────┘
           │
           │ Firebase SDK
           ▼
┌─────────────────────┐
│  Firebase Auth      │
└──────────┬──────────┘
           │
           │ ID Token
           ▼
┌─────────────────────┐
│    FastAPI API      │
│                     │
│  /auth/sync         │
│  /devices           │
│  /devices/{id}/data │
│  /alert-rules       │
│  /notifications     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    PostgreSQL       │
│                     │
│ users               │
│ devices             │
│ sensor_readings     │
│ alert_rules         │
│ notifications       │
│ device_sessions     │
└─────────────────────┘
```

---

# Sensor Data Flow

The wearable device communicates with the mobile application through BLE.

The mobile application is responsible for parsing and aggregating BLE data before sending it to the backend.

```text
Wearable
   │
   │ BLE
   ▼
Expo Mobile App
   │
   │ Parse + aggregate
   │
   │ POST /devices/{id}/data
   ▼
FastAPI Backend
   │
   ├── Store sensor reading
   │
   ├── Check alert rules
   │
   └── Create notification if threshold breached
   │
   ▼
PostgreSQL
```

The mobile application should **not** send every raw sensor sample individually.

The current guidance is to aggregate data client-side and send readings approximately every **10–30 seconds**, or when there is a meaningful change.

---

# API Contract

The Pydantic models in:

```text
backend/app/schemas.py
```

define the API contract between the mobile application and backend.

The mobile team should build against these field names and structures.

If a mobile wireframe requires a field that does not currently exist in `schemas.py`, flag it before implementing the screen so the API contract can be updated consistently.

---

# Database

The backend currently uses:

```python
Base.metadata.create_all()
```

for local development convenience.

Once the database schema stabilizes, the project should migrate to **Alembic** so schema changes can be version-controlled.

Recommended future setup:

```bash
alembic init alembic
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

---

# Current Scope

### Implemented

* Firebase authentication
* User synchronization
* User lookup
* Device registration
* Device listing
* Device rename/update
* Device removal
* Sensor-data ingestion
* Historical sensor-data queries
* Sensor filtering
* Alert rules
* Threshold checking
* Notifications
* Device ownership isolation
* API health check
* Backend test suite
* Expo mobile application foundation

### Not Yet Implemented

The following are planned as stretch/later features:

* NFC device pairing
* Multi-device concurrent streaming
* AI-generated insights
* `device_sessions` API endpoints
* Connection-history UI
* Sensor-data seed/simulation tooling

---

# Development Workflow

A typical development session requires both the mobile app and backend running.

## Terminal 1 — Backend

```bash
cd backend

source venv/bin/activate

export DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/dss_wearable"

uvicorn app.main:app --reload
```

## Terminal 2 — Mobile

```bash
cd mobile

npm install
npx expo start
```

The mobile application can then connect to the locally running FastAPI server.

When testing on a physical device, make sure the device can reach the computer running the backend. `localhost` on the phone refers to the phone itself, not the development computer.

---

# Team Responsibilities

## Mobile Team

Responsible for:

* Expo/React Native application
* UI and navigation
* Firebase client-side authentication
* BLE communication
* BLE packet parsing
* Sensor-data aggregation
* API integration
* Device management screens
* Alert and notification screens

After Firebase sign-in, the mobile app should call:

```http
POST /auth/sync
```

before accessing other protected API endpoints.

## Backend Team

Responsible for:

* FastAPI API
* Firebase token verification
* Database models
* API schemas
* Device ownership/security
* Sensor-data storage
* Alert-rule processing
* Notifications
* Database migrations
* Backend tests

## Firmware/BLE Team

Responsible for:

* Wearable sensor data
* BLE communication
* BLE packet format
* Device connectivity

The mobile application receives and parses BLE packets before sending aggregated data to:

```http
POST /devices/{device_id}/data
```

---

# Important Security Notes

Never commit:

```text
firebase-service-account.json
```

Never commit Firebase private keys, passwords, database credentials, or other secrets.

The Firebase service account should only be used by the backend.

The mobile application should use the Firebase client SDK and should **never contain the Firebase Admin SDK service-account credentials**.

---

# Quick Start

For a new developer, the basic setup is:

```bash
# Clone project
git clone <repository>

cd dss-wearable-app
```

### Backend

```bash
cd backend

python -m venv venv
source venv/bin/activate

pip install -r requirements.txt

export DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/dss_wearable"

uvicorn app.main:app --reload
```

### Mobile

In another terminal:

```bash
cd mobile

npm install
npx expo start
```

### API

Once the backend is running:

```text
API:
http://localhost:8000

Swagger:
http://localhost:8000/docs
```

The mobile application can then authenticate through Firebase and communicate with the FastAPI API.

---

# Project Goal

The DSS Wearable App combines wearable sensor data, mobile connectivity, authentication, backend storage, and configurable alerts into a single system.

The intended architecture is:

```text
                 ┌──────────────────┐
                 │     Wearable     │
                 │  Sensors + BLE   │
                 └────────┬─────────┘
                          │
                          │ BLE
                          ▼
                 ┌──────────────────┐
                 │   Expo Mobile    │
                 │      App         │
                 └────────┬─────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
        ┌──────────────┐    ┌──────────────┐
        │   Firebase   │    │   FastAPI    │
        │     Auth     │    │     API      │
        └──────────────┘    └──────┬───────┘
                                   │
                                   ▼
                            ┌──────────────┐
                            │  PostgreSQL  │
                            │   Database   │
                            └──────────────┘
```

This provides a clear separation between the mobile client, authentication provider, backend API, and persistent application data.
