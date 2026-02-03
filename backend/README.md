# Click Aloysius Backend (Express + MongoDB + Supabase)

## Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Supabase project (free tier is fine) with a storage bucket (default: `event-photos`)
- Optional: Python face service (see `face-service` folder)

## Quick start
```bash
cd backend
cp .env.example .env
# fill Supabase + MongoDB values
npm install
npm run dev
```

The API runs on `http://localhost:4000` by default.

## Important environment variables
- `MONGODB_URI` – Mongo connection string
- `SUPABASE_URL` – your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` – service role key (kept server-side only)
- `SUPABASE_ANON_KEY` – optional; used for forwarding to clients if needed
- `SUPABASE_STORAGE_BUCKET` – storage bucket name (default `event-photos`)
- `ALLOWED_ORIGINS` – comma-separated origins for CORS (e.g., `http://localhost:5173`)
- `FACE_SERVICE_URL` – URL of the Python embedding service (optional)

## Core routes
- `GET /api/health` – liveness probe
- `GET /api/auth/me` – returns Supabase-authenticated user profile + role
- `GET /api/events` – public event list
- `POST /api/events` (staff/admin) – create event
- `PUT /api/events/:id` (staff/admin) – update event
- `DELETE /api/events/:id` (admin) – delete event
- `POST /api/photos/prepare-upload` (approved uploader) – get signed upload URL + create pending photo record
- `GET /api/photos/pending` (staff/admin) – review queue
- `POST /api/photos/:id/approve` (staff/admin) – approve + attach public URL (+ optional embedding)
- `POST /api/photos/:id/reject` (staff/admin)
- `GET /api/photos/event/:eventId` – approved photos for an event
- `GET /api/photos/my` – uploads by current user
- `POST /api/photos/face-search` – search approved photos by embedding (requires stored embeddings)

Uploads are direct to Supabase Storage using signed URLs. The backend never stores image binaries.
