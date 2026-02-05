# GO

## Location Search (Free / No API Key)

The journey tracker now uses free open data services (Photon + fallback to OpenStreetMap Nominatim) for location autocomplete and geocoding.

Highlights:
- No API key or billing details required.
- Debounced queries (450ms) to stay polite.
- Photon queried first (fast & good global coverage), falls back to Nominatim if empty or failing.
- Results limited (max 5) to reduce bandwidth.
- Selecting a result stores its coordinates & locks them once journey starts.

Attribution: Data © OpenStreetMap contributors.

If you self-host or scale this feature, add a proper User-Agent + referer header and consider a local geocoding proxy with caching to respect provider usage policies.

## Authentication (Firebase + MongoDB)

Frontend uses Firebase Authentication for signup/signin and issues the Firebase ID token as a Bearer token to the backend. Profiles and domain data live in MongoDB (via the backend API).

### Environment Variables
Copy `.env.example` to `.env` and fill the Firebase keys & API base URL.

### Frontend Flow
1. User creates account on `#/student-signup` (email + password + profile details). Password is never sent to backend.
2. Firebase returns ID token; frontend calls `POST /api/users` with Bearer token to store profile.
3. Sign-in (`#/signin`) acquires ID token again; protected calls use `api.js` wrapper.
4. Forgot password (`#/forgot-password`) sends reset email via Firebase directly.

### Backend Verification
Backend (in `EXAMIN_BACKEND`) uses Firebase Admin to verify ID tokens. Express middleware attaches `req.firebaseUid` and loads the user profile.

### Adding Auth to New Requests
Use the `api.js` helper: `api.get('/me', { auth: idToken })` to include Authorization automatically.
