# SoundGrid-AI (SoundGrid Sentinel)

> Enterprise Multi-Tenant Industrial Acoustic AI Platform for Predictive Equipment Maintenance

---

## 🏗️ High-Level System Architecture

SoundGrid Sentinel is an industrial telemetry platform designed to monitor and detect acoustic anomalies in heavy industrial equipment:
- **Electric Transformers** (partial discharge, core hum distortion)
- **Heavy-Duty Pumps** (cavitation, bearing fault, impeller wear)
- **High-Torque Induction Motors** (stator vibration, rotor bar anomalies)
- **Industrial Ventilation Fans** (aerodynamic unbalance, blade damage)

### Microservice Topology
1. **Core Backend (`backend/`)**: Node.js, TypeScript, Express, Prisma ORM, PostgreSQL. Handles enterprise business logic, multi-tenancy, authentication, role hierarchy, sliding-window rate limiting, and database interactions.
2. **AI Microservice (`ai_engine/`)**: Python, FastAPI, TorchScript runtime (`soundgrid_web_model.pt`), Librosa audio preprocessing. Sub-second Mel-Spectrogram feature extraction and binary anomaly inference.
3. **Frontend Dashboard (`frontend/`)**: React, Vite, TypeScript, Tailwind CSS, Lucide Icons, TanStack Query. Dark-themed industrial telemetry control room.

---

## 🔐 Multi-Tenant Hierarchy & Dynamic RBAC

| Tier | Role | Description |
| :--- | :--- | :--- |
| **Tier 1** | `SUPER_ADMIN` | Global master owner: cross-company visibility, tenant onboarding, system metrics |
| **Tier 2** | `ENTERPRISE_ADMIN` | Plant owner: tenant-scoped rights; manages machines, technicians, and work order approvals |
| **Tier 3** | `TECHNICIAN` | Ground operator: audio inspection tools, real-time diagnostic execution, logs tickets |

---

## ⚡ Quick Start

### 1. Database Setup (PostgreSQL)
Ensure PostgreSQL is running on port `5432` with a database named `soundgrid`.

```bash
cd backend
npm install
npx prisma db push
npm run seed
```

### 2. Run Backend
```bash
npm run dev
```

### 3. Verify System
```bash
npx tsx tests/verify_phase1.ts
```
