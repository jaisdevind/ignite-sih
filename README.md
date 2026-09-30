# 🔥 IGNITE — Infrared Gradient Normalization and Intelligent Thermal Extraction

**Smart India Hackathon (SIH) 2026** • **Problem Statement ID:** SIH26142 • **Theme:** Space Technology • **Team:** IGNITE

---

## 📌 Project Overview
IGNITE is an Earth-Observation prototype system designed to enhance thermal satellite imagery, perform deterministic thermal anomaly classification, and evaluate infrastructure risk levels.

> [!IMPORTANT]
> **Scientific Integrity & Prototype Disclaimer:**  
> The super-resolution mapping (SRM) output produced by this prototype is an image-enhancement visualization layer built on bicubic upscaling and spatial sharpening filters. It does **not** rely on pre-trained super-resolution deep weights. Original thermal values are strictly preserved as the primary source of truth for analytical decisions.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Leaflet & React-Leaflet GIS engine
- **Backend**: FastAPI (Python 3.11+), OpenCV, NumPy, Pillow, SciPy
- **Containerization**: Docker, Docker Compose, Nginx
- **API Protocol**: REST API with base64/JSON payload streaming & CORS dynamic origin support

---

## 🚀 Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend server will run at: `http://localhost:8000`  
Health check endpoint: `http://localhost:8000/health`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend application will run at: `http://localhost:3000`

---

## 🐳 Docker Deployment

To launch both frontend and backend in containerized environments:

```bash
docker-compose up --build
```
Access the application:
- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`

---

## ☁️ Production Deployment Instructions

### Frontend (Vercel / Netlify)
1. Import the `frontend/` directory as a new project in Vercel/Netlify.
2. Set Build Command: `npm run build`
3. Set Output Directory: `dist`
4. Configure Environment Variable:
   - `VITE_API_BASE`: `https://your-backend-service.onrender.com` (URL of deployed backend)

### Backend (Render / Railway / Hugging Face Spaces / Docker)
1. Select Docker environment or Python Web Service.
2. Set Environment Variables:
   - `PORT`: `8000` (or host provided port)
   - `CORS_ORIGINS`: `https://your-frontend.vercel.app,http://localhost:3000`
3. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

---

## 🧪 Testing & Verification

Run the automated backend test suite:
```bash
cd backend
python test_backend.py
```

Run frontend build check:
```bash
cd frontend
npm run build
```

---

## 📜 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health status check |
| `GET` | `/api/demo-scenes` | Retrieve pre-packaged prototype thermal demo scenes |
| `POST` | `/api/upload` | Upload and validate thermal/infrared image files |
| `POST` | `/api/preprocess` | Execute normalization, denoising, and CLAHE contrast pass |
| `POST` | `/api/srm` | Run 2x/4x prototype Super-Resolution Mapping pipeline |
| `POST` | `/api/classify` | Deterministic 6-class thermal anomaly classifier |
| `POST` | `/api/risk` | Multi-factor weighted prototype risk index calculator |
| `POST` | `/api/analyze` | End-to-end unified analysis (SRM + Classify + Risk) |
| `GET` | `/api/report-html/{id}` | Generate printable HTML incident dossier |

---

## 📋 SIH Jury Demonstration Checklist & Guide

Refer to the jury presentation procedure for the step-by-step 3-5 minute live demonstration walkthrough.
