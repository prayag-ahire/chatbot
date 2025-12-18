# ProWorker Frontend

React/TypeScript frontend for the ProWorker AI Assistant.

## Features

- 🎨 Modern UI with Tailwind CSS
- 💬 Real-time chat interface
- 📊 Worker performance dashboard
- 🔌 API-based architecture (calls backend)
- 📱 Responsive design (desktop & mobile)
- ⚡ Real-time data from Supabase

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment

Create `.env.local` with your credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your_anon_key
VITE_API_URL=http://localhost:3001
```

### 3. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Project Structure

```
frontend/
├── App.tsx                    # Main app component
├── index.tsx                  # React entry point
├── index.html                 # HTML template
├── types.ts                   # TypeScript interfaces
├── supabaseClient.ts          # Supabase initialization
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript config
├── package.json               # Dependencies

├── components/
│   ├── ChatBubble.tsx         # Chat message bubble component
│   └── LoadingDots.tsx        # Loading indicator

├── services/
│   ├── apiClient.ts           # Backend API client
│   └── dataService.ts         # Supabase data fetching

└── .env.local                 # Environment variables (git ignored)
```

## Key Components

### App.tsx
Main application component featuring:
- Sidebar with worker profile
- Chat interface
- Real-time message handling
- API health checks

### ChatBubble.tsx
Renders individual chat messages with:
- Markdown support
- Timestamps
- User/Assistant styling

### apiClient.ts
Communicates with backend:
```typescript
// Send message to backend
const response = await sendChatMessage(question, workerContext);

// Check if API is healthy
const isHealthy = await checkApiHealth();
```

### dataService.ts
Fetches worker data from Supabase:
```typescript
const workerData = await fetchWorkerData(workerId);
```

## Available Scripts

### Development
```bash
npm run dev
```
Start Vite dev server with hot reload.

### Build
```bash
npm run build
```
Create production-optimized build.

### Preview
```bash
npm run preview
```
Preview production build locally.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ Yes |
| `VITE_SUPABASE_KEY` | Supabase anon key | ✅ Yes |
| `VITE_API_URL` | Backend API URL | ✅ Yes |

## Dependencies

- **react** - UI library
- **react-dom** - React DOM rendering
- **lucide-react** - Icon library
- **react-markdown** - Markdown rendering
- **@supabase/supabase-js** - Supabase client
- **tailwindcss** - CSS framework

## Architecture

```
Frontend App
    │
    ├─→ Supabase (Worker Data)
    │   ├─ Profile
    │   ├─ Orders
    │   ├─ Reviews
    │   └─ Analytics
    │
    └─→ Backend API (Chat)
        └─ Gemini AI (Responses)
```

## API Integration

The frontend uses the backend API for chat:

```typescript
import { sendChatMessage } from './services/apiClient';

// In App.tsx
const response = await sendChatMessage(userQuestion, workerContext);
```

**Endpoint:** `POST http://localhost:3001/api/chat`

**Body:**
```json
{
  "userQuestion": "What's my rank?",
  "workerContext": { /* worker data */ }
}
```

## Troubleshooting

### API Not Connected
```
Backend API is not connected. Please start the server on port 3001.
```
**Solution:** Ensure backend is running with `npm run dev` in the `server/` folder.

### Supabase Connection Failed
```
Failed to load profile: Supabase error
```
**Solution:** Check `.env.local` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY`.

### Port 5173 Already in Use
```bash
npm run dev -- --port 5174
```

## Deployment

### Vercel
```bash
npm run build
# Push to GitHub, connect Vercel
```

### Netlify
```bash
npm run build
# Drag & drop `dist/` folder
```

### Environment Variables on Deployment
Set these in your platform's dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`
- `VITE_API_URL` (your backend URL)

## Development Tips

1. **Hot Reload:** Changes are reflected instantly
2. **DevTools:** Check `vite.config.ts` for source maps
3. **Markdown:** Chat responses use markdown formatting
4. **Tailwind:** All styling via `index.html` CDN

## Resources

- [React Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase Docs](https://supabase.com/docs)

---

Built with ❤️ for ProWorker
