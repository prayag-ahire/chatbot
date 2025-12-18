# ProWorker AI Assistant - Monorepo

Complete AI-powered assistant for workers to manage their professional services.

## 🏗️ Project Structure

```
proworker-ai-assistant/
│
├── frontend/                    # React/TypeScript UI (Port 5173)
│   ├── App.tsx                 # Main chat interface
│   ├── components/             # React components
│   ├── services/               # API & data services
│   ├── package.json
│   └── README.md
│
├── server/                      # Express.js Backend (Port 3001)
│   ├── index.js                # Express server with Gemini integration
│   ├── package.json
│   ├── .env                    # Backend config
│   └── README.md
│
├── SETUP.md                     # Complete setup guide
├── QUICK_START.md               # Quick reference card
└── README.md                    # This file
```

## 🚀 Quick Start (3 Steps)

### Step 1: Terminal 1 - Start Backend
```bash
cd server
npm install
npm run dev
```

Expected output:
```
✅ ProWorker API running on http://localhost:3001
```

### Step 2: Terminal 2 - Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### Step 3: Open Browser
```
http://localhost:5173
```

That's it! The app is ready to use! 🎉

## 🔐 Security Architecture

```
Public Internet
    │
    └─→ Frontend (http://localhost:5173)
        │
        └─→ Backend API (http://localhost:3001)
            │
            └─→ Gemini AI ✅ (Keys Hidden)
            
Supabase Database ↔ Worker Data
```

**Key Security Features:**
- ✅ Gemini API key ONLY on backend
- ✅ Frontend never exposes API keys
- ✅ CORS restricted to frontend URL
- ✅ Backend validates all requests

## 📦 Tech Stack

### Frontend
- React 19 + TypeScript
- Tailwind CSS
- Supabase JS Client
- Lucide React Icons
- Vite bundler

### Backend
- Express.js
- Google Gemini AI
- Node.js environment
- CORS middleware

## 🔧 Environment Configuration

### Frontend (`frontend/.env.local`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your_anon_key_here
VITE_API_URL=http://localhost:3001
```

### Backend (`server/.env`)
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

## 🎯 API Endpoints

### Health Check
```
GET http://localhost:3001/api/health
```
Response: `{ "status": "API is running", "timestamp": "..." }`

### Chat
```
POST http://localhost:3001/api/chat
Content-Type: application/json

{
  "userQuestion": "What's my rank?",
  "workerContext": { /* worker data */ }
}
```
Response:
```json
{
  "success": true,
  "response": "You're ranked #3 out of 50...",
  "timestamp": "..."
}
```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [SETUP.md](SETUP.md) | Step-by-step installation & configuration |
| [QUICK_START.md](QUICK_START.md) | Commands quick reference |
| [frontend/README.md](frontend/README.md) | Frontend details & deployment |
| [server/README.md](server/README.md) | Backend API documentation |

## ✨ Features

### Chat Interface
- Real-time messaging with AI assistant
- Markdown response formatting
- Auto-scroll to latest messages
- Loading indicators

### Worker Dashboard
- Profile with photo & profession
- Current rating & completed orders
- Performance tips & suggestions

### AI Assistant
- **Query Intent Detection** - Understands what you're asking
- **Performance Analysis** - Analyzes your work metrics
- **Ranking Comparisons** - Shows where you stand vs peers
- **Smart Recommendations** - Suggests how to improve
- **Data Privacy** - Never shares your data publicly

## 🚨 Troubleshooting

### Backend won't start
```bash
# Check if port 3001 is in use
lsof -i :3001
# Kill the process using that port
kill -9 <PID>
```

### Frontend can't connect to backend
- [ ] Backend running on port 3001?
- [ ] Check `VITE_API_URL` in `frontend/.env.local`
- [ ] Check browser console for errors
- [ ] CORS error? Check `FRONTEND_URL` in `server/.env`

### Supabase connection failed
- [ ] Check credentials in `frontend/.env.local`
- [ ] Internet connection working?
- [ ] Supabase project active?

### Port already in use
```bash
# Frontend on different port
cd frontend
npm run dev -- --port 5174
```

## 📖 How It Works

1. **User** types a question in the chat
2. **Frontend** sends request to backend API
3. **Backend** receives question + worker context data
4. **Gemini AI** analyzes the data and generates response
5. **Backend** returns response to frontend
6. **Frontend** displays answer with markdown formatting

## 🚀 Deployment

### Deploy Frontend
Options: Vercel, Netlify, GitHub Pages

### Deploy Backend
Options: Railway, Render, Heroku, AWS

**Important:** Update `VITE_API_URL` in frontend to point to deployed backend!

## 🔑 Get Your API Keys

1. **Gemini API Key**
   - Go to [https://ai.google.dev/](https://ai.google.dev/)
   - Click "Get API Key"
   - Add to `server/.env`

2. **Supabase Credentials**
   - Go to [https://supabase.com/](https://supabase.com/)
   - Create/select project
   - Get URL & anon key
   - Add to `frontend/.env.local`

## 📱 Responsive Design

- ✅ Works on desktop
- ✅ Works on tablets
- ✅ Works on mobile phones
- ✅ Auto-scaling sidebar
- ✅ Touch-friendly buttons

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Supabase Guide](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)

## 💡 Pro Tips

1. Keep both servers running during development
2. Check browser console for debugging
3. Check server logs for backend errors
4. Use `.env.local` for sensitive data
5. Never commit `.env` files to git

## 🎉 You're All Set!

```bash
# Start Backend (Terminal 1)
cd server
npm run dev

# Start Frontend (Terminal 2)
cd frontend
npm run dev

# Open Browser
http://localhost:5173
```

## ❓ Need Help?

- Check [SETUP.md](SETUP.md) for detailed instructions
- Review [server/README.md](server/README.md) for API details
- Check [frontend/README.md](frontend/README.md) for UI details

---

Built with ❤️ for ProWorker | Powered by Google Gemini AI
