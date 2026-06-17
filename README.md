# AI Travel Itinerary Generator — Backend API

A production-quality Node.js/Express REST API that accepts travel booking documents, extracts information via OCR/PDF parsing, and generates AI-powered structured itineraries using Google Gemini.

---

## Tech Stack

| Layer           | Technology                          |
|----------------|-------------------------------------|
| Runtime         | Node.js ≥ 18                        |
| Framework       | Express.js                          |
| Database        | MongoDB Atlas + Mongoose            |
| Auth            | JWT (jsonwebtoken) + bcryptjs       |
| AI              | Google Gemini 1.5 Flash             |
| OCR (Images)    | Tesseract.js                        |
| PDF Parsing     | pdf-parse                           |
| File Uploads    | Multer                              |
| Security        | Helmet, express-rate-limit          |
| Validation      | express-validator                   |
| Deployment      | Render                              |

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── multer.js           # File upload configuration
│   ├── controllers/
│   │   ├── authController.js   # Register, login, profile
│   │   ├── uploadController.js # OCR document processing
│   │   └── itineraryController.js # CRUD + AI generation + share
│   ├── middleware/
│   │   ├── auth.js             # JWT protect + optionalAuth
│   │   ├── errorHandler.js     # 404 & global error middleware
│   │   └── validate.js         # express-validator runner
│   ├── models/
│   │   ├── User.js             # User schema + password hashing
│   │   └── Itinerary.js        # Itinerary schema + shareId
│   ├── routes/
│   │   ├── auth.js             # /api/auth/*
│   │   ├── upload.js           # /api/upload
│   │   ├── itinerary.js        # /api/itinerary/*
│   │   └── share.js            # /api/share/:shareId
│   ├── services/
│   │   ├── geminiService.js    # Gemini API integration
│   │   └── ocrService.js       # PDF + image OCR pipeline
│   ├── utils/
│   │   ├── apiResponse.js      # Standardised JSON responses
│   │   ├── fileUtils.js        # File cleanup helpers
│   │   └── jwt.js              # Token generation & verification
│   ├── uploads/                # Temp upload directory (auto-cleaned)
│   └── app.js                  # Express app setup
├── server.js                   # Entry point
├── .env.example
├── .gitignore
└── package.json
```

---

## Getting Started

### 1. Clone & Install

```bash
git clone (https://github.com/Yuvarajm-19/travel-itenerary)
cd backend
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/ai-travel-itinerary

JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d

GEMINI_API_KEY=your_gemini_api_key_here

CLIENT_URL=http://localhost:5173

MAX_FILE_SIZE=10485760
UPLOAD_PATH=./src/uploads
```

### 3. Run

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

The server starts on `http://localhost:5000`.

---

## API Reference

### Auth  `POST /api/auth/...`

| Method | Endpoint                  | Auth     | Description          |
|--------|---------------------------|----------|----------------------|
| POST   | `/api/auth/register`      | Public   | Create account       |
| POST   | `/api/auth/login`         | Public   | Login, get JWT       |
| GET    | `/api/auth/me`            | 🔒 JWT   | Get own profile      |
| PUT    | `/api/auth/me`            | 🔒 JWT   | Update name          |
| PUT    | `/api/auth/change-password` | 🔒 JWT | Change password      |

#### Register
```json
// POST /api/auth/register
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123"
}

// Response 201
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "token": "eyJ...",
    "user": { "_id": "...", "name": "Jane Doe", "email": "jane@example.com" }
  }
}
```

#### Login
```json
// POST /api/auth/login
{ "email": "jane@example.com", "password": "secret123" }
```

---

### Upload  `POST /api/upload`

Authenticated. Multipart form-data. Field name: `documents` (1-10 files).

Supported types: **PDF, JPG, JPEG, PNG** (max 10 MB each).

```bash
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer <token>" \
  -F "documents=@flight.pdf" \
  -F "documents=@hotel.jpg"
```

Response:
```json
{
  "success": true,
  "data": {
    "count": 2,
    "results": [
      {
        "success": true,
        "fileName": "flight.pdf",
        "documentType": "flight",
        "rawText": "...",
        "flight": {
          "airline": "Air India",
          "flightNumber": "AI 302",
          "departureCity": "Delhi",
          "arrivalCity": "Mumbai",
          "departureDate": "2024-12-20",
          "departureTime": "06:30",
          "arrivalTime": "08:45",
          "bookingRef": "PNR123"
        }
      }
    ]
  }
}
```

---

### Itinerary  `/api/itinerary`

| Method | Endpoint                        | Auth   | Description                 |
|--------|---------------------------------|--------|-----------------------------|
| POST   | `/api/itinerary/generate`       | 🔒 JWT | Generate & save itinerary   |
| GET    | `/api/itinerary`                | 🔒 JWT | List all (paginated, search)|
| GET    | `/api/itinerary/stats`          | 🔒 JWT | Dashboard stats             |
| GET    | `/api/itinerary/:id`            | 🔒 JWT | Get single itinerary        |
| PUT    | `/api/itinerary/:id`            | 🔒 JWT | Update title / tags         |
| DELETE | `/api/itinerary/:id`            | 🔒 JWT | Delete itinerary            |

#### Generate
```json
// POST /api/itinerary/generate
{
  "extractedData": [
    {
      "documentType": "flight",
      "rawText": "...",
      "flight": { "airline": "Air India", ... }
    },
    {
      "documentType": "hotel",
      "rawText": "...",
      "hotel": { "hotelName": "Taj Mahal Palace", ... }
    }
  ],
  "title": "Mumbai Adventure"
}
```

Response includes full `generatedItinerary` object with:
- `tripTitle`, `destination`, `startDate`, `endDate`, `duration`, `summary`
- `itineraryDays[]` — day-by-day breakdown
- `recommendations[]`, `reminders[]`, `packingSuggestions[]`
- `accommodationDetails`, `transportationDetails`
- `estimatedBudget`, `weatherInfo`

#### List with search & pagination
```
GET /api/itinerary?page=1&limit=10&search=paris
```

---

### Share  `GET /api/share/:shareId`

Public — no auth required. Returns the full itinerary if `isPublic: true`.

```
GET /api/share/550e8400-e29b-41d4-a716-446655440000
```

---

## MongoDB Schemas

### User
```js
{
  name:      String (required, 2-50 chars)
  email:     String (required, unique, lowercase)
  password:  String (required, hashed, min 6)
  isActive:  Boolean (default true)
  createdAt: Date
  updatedAt: Date
}
```

### Itinerary
```js
{
  userId:            ObjectId → User
  title:             String
  tags:              [String]
  isPublic:          Boolean (default true)
  shareId:           String (UUID, unique)
  extractedData:     [{ documentType, rawText, fileName, flight?, hotel?, train?, bus? }]
  generatedItinerary: {
    tripTitle, destination, startDate, endDate, duration, summary,
    itineraryDays: [{ day, date, title, description, activities, meals, transport, accommodation, tips }],
    recommendations, reminders, packingSuggestions,
    accommodationDetails, transportationDetails, estimatedBudget, weatherInfo
  }
  createdAt: Date
  updatedAt: Date
}
```

---

## Security

- **Helmet** sets secure HTTP headers
- **Rate limiting**: 200 req/15min globally; 20 req/15min on auth; 20 req/hour on AI generation
- **CORS** restricted to `CLIENT_URL`
- **JWT** with configurable expiry (default 7d)
- **bcryptjs** with salt rounds 12
- **File type validation** — whitelist only PDF/JPG/JPEG/PNG
- **Temp files deleted** immediately after OCR processing

---

## Deployment on Render

1. Push the `backend/` folder to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. Add all environment variables from `.env.example` in the Render dashboard
6. Set `NODE_ENV=production`

---

## Environment Variables Reference

| Variable         | Required | Description                              |
|-----------------|----------|------------------------------------------|
| `PORT`          | No       | Server port (default 5000)               |
| `NODE_ENV`      | No       | `development` / `production`             |
| `MONGODB_URI`   | ✅ Yes   | MongoDB Atlas connection string          |
| `JWT_SECRET`    | ✅ Yes   | Secret key for JWT signing (min 32 chars)|
| `JWT_EXPIRES_IN`| No       | Token expiry (default `7d`)              |
| `GEMINI_API_KEY`| ✅ Yes   | Google Gemini API key                    |
| `CLIENT_URL`    | No       | Frontend URL for CORS                    |
| `MAX_FILE_SIZE` | No       | Max upload bytes (default 10485760)      |
| `UPLOAD_PATH`   | No       | Temp upload directory                    |

---

## Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy it into `GEMINI_API_KEY` in your `.env`

Free tier: 15 requests/minute, 1M tokens/minute.

---

## License

MIT
