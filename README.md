# CivicPulse — AI Hyperlocal Problem Solver

> Built for **Vibe2Ship Hackathon · Problem Statement 2**

**CivicPulse** turns a citizen's photo into an autonomous chain of AI agents that validate, classify, route, and reward civic participation — making every street problem impossible to ignore.

🌐 **Live App:** https://civicpulse-2026-9a1d3.web.app  
🔧 **Backend API:** https://civicpulse-backend-723293774519.us-central1.run.app  
📦 **GitHub:** https://github.com/rachitmnit123/civicpulse

---

## The Problem

Citizens have no reliable way to report hyperlocal civic issues — potholes, broken streetlights, water leakage — in a way that guarantees action. Existing tools are either government portals nobody checks, or social media posts that get ignored.

**The gap:** AI-powered closed-loop accountability that takes a photo and autonomously routes it to the right authority, validates it with community consensus, and rewards civic participation.

---

## Features

### Core
- 📷 **Photo & Video Upload** — capture civic issues with GPS auto-detection
- 🤖 **5-Agent AI Pipeline** — autonomous analysis via Gemini 2.5 Flash
- 🗺️ **Google Maps Integration** — issue pins with severity-colored markers
- 🔐 **Google Authentication** — one-click sign-in
- 📊 **Community Dashboard** — real-time stats and issue feed
- 👥 **Community Verification** — upvote/dispute issues to confirm existence

### Location Intelligence
- 📍 **Auto GPS Detection** — location captured automatically on report submission
- 🏙️ **Reverse Geocoding** — converts coordinates to human-readable address (street, city, district, state)
- 🗺️ **District-Level Filtering** — Authority users see only reports from their assigned district
- 📌 **Landmark Detection** — identifies nearby landmarks (sublocality, neighborhood) for precise location context
- 🌏 **State Normalization** — handles common state name variations (Delhi, Uttarakhand, Odisha, J&K)

### AI-Powered
- 👁️ **Vision Analysis** — detects issue type, damage extent, safety risk from image
- 🏷️ **Auto-Categorization** — classifies into Road, Water, Electrical, Sanitation, Safety, etc.
- ⚠️ **Severity Scoring** — scores 1–10 with urgency level and SLA auto-assignment
- 🔍 **Duplicate Detection** — prevents spam by checking nearby reports
- 🗺️ **Smart Routing** — auto-assigns to the correct municipal department
- 💰 **Cost Estimation** — AI-generated repair cost estimate in INR

### Citizen Engagement
- 🏆 **XP & Gamification** — earn points for reporting, verifying, and resolving
- 🎖️ **Badges** — First Spotter, Fast Responder, Night Watch, Ward Champion, and more
- 📋 **My Reports** — track status of all submitted issues
- 🎁 **Rewards Page** — view XP, level, and badges earned

---

## User Roles

CivicPulse has three distinct roles, each with a dedicated dashboard and access level.

### 👤 Citizen
The primary user of the platform.
- Report civic issues with photo/video + GPS
- View all reports on map and list view
- Verify or dispute reports submitted by others
- Track status of personal reports
- Earn XP and badges for civic participation
- View community leaderboard and rewards

### 🏛️ District Authority
Municipal officials responsible for a specific district.
- **Filtered dashboard** — sees only reports from their assigned state + district
- View prioritized issue queue sorted by severity
- Update issue status: Assigned → In Progress → Resolved
- Add resolution comments
- View AI-generated department routing and cost estimates
- Monitor SLA compliance per issue

### 🔑 Super Admin
Platform-wide administrator with full access.
- View all reports across all districts and states
- Assign and manage authority accounts
- Monitor platform-wide stats and resolution rates
- Access cross-district analytics
- Manage user roles and permissions

> Role is selected at first login via the Role Selection screen and stored in Firestore under the user profile.

---

## AI Agent Pipeline

Every report submission triggers a sequential multi-agent pipeline, fully visible in the UI:

| Agent | Role | Output |
|-------|------|--------|
| **Vision Analysis Agent** 👁️ | Analyzes image for issue type, damage extent, safety risk | `{issue_type, confidence, damage_extent, safety_risk}` |
| **Categorization Agent** 🏷️ | Classifies into category and sub-category | `{category, sub_category, tags[]}` |
| **Severity Scoring Agent** ⚠️ | Scores severity 1–10, assigns urgency and SLA | `{severity_score, urgency, sla_hours, risk_factors[]}` |
| **Duplicate Detection Agent** 🔍 | Checks for existing nearby reports | `{is_duplicate, nearby_report_count}` |
| **Routing Agent** 🗺️ | Assigns to correct municipal department | `{primary_department, contact_email, escalation_chain[]}` |
| **Orchestrator** 🎛️ | Coordinates all agents, maintains pipeline state | Full pipeline log with timing |

---

## Tech Stack

### Frontend
- **React + Vite** — fast, modern UI
- **Firebase SDK** — Auth, Firestore, Storage
- `@vis.gl/react-google-maps` — Google Maps integration
- **Firebase Hosting** — deployed on Google Cloud

### Backend
- **Node.js + Express** — REST API server
- **Google Cloud Run** — serverless container deployment
- **`@google/genai` SDK** — Gemini 2.5 Flash via Vertex AI
- **Application Default Credentials (ADC)** — secure, keyless auth

### Google Cloud Services
| Service | Usage |
|---------|-------|
| **Gemini 2.5 Flash** | All 5 AI agents — vision, text, structured output |
| **Vertex AI** | Model hosting and inference |
| **Cloud Run** | Backend API deployment |
| **Firebase Hosting** | Frontend deployment |
| **Firebase Auth** | Google Sign-In |
| **Cloud Firestore** | All data — reports, users, verifications |
| **Firebase Storage** | Image and video storage |
| **Google Maps JS API** | Interactive map with issue pins |
| **Geocoding API** | Reverse geocoding coordinates to human-readable addresses |

---

## Project Structure

```
civicpulse/
├── frontend/                  # React + Vite app
│   ├── src/
│   │   ├── agents/            # AI agent implementations
│   │   │   ├── orchestrator.js
│   │   │   ├── visionAgent.js
│   │   │   ├── categorizationAgent.js
│   │   │   ├── severityAgent.js
│   │   │   ├── duplicateAgent.js
│   │   │   └── routingAgent.js
│   │   ├── components/
│   │   │   ├── MapView.jsx
│   │   │   └── VerifyIssue.jsx
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── ReportPage.jsx
│   │   │   ├── MyReportsPage.jsx
│   │   │   ├── AuthorityDashboard.jsx
│   │   │   ├── RewardsPage.jsx
│   │   │   └── RoleSelectionPage.jsx
│   │   ├── services/
│   │   │   ├── reportService.js
│   │   │   ├── geocodingService.js
│   │   │   ├── gamificationService.js
│   │   │   └── authService.js
│   │   └── utils/
│   │       └── geminiClient.js
│   └── vite.config.js
├── backend/                   # Express API server
│   ├── server.js              # Gemini proxy routes (/api/gemini, /api/gemini-vision, /api/gemini-video)
│   ├── Dockerfile
│   └── package.json
├── functions/                 # Firebase Cloud Functions
├── firebase.json
└── firestore.indexes.json
```

---

## Gamification System

| Action | XP Earned |
|--------|-----------|
| Submit a report | +25 XP |
| Report gets verified | +15 XP |
| Report gets resolved | +50 XP |
| Verify another report | +10 XP |
| High-severity report | ×2 multiplier |

### Levels
| Level | Title | XP Required |
|-------|-------|-------------|
| 1 | Watchful Citizen | 0 |
| 2 | Street Guardian | 100 |
| 3 | Ward Champion | 300 |
| 4 | Civic Hero | 700 |
| 5 | Community Legend | 1500 |

---

## Running Locally

### Prerequisites
- Node.js 20+
- Google Cloud SDK (`gcloud`)
- Firebase CLI (`firebase`)
- A Firebase project with Firestore, Auth, and Storage enabled

### Setup

**1. Clone the repo**
```bash
git clone https://github.com/rachitmnit123/civicpulse.git
cd civicpulse
```

**2. Frontend**
```bash
cd frontend
npm install
cp .env.example .env.local
# Add your keys to .env.local
npm run dev
```

**3. Backend**
```bash
cd backend
npm install
# Authenticate with Google Cloud
gcloud auth application-default login
node server.js
```

### Environment Variables

**`frontend/.env.local`**
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GOOGLE_MAPS_API_KEY=
VITE_BACKEND_URL=http://localhost:3001
```

---

## Deployment

### Backend → Google Cloud Run
```bash
cd backend
gcloud run deploy civicpulse-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001 \
  --project YOUR_PROJECT_ID
```

### Frontend → Firebase Hosting
```bash
cd frontend
echo "VITE_BACKEND_URL=https://YOUR_CLOUD_RUN_URL" > .env.production
npm run build
cd ..
firebase deploy --only hosting
```

---

## Firestore Data Model

### `reports` collection
```json
{
  "reporterId": "uid",
  "status": "PENDING | ASSIGNED | IN_PROGRESS | RESOLVED",
  "location": {
    "lat": 28.97,
    "lng": 77.66,
    "address": "19/2, Raten Nagar, Meerut, Uttar Pradesh 250002, India",
    "state": "Uttar Pradesh",
    "district": "Meerut",
    "landmark": "Near Sector 15/4A"
  },
  "imageUrl": "...",
  "mediaType": "image | video",
  "aiAnalysis": {
    "category": "ROAD_DAMAGE",
    "severity": 7,
    "urgency": "HIGH",
    "citizenTitle": "...",
    "citizenDescription": "...",
    "department": "Public Works Department",
    "estimatedCostInr": 125000,
    "processingLog": []
  },
  "verificationCount": 0,
  "upvotes": 1,
  "createdAt": "timestamp"
}
```

### `users` collection
```json
{
  "uid": "...",
  "displayName": "...",
  "email": "...",
  "role": "CITIZEN | AUTHORITY | ADMIN",
  "state": "Uttar Pradesh",
  "district": "Meerut",
  "gamification": {
    "xp": 250,
    "level": 2,
    "badges": ["first_spotter"],
    "reportsSubmitted": 5
  }
}
```

---

## Built With ❤️ for Vibe2Ship Hackathon

**Problem Statement 2** — AI-Powered Hyperlocal Civic Issue Reporting  
Powered by **Gemini 2.5 Flash** · Deployed on **Google Cloud**
