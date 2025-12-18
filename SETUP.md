# ProWorker AI Assistant - Full Setup Guide

## 📁 Project Structure

```
proworker-ai-assistant/
├── Frontend (React/Vite)
│   ├── App.tsx
│   ├── components/
│   ├── services/
│   └── package.json
│
└── server/ (Backend API)
    ├── index.js
    ├── .env
    └── package.json
```

## 🚀 Quick Start

### Step 1: Setup Backend API

```bash
cd server
npm install
```

Copy `.env.example` to `.env` and add your Gemini API Key:
```bash
cp .env.example .env
# Edit .env and add VITE_GEMINI_API_KEY
```

Start the backend:
```bash
npm run dev
```

You should see:
```
✅ ProWorker API running on http://localhost:3001
```

### Step 2: Setup Frontend

```bash
# In root directory
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

## 🔑 Get Your Gemini API Key

1. Go to [https://ai.google.dev/](https://ai.google.dev/)
2. Click "Get API Key" button
3. Create a new API key
4. Copy it to `server/.env`:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

## 🛠️ Commands

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Backend
```bash
npm run dev      # Start with auto-reload
npm start        # Start server
```

## ✅ Verify Setup

1. **Backend Health Check:**
   - Open `http://localhost:3001/api/health`
   - Should see: `{ "status": "API is running" }`

2. **Frontend Connection:**
   - Check browser console for no CORS errors
   - Chat should work without errors

## 📋 Troubleshooting

### Port 3001 Already in Use
```bash
# Kill process on port 3001
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :3001
kill -9 <PID>
```

### API Key Error
- Verify `VITE_GEMINI_API_KEY` is correctly set in `server/.env`
- Make sure there are no extra spaces or quotes

### CORS Error
- Frontend should be on `http://localhost:5173`
- Backend CORS is configured to accept this URL
- If using different ports, update `server/.env` `FRONTEND_URL`

### Chat Not Working
1. Check backend is running on port 3001
2. Check browser console for errors
3. Verify Gemini API key is valid
4. Check internet connection

## 📚 Architecture

```
User Input (React Frontend)
    ↓
App.tsx → sendChatMessage()
    ↓
HTTP POST to http://localhost:3001/api/chat
    ↓
Backend API (Express)
    ↓
Gemini AI Service
    ↓
Response returned to Frontend
    ↓
Display in Chat UI
```

## 🔒 Security Notes

- ✅ Gemini API key is **never** exposed in frontend
- ✅ API key is only used in backend
- ✅ CORS is enabled only for configured frontend URL
- ✅ Frontend communicates through secure HTTP requests

## 📖 Additional Resources

- [Gemini API Docs](https://ai.google.dev/docs)
- [Express.js Docs](https://expressjs.com)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)

## ❓ Need Help?

Check the detailed README files:
- Backend docs: `server/README.md`
- Frontend docs: `README.md`

---

**Happy coding! 🎉**
