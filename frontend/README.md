# WanderAI — Frontend

React + Vite frontend for the AI Travel Itinerary Generator.

## Stack
- React 18 + Vite
- React Router v6
- MUI v5 (dark theme)
- Axios
- React Dropzone

## Pages
| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Sign in |
| `/register` | Create account |
| `/dashboard` | Trip list, stats, search |
| `/upload` | Upload documents → generate itinerary |
| `/itinerary/:id` | Full itinerary view (Timeline, Info, Bookings tabs) |
| `/share/:id` | Public shareable view (no login required) |

## Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

```env
VITE_API_URL=http://localhost:5000/api
```

In production point this at your Render backend URL.

## Deployment on Vercel

1. Push `frontend/` to GitHub
2. Import the repo in Vercel
3. Set root directory to `frontend`
4. Add env var: `VITE_API_URL=https://your-backend.onrender.com/api`
5. Deploy

## Features

- JWT auth with auto-logout on 401
- Drag-and-drop multi-file upload with progress bar
- Live OCR processing feedback
- AI generation loading state
- Day-by-day timeline with expandable accordion
- Tabbed itinerary view (Timeline / Info & Tips / Bookings)
- One-click share link copy
- Download itinerary as text file
- Public shared view with CTA
- Mobile responsive via MUI Grid + Drawer nav
- Sticky nav with blur backdrop
