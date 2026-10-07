# GitHub Issue #1: Complete Production Google OAuth 2.0 Single Sign-On (SSO) Integration

**Issue Title**: `[FEAT]: Complete Production Google OAuth 2.0 Single Sign-On (SSO) Integration`  
**Labels**: `enhancement`, `security`, `auth`, `priority: high`  
**Milestone**: `Phase 5: Production Hardening`  
**Assignee**: `@demirewu-manidefro`  
**Status**: Ready for Implementation

---

## 🎯 Objective
Wire real-world Google OAuth 2.0 credentials from Google Cloud Console into the existing backend Google SSO handler (`backend/src/modules/auth/auth.service.ts`) and integrate the Google Identity Services button into the React frontend (`frontend/src/pages/Login.tsx`).

---

## 📋 Implementation Checklist

### 1. Google Cloud Console Setup
1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create project: `SoundGrid-Sentinel`.
3. Configure **OAuth consent screen**:
   - Application Name: `SoundGrid Sentinel`
   - User support email: `demirewumanidefro@gmail.com`
   - Scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`
4. Create **OAuth 2.0 Client IDs** (Web application):
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `http://localhost:8000`
   - Authorized redirect URIs:
     - `http://localhost:5173/auth/google/callback`
5. Copy your **Client ID** (format: `xxxxxxxx.apps.googleusercontent.com`).

---

### 2. Backend Configuration (`backend/`)
1. Set `GOOGLE_CLIENT_ID` in `backend/.env`:
   ```env
   GOOGLE_CLIENT_ID="<your-copied-client-id>.apps.googleusercontent.com"
   ```
2. Verify token audience in `backend/src/modules/auth/auth.service.ts` using `OAuth2Client`.
3. Auto-provision new Google users with role `TECHNICIAN` under default tenant `Apex Power Generation`.
4. Issue short-lived JWT (15m) + revocable Refresh Token cookie (7d).
5. Append immutable audit trail: `AUTH_GOOGLE_SSO_SUCCESS`.

---

### 3. Frontend Integration (`frontend/`)
1. Install official Google OAuth package:
   ```bash
   cd frontend
   npm install @react-oauth/google
   ```
2. Wrap `App.tsx` or `main.tsx` with `<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>`.
3. In `frontend/src/pages/Login.tsx`:
   - Replace simulated SSO with `<GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />`.
   - Forward credential `idToken` to `api.auth.google(credentialResponse.credential)`.
   - On success, redirect to `/` (Telemetry Dashboard).

---

## ✅ Acceptance Criteria (Definition of Done)
1. Clicking **"Sign in with Google"** triggers the official Google account prompt.
2. User selects an account, receives valid ID token, and backend verifies token signature against Google public certs.
3. User is matched or auto-created in PostgreSQL database with role and tenant scoping.
4. User lands on the SoundGrid Sentinel industrial telemetry dashboard.
5. All 28 existing backend and inference tests continue to pass without regression.
