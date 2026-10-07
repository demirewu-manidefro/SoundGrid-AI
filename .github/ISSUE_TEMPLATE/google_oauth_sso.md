---
name: "Feature: Google OAuth 2.0 SSO Integration"
about: "Production configuration and frontend wiring for Google Single Sign-On"
title: "[FEAT]: Production Google OAuth 2.0 Single Sign-On (SSO) Integration"
labels: "enhancement, security, auth"
assignees: "demirewu-manidefro"
---

## 🎯 Feature Description & Objective
Enable seamless, secure **"Sign in with Google"** for SoundGrid Sentinel operators, technicians, and plant engineers using Google Identity Services (GIS) and Google OAuth 2.0.

Currently, the backend architecture in `backend/src/modules/auth/auth.service.ts` contains the Google token verification pipeline with `OAuth2Client` and fallback mock token handling. We need to wire real production credentials from Google Cloud Console, integrate the Google Identity button in the React frontend, and verify automatic tenant provisioning.

---

## 📋 Implementation Checklist

### 1. Google Cloud Console Configuration
- [ ] Create or select project in [Google Cloud Console](https://console.cloud.google.com/).
- [ ] Configure **OAuth Consent Screen**:
  - User Type: External (or Internal for Workspace organizations)
  - Scopes: `openid`, `email`, `profile`
  - App Name: `SoundGrid Sentinel`
- [ ] Create **OAuth 2.0 Client ID** (Web application):
  - Authorized JavaScript origins: `http://localhost:5173`, `http://localhost:8000`
  - Authorized redirect URIs: `http://localhost:5173/auth/google/callback`
- [ ] Copy `Client ID` and store in environment configurations.

### 2. Backend Environment & Verification
- [ ] Update `backend/.env`:
  ```env
  GOOGLE_CLIENT_ID="<your-google-client-id>.apps.googleusercontent.com"
  ```
- [ ] Validate token payload verification in `AuthService.loginWithGoogle`:
  - Verify email domain matching.
  - Check user existence in PostgreSQL:
    - If user exists: link `googleId`, update `lastLoginAt`.
    - If user is new: auto-provision under default tenant (e.g., `Apex Power Generation`) with default role `TECHNICIAN`.
- [ ] Issue short-lived JWT (15m) + revocable HTTP-only Refresh Token cookie (7d).
- [ ] Record immutable audit log: `AUTH_GOOGLE_SSO_SUCCESS`.

### 3. Frontend Integration (`frontend/src/pages/Login.tsx`)
- [ ] Install `@react-oauth/google` in frontend:
  ```bash
  npm install @react-oauth/google
  ```
- [ ] Wrap app with `<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>`.
- [ ] Replace mock button in `Login.tsx` with `<GoogleLogin onSuccess={...} onError={...} />`.
- [ ] Send Google `credential` (ID token) to `POST /api/auth/google`.
- [ ] Store access token in `localStorage` and redirect to `/` telemetry dashboard.

---

## 🔒 Security & Defense-in-Depth Requirements
- [ ] Audience verification: ensure token audience matches `GOOGLE_CLIENT_ID`.
- [ ] Rate limiting: apply `authRateLimiter` sliding-window token bucket to prevent token flooding.
- [ ] Organizational tenant scoping: ensure Google authenticated users cannot access or tamper with other organizations' assets without proper tenant privileges.

---

## ✅ Definition of Done (Acceptance Criteria)
1. A user can click **"Sign in with Google"** on `http://localhost:5173/login`.
2. A Google account selector popup appears and returns a valid ID token.
3. Backend verifies the token with Google servers, provisions or matches the user in PostgreSQL, and issues session tokens.
4. User is redirected to the SoundGrid Sentinel Dashboard with active tenant credentials.
5. An audit log entry (`AUTH_GOOGLE_SSO_SUCCESS`) is appended to PostgreSQL.
