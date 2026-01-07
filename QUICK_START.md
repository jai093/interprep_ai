# Quick Start Guide - MongoDB & Backend Setup

## 🎯 What's New

Your InterpreAI project now has:
✅ Node.js/Express backend server  
✅ MongoDB database integration  
✅ JWT authentication system  
✅ REST API for all operations  
✅ Frontend API service layer  
✅ Offline fallback support  

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create Environment File
```bash
# Copy the example
cp .env.example .env

# Edit .env and update MongoDB URI:
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/interprepai

# For MongoDB Atlas (cloud):
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/interprepai
```

### Step 3: Start Both Frontend & Backend
```bash
npm run dev
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

---

## 📂 Project Structure

```
interprepai_final/
├── backend/                    # NEW - Node.js/Express backend
│   ├── config/                # MongoDB & JWT config
│   ├── controllers/           # API logic
│   ├── middleware/            # Authentication & validation
│   ├── models/                # MongoDB schemas
│   ├── routes/                # API endpoints
│   ├── utils/                 # Helper functions
│   └── server.ts             # Main server file
│
├── services/                   # NEW - Frontend API clients
│   ├── apiClient.ts          # HTTP client
│   ├── authService.ts        # Auth operations
│   ├── candidateService.ts   # Candidate API calls
│   ├── recruiterService.ts   # Recruiter API calls
│   └── assessmentService.ts  # Assessment API calls
│
├── context/AppContext.tsx     # UPDATED - Uses backend API
├── package.json               # UPDATED - New dependencies
├── vite.config.ts             # UPDATED - API proxy
├── .env.example               # NEW - Config template
├── BACKEND_SETUP.md           # NEW - Detailed guide
└── IMPLEMENTATION_SUMMARY.md  # NEW - Full documentation
```

---

## 🔑 Key Files to Know

| File | Purpose |
|------|---------|
| `backend/server.ts` | Main Express server |
| `backend/config/db.ts` | MongoDB connection |
| `backend/middleware/auth.ts` | JWT verification |
| `context/AppContext.tsx` | Frontend state management |
| `services/apiClient.ts` | HTTP requests |
| `.env` | Configuration |

---

## 🚀 Running Different Ways

**Option 1: Run Both Together (Recommended)**
```bash
npm run dev
```

**Option 2: Run Separately**
```bash
# Terminal 1 - Frontend
npm run dev:client

# Terminal 2 - Backend
npm run dev:server
```

**Option 3: Run for Production**
```bash
npm run build      # Build frontend
npm run start      # Start backend (requires build first)
```

---

## 🧪 Test It Out

### 1. Sign Up
1. Go to http://localhost:3000
2. Click "Sign Up"
3. Fill in the form with:
   - Name: Your Name
   - Email: test@example.com
   - Password: password123
   - Role: Candidate or Recruiter
4. Click Sign Up
5. Data is now saved in MongoDB! 🎉

### 2. Check Backend
```bash
# Health check
curl http://localhost:5000/health

# Should return:
# {"status":"Server is running"}
```

### 3. Login
1. Go to http://localhost:3000/login
2. Use: test@example.com / password123
3. You're logged in and ready to use the app!

---

## 📋 API Endpoints Quick Reference

```
Authentication
POST   /api/auth/signup           - Create account
POST   /api/auth/login            - Login
POST   /api/auth/logout           - Logout
GET    /api/auth/me               - Current user
DELETE /api/auth/account          - Delete account

Candidate
GET    /api/candidate/profile     - Get profile
PUT    /api/candidate/profile     - Update profile
GET    /api/candidate/roadmap     - Get roadmap
PUT    /api/candidate/roadmap     - Update roadmap
GET    /api/candidate/interviews  - Get interviews
POST   /api/candidate/interviews  - Save interview

Recruiter
GET    /api/recruiter/profile     - Get profile
PUT    /api/recruiter/profile     - Update profile
GET    /api/recruiter/settings    - Get settings
PUT    /api/recruiter/settings    - Update settings
GET    /api/recruiter/assessments - Get assessments
POST   /api/recruiter/assessments - Create assessment
DELETE /api/recruiter/assessments/:id - Delete
GET    /api/recruiter/results     - Get results

Public Assessments
GET    /api/assessments/:id       - Get assessment
POST   /api/assessments/:id/submit - Submit result
```

---

## ⚙️ Environment Variables

**Required:**
```
MONGODB_URI=mongodb://localhost:27017/interprepai
JWT_SECRET=your-secret-key
PORT=5000
```

**Optional (with defaults):**
```
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
GEMINI_API_KEY=your-key
API_URL=http://localhost:5000
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill the process if needed (Windows)
taskkill /PID <PID> /F
```

### MongoDB connection error
```bash
# Make sure MongoDB is running
# Local: mongod should be running
# Cloud: Check connection string in .env
```

### Frontend can't reach backend
```bash
# Check if backend is running on 5000
curl http://localhost:5000/health

# Verify CORS_ORIGIN in .env matches frontend URL
```

### Clear browser data
```javascript
// In browser console:
localStorage.clear();
location.reload();
```

---

## 📚 Learn More

- **Backend Guide**: See `BACKEND_SETUP.md`
- **Full Documentation**: See `IMPLEMENTATION_SUMMARY.md`
- **Express Docs**: https://expressjs.com
- **Mongoose Docs**: https://mongoosejs.com

---

## 🎓 Common Tasks

### Create a New User Programmatically
```javascript
const user = await fetch('http://localhost:5000/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'secure123',
    role: 'candidate'
  })
});
```

### Call Backend API from Code
```typescript
import { candidateService } from './services/candidateService';

// Get profile
const profile = await candidateService.getProfile();

// Update profile
await candidateService.updateProfile({
  fullName: 'New Name',
  skills: ['React', 'TypeScript']
});
```

### Add New API Endpoint

1. Create controller in `backend/controllers/`
2. Create route in `backend/routes/`
3. Add route to `backend/server.ts`
4. Create service in `services/`
5. Call from `AppContext.tsx`

---

## 📊 Architecture

```
User Browser (3000)
    ↓ HTTP/JSON
Frontend (React + Vite)
    ↓ /api requests
Backend Server (5000)
    ↓ Database queries
MongoDB
```

---

## ✅ Checklist

- [ ] `npm install` completed
- [ ] `.env` file created with MONGODB_URI
- [ ] MongoDB is running (local or cloud connection works)
- [ ] `npm run dev` starts successfully
- [ ] Frontend loads at http://localhost:3000
- [ ] Backend runs at http://localhost:5000
- [ ] Can sign up and data appears in MongoDB
- [ ] Can log back in with saved credentials

---

## 🚀 Next Steps

1. **Start Development**
   - `npm run dev`
   - Build features using the API

2. **Add Tests**
   - Create test files alongside controllers
   - Test API endpoints

3. **Deploy**
   - Frontend to Vercel/Netlify
   - Backend to Heroku/Render/AWS

4. **Optimize**
   - Add database indexing
   - Implement caching
   - Add rate limiting

---

## 💡 Pro Tips

- Use `mongodb://localhost:27017` for local development
- Use `mongodb+srv://...` for MongoDB Atlas (cloud)
- Keep `.env` out of version control (add to `.gitignore`)
- Use different JWT secrets for dev and production
- Enable HTTPS in production
- Monitor backend logs with Morgan

---

**You're all set! Start coding with: `npm run dev`** 🚀
