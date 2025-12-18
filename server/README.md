# ProWorker Backend API

A Node.js/Express backend API for the ProWorker AI Assistant that securely handles Gemini AI requests.

## Features

✅ Secure API key management (not exposed in frontend)
✅ CORS enabled for frontend communication
✅ Health check endpoint
✅ Smart query intent detection
✅ Worker comparison analytics
✅ Monthly trend analysis
✅ Production-ready error handling

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

Create a `.env` file in the `server` folder (or copy from `.env.example`):

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Get your Gemini API Key:**
1. Go to [https://ai.google.dev/](https://ai.google.dev/)
2. Click "Get API Key"
3. Create a new API key
4. Copy it and paste in `.env`

### 3. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Health Check
```
GET /api/health
```
Returns: `{ status: 'API is running', timestamp: '2024-12-14T...' }`

### Chat
```
POST /api/chat
Content-Type: application/json

{
  "userQuestion": "What's my rank?",
  "workerContext": { /* worker data from Supabase */ }
}
```

Response:
```json
{
  "success": true,
  "response": "You're ranked #3 out of 50 electricians...",
  "timestamp": "2024-12-14T..."
}
```

## Frontend Integration

The frontend is already configured to use the API. In `App.tsx`:

```typescript
import { sendChatMessage, checkApiHealth } from './services/apiClient';

// Check if API is healthy
const isHealthy = await checkApiHealth();

// Send a message
const response = await sendChatMessage(userQuestion, workerContext);
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Your Gemini API key | ✅ Yes |
| `PORT` | Server port (default: 3001) | ❌ No |
| `NODE_ENV` | Environment (development/production) | ❌ No |
| `FRONTEND_URL` | Frontend URL for CORS | ❌ No |

## Troubleshooting

### API Connection Failed
```
⚠️ Backend API not connected - make sure server is running on port 3001
```
**Solution:** Start the backend server with `npm run dev` in the `server` folder

### API Key Error
```
Error: Invalid API Key
```
**Solution:** Check your `.env` file has the correct `VITE_GEMINI_API_KEY`

### CORS Error
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Solution:** Make sure `FRONTEND_URL` in `.env` matches your frontend URL (default: `http://localhost:5173`)

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Solution:** Either:
1. Stop the process using port 3001
2. Change `PORT` in `.env` to a different port

## Architecture

```
Frontend (React/Vite)
    ↓ (HTTP POST)
API Client (apiClient.ts)
    ↓
Backend API (Express)
    ↓
Gemini AI Service
    ↓
Response (streamed back to frontend)
```

## Security Features

- ✅ API key never exposed in frontend
- ✅ CORS enabled only for configured frontend URL
- ✅ Input validation on all endpoints
- ✅ Error messages safe for production
- ✅ Environment variable configuration

## Running Both Frontend & Backend

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

Visit `http://localhost:5173` to use the app!

## Performance Tips

- The API handles up to 60 requests per minute per default quota
- Responses typically take 1-3 seconds
- Worker context is sent with each request for fresh analysis
- Consider adding caching for frequently asked questions

## Future Enhancements

- [ ] Add conversation history storage (PostgreSQL)
- [ ] Implement streaming responses for faster UI updates
- [ ] Add request rate limiting per user
- [ ] Add analytics tracking
- [ ] Implement response caching

## Support

For issues with:
- **Gemini API**: Check [https://ai.google.dev/docs](https://ai.google.dev/docs)
- **Express**: Check [https://expressjs.com](https://expressjs.com)
- **CORS**: Check [https://www.npmjs.com/package/cors](https://www.npmjs.com/package/cors)
