# EXAMIN_BACKEND

Express + MongoDB backend that uses Firebase Authentication (ID tokens) for auth and Bearer headers from the frontend.

## Endpoints

User/Profile:
- POST `/api/users` (auth): create or update the current user's profile in MongoDB.
- GET `/api/me` (auth): fetch the current user's profile.

Uploads:
- POST `/api/upload` (auth, multipart): upload a file (see frontend usage).

Blogs:
- GET `/api/blogs` – list blogs. Query params:
   - `search` (string) text search in title + content
   - `location` (string) case-insensitive substring match on saved location text
   - `minLikes` (number) minimum like count
   - `minComments` (number) minimum comments count
   - `near=lat,lng` (numbers) + optional `radiusKm` (number, default 5) geospatial search using saved coordinates
- POST `/api/blogs` (auth) – create blog `{ title, content, location?, lat?, lng? }`
- GET `/api/blogs/:id` – fetch single blog
- POST `/api/blogs/:id/like` (auth) – toggle like (removes dislike if present)
- POST `/api/blogs/:id/dislike` (auth) – toggle dislike (removes like if present)
- GET `/api/blogs/:id/comments` – list comments (latest first)
- POST `/api/blogs/:id/comments` (auth) – add comment `{ content }`
- GET `/api/geocode?q=Delhi` – optional photon/nominatim passthrough (frontend can also hit services directly)

Response format for a blog:
```jsonc
{
   "id": "...",
   "title": "...",
   "content": "...",
   "author": "<userId>",
   "location": "Delhi, India",
   "coordinates": { "lat": 28.6139, "lng": 77.2090 },
   "likes": 3,
   "dislikes": 0,
   "commentsCount": 5,
   "createdAt": "2025-11-15T10:00:00.000Z",
   "updatedAt": "2025-11-15T10:05:00.000Z"
}
```

## Setup

1. Copy `.env.example` to `.env` and set:
    - `PORT=4000`
    - `MONGO_URI` to your MongoDB connection string
    - `FIREBASE_SERVICE_ACCOUNT_JSON` to your Firebase Admin service account JSON (as a single line JSON string). You can create this in Firebase Console > Project Settings > Service Accounts > Generate new private key; then paste the entire JSON here.

2. Install deps and run:

```bash
npm install
npm run dev
```

The API listens on `http://localhost:4000` by default.

## Auth flow

1. Frontend signs up or signs in the user using Firebase Web SDK and obtains an ID token.
2. Each API request includes `Authorization: Bearer <idToken>` header.
3. Backend verifies the ID token with Firebase Admin and sets `req.firebaseUid` + `req.user`.
4. Controllers operate on MongoDB documents keyed by `firebaseUid` / `_id`.

## Notes

- Geospatial filtering requires MongoDB with geospatial index (created automatically on `locationCoords`). Ensure your cluster supports this feature.
- Location autocomplete in frontend prioritises Photon then falls back to Nominatim; backend proxy is optional.
- Like/dislike are stored as user id arrays; repeated toggles remove the previous reaction.
- `commentsCount` is denormalised for quick listing filtering.
