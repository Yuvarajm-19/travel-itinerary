# AI Travel Itinerary Generator

Upload your travel booking documents and get a complete AI-powered itinerary instantly.

# LIVE LINK
https://travel-itinerary-git-main-yuvarajs-projects-7f92f4d9.vercel.app

## Tech Stack

- **Frontend** — React, Vite, Material UI, React Router
- **Backend** — Node.js, Express
- **Database** — MongoDB Atlas
- **AI** — Google Gemini API
- **OCR** — Tesseract.js (images), pdf-parse (PDFs)
- **Auth** — JWT + bcrypt

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Yuvarajm-19/travel-itinerary.git
cd travel-itinerary
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill in your `.env`:

```env
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
```

```bash
npm run dev
# Runs on http://localhost:5000
```

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

> No frontend `.env` needed for local development — requests are proxied automatically.

## Features

- Upload flight tickets, hotel bookings, train and bus tickets (PDF, JPG, PNG)
- AI extracts and understands your booking details
- Generates a full day-by-day itinerary with recommendations and packing list
- Dashboard to manage all your trips
- One-click share link for each itinerary (public, no login required)
- Download itinerary as a file

## API Endpoints

```
POST   /api/auth/register       Create account
POST   /api/auth/login          Login
GET    /api/auth/me             Get profile

POST   /api/upload              Upload & OCR documents

POST   /api/itinerary/generate  Generate AI itinerary
GET    /api/itinerary           List all trips
GET    /api/itinerary/:id       Get one trip
DELETE /api/itinerary/:id       Delete trip

GET    /api/share/:shareId      Public share view
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Any long random string |
| `GEMINI_API_KEY` | ✅ | From [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `CLIENT_URL` | No | Frontend URL for CORS (default: `http://localhost:5173`) |
| `PORT` | No | Server port (default: `5000`) |

## Deployment

**Backend → Render**
- Build command: `npm install`
- Start command: `npm start`
- Add all env vars from the table above + set `NODE_ENV=production`

**Frontend → Vercel**
- Root directory: `frontend`
- Add env var: `VITE_API_URL=https://your-backend.onrender.com/api`

## License

MIT
