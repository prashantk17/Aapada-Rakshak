# 🛡️ Aapada Rakshak — Real-Time Disaster Management Platform

> A full-stack disaster alert and coordination system built as a Final Year CS Project.

---

## 🌐 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + Leaflet.js + OpenStreetMap |
| Backend | Python Flask REST API |
| Database | Firebase Firestore (real-time) |
| Notifications | Firebase Cloud Messaging |
| ML Prediction | scikit-learn RandomForest |
| Auth | Firebase Authentication |
| Charts | Chart.js |

---

## 📁 Project Structure

```
aapada-rakshak/
├── frontend/          # React Vite app
├── backend/           # Flask Python API
├── dataset/           # Historical disaster CSV data
├── firebase/          # Firebase config
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Firebase project (free tier)

---

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project named `aapada-rakshak`
3. Enable **Firestore Database** (start in test mode)
4. Enable **Authentication** → Email/Password
5. Enable **Cloud Messaging**
6. Go to Project Settings → Your Apps → Add Web App
7. Copy the config into `frontend/src/firebase/config.js`
8. In Project Settings → Service Accounts → Generate new private key
9. Save as `backend/firebase-service-account.json`

---

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
# Add your firebase-service-account.json here
python app.py
```

Backend runs on: `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## 👥 User Roles

| Role | Access |
|---|---|
| **Citizen** | View map, receive alerts, request help, find shelters |
| **Volunteer** | Register, post relief updates, share routes |
| **Admin** | Create alerts, draw risk zones, manage all data |

### Demo Accounts (after setup)
- Admin: `admin@aapada.gov.in` / `Admin@123`
- Volunteer: `volunteer@test.com` / `Test@123`
- Citizen: `citizen@test.com` / `Test@123`

---

## 🗺️ Features

- 🔴 **Live Disaster Map** — Colored risk zones with Leaflet
- 🤖 **AI Risk Prediction** — RandomForest ML simulation
- 🔔 **Push Notifications** — Firebase Cloud Messaging
- 🏥 **Safe Shelter Finder** — Nearest evacuation centers
- 🙋 **Volunteer Locator** — Nearby helpers
- 📊 **Admin Dashboard** — Charts, zone drawing, analytics
- 🆘 **Emergency SOS** — One-tap distress signal
- 📴 **Offline Support** — Cached alerts via Service Worker
- 🌡️ **Risk Heatmap** — Visual danger intensity
- 📅 **Disaster Timeline** — Historical event log

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/disasters` | Get all active disasters |
| POST | `/api/disasters` | Create new disaster (Admin) |
| GET | `/api/shelters` | Get all shelters |
| POST | `/api/shelters` | Add shelter (Admin) |
| GET | `/api/volunteers` | Get all volunteers |
| POST | `/api/volunteers` | Register volunteer |
| GET | `/api/relief-posts` | Get relief feed |
| POST | `/api/relief-posts` | Create relief post |
| POST | `/api/predict-risk` | ML risk prediction |
| POST | `/api/sos` | Send SOS alert |
| GET | `/api/analytics` | Dashboard analytics |
| GET | `/api/history` | Disaster history |

---

## 🧠 ML Risk Prediction

The `backend/ml_predictor.py` module uses a **Random Forest Classifier** trained on simulated historical data to predict disaster risk:

- **Features**: latitude, longitude, season, rainfall, elevation, past_incidents
- **Output**: Low / Medium / High risk classification
- **Dataset**: `dataset/historical_disasters.csv`

---

## 📦 Firestore Collections

```
users/           → uid, name, email, role, location
volunteers/      → uid, name, skills, availability, supplies
disasters/       → type, severity, lat, lng, radius, description, timestamp
shelters/        → name, lat, lng, capacity, contact, supplies
relief_posts/    → volunteer_id, image, description, location, supply_type
alerts/          → disaster_id, message, affected_users, timestamp
historical_disasters/ → type, lat, lng, severity, date, casualties
```

---

## 🎓 Academic Note

This project demonstrates:
- Real-time database integration
- Geospatial mapping and visualization
- Machine learning for risk assessment
- Role-based access control
- Emergency notification systems
- Progressive Web App capabilities

**Built for Final Year B.Tech Computer Science Project Submission**
