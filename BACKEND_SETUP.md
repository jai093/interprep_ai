# InterpreAI - MongoDB & Backend Integration Guide

## Project Overview

The InterpreAI project has been fully integrated with MongoDB and a Node.js/Express backend. Previously, all data was stored in browser localStorage. Now, the system uses a robust backend with database persistence while maintaining fallback support for offline scenarios.

## Architecture

### Frontend (Vite + React)
- **Client Port**: 3000
- **Files**: Root directory TypeScript/React files and components
- **Services**: `services/` directory with API client and service layers

### Backend (Express + Node.js)
- **Server Port**: 5000
- **Files**: `backend/` directory
- **Database**: MongoDB (local or cloud connection)

## Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas cloud instance)
- npm or yarn

### 1. Install Dependencies

```bash
npm install
```

This will install all frontend and backend dependencies including:
- Express.js (backend framework)
- Mongoose (MongoDB ODM)
- JWT (authentication)
- bcryptjs (password hashing)
- CORS (cross-origin requests)
- Morgan (logging)

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/interprepai
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/interprepai

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_REFRESH_EXPIRES_IN=30d

# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Google API Key (for Gemini)
GEMINI_API_KEY=your-gemini-api-key

# Frontend API URL
API_URL=http://localhost:5000
```

### 3. Set Up MongoDB

#### Option A: Local MongoDB
```bash
# Install MongoDB locally and start the service
mongod
```

#### Option B: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster and get connection string
3. Update `MONGODB_URI` in `.env`

### 4. Start the Development Server

Use the concurrent dev script that runs both frontend and backend:

```bash
npm run dev
```

This will:
- Start Vite dev server on `http://localhost:3000`
- Start Express backend on `http://localhost:5000`
- Proxy `/api` requests from frontend to backend

**Alternatively**, run them separately:

```bash
# Terminal 1: Start frontend
npm run dev:client

# Terminal 2: Start backend
npm run dev:server
```

## Directory Structure

```
interprepai_final/
├── backend/
│   ├── config/
│   │   ├── db.ts          # MongoDB connection
│   │   └── constants.ts   # JWT & server config
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── candidateController.ts
│   │   ├── recruiterController.ts
│   │   └── assessmentController.ts
│   ├── middleware/
│   │   └── auth.ts        # JWT & authorization
│   ├── models/
│   │   ├── User.ts
│   │   ├── CandidateProfile.ts
│   │   ├── RecruiterProfile.ts
│   │   ├── Assessment.ts
│   │   ├── AssessmentResult.ts
│   │   ├── CareerRoadmap.ts
│   │   ├── InterviewSession.ts
│   │   └── RecruiterSettings.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── candidateRoutes.ts
│   │   ├── recruiterRoutes.ts
│   │   └── assessmentRoutes.ts
│   ├── utils/
│   │   └── auth.ts        # JWT & password hashing
│   └── server.ts          # Main Express app
├── services/
│   ├── apiClient.ts       # HTTP client
│   ├── authService.ts
│   ├── candidateService.ts
│   ├── recruiterService.ts
│   └── assessmentService.ts
├── context/
│   └── AppContext.tsx     # Updated with backend integration
├── .env.example           # Environment variables template
└── package.json           # Updated with backend scripts
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `DELETE /api/auth/account` - Delete account

### Candidate Routes
- `GET /api/candidate/profile` - Get profile
- `PUT /api/candidate/profile` - Update profile
- `GET /api/candidate/roadmap` - Get career roadmap
- `PUT /api/candidate/roadmap` - Update career roadmap
- `GET /api/candidate/interviews` - Get interview history
- `POST /api/candidate/interviews` - Add interview session

### Recruiter Routes
- `GET /api/recruiter/profile` - Get recruiter profile
- `PUT /api/recruiter/profile` - Update recruiter profile
- `GET /api/recruiter/settings` - Get settings
- `PUT /api/recruiter/settings` - Update settings
- `GET /api/recruiter/assessments` - Get assessments
- `POST /api/recruiter/assessments` - Create assessment
- `DELETE /api/recruiter/assessments/:id` - Delete assessment
- `GET /api/recruiter/results` - Get assessment results
- `GET /api/recruiter/results/:id` - Get specific result

### Public Assessment Routes
- `GET /api/assessments/:id` - Get public assessment
- `POST /api/assessments/:id/submit` - Submit assessment result
- `GET /api/assessments/:id/results` - Get results for assessment

## Database Models

### User
- Stores user credentials with password hashing
- Fields: name, email, password (hashed), role, timestamps

### CandidateProfile
- Extends user profile with: fullName, linkedinUrl, skills, languages, profilePhotoUrl, resumeData

### RecruiterProfile
- Recruiter-specific info: fullName, company

### RecruiterSettings
- User preferences: emailNotifications, assessmentReminders, weeklyReports, autoReject, passingScore, timeLimit

### CareerRoadmap
- Stores: targetRole, skillGaps, shortTermPlan, longTermPlan

### InterviewSession
- Stores: date, type, duration, averageScore, config, transcript, summary

### Assessment
- Recruiter-created assessments: createdBy, jobRole, config, questions

### AssessmentResult
- Assessment submissions: assessment ID, candidateName, candidateEmail, session data

## Features

### ✅ Backend Integration
- Express.js REST API
- MongoDB with Mongoose ORM
- JWT authentication with token refresh
- Password hashing with bcryptjs
- Role-based access control

### ✅ Frontend Integration
- API client layer (`apiClient.ts`)
- Service layer for each domain
- AppContext updated to use backend API
- Automatic fallback to localStorage if backend fails

### ✅ Security
- Password hashing before storage
- JWT token-based authentication
- Authorization middleware for role-based routes
- CORS protection

### ✅ Error Handling
- Comprehensive error handling in controllers
- Fallback mechanisms for offline support
- Proper HTTP status codes
- Error logging

## Development

### Run Build
```bash
npm run build
```

### Run Production
```bash
npm run start
```

## Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB is running: `mongod` or check MongoDB Atlas connection
- Check connection string in `.env`
- Ensure `MONGODB_URI` is correct

### Backend Not Running
- Check if port 5000 is available
- Verify all dependencies are installed: `npm install`
- Check backend logs for errors

### Frontend Can't Connect to Backend
- Ensure backend is running on port 5000
- Check CORS_ORIGIN in `.env` matches frontend URL
- Verify proxy configuration in `vite.config.ts`

### Authentication Issues
- Clear localStorage: `localStorage.clear()`
- Check JWT_SECRET is set in `.env`
- Verify tokens are being stored correctly

## Next Steps

1. **Add More Features**:
   - Email verification
   - Password reset
   - OAuth integration
   - File upload for resumes

2. **Production Deployment**:
   - Set up environment variables for production
   - Use MongoDB Atlas or managed database service
   - Deploy backend to Heroku, Vercel, or AWS
   - Deploy frontend to Vercel or Netlify

3. **Performance Optimization**:
   - Add database indexing
   - Implement caching
   - Add API rate limiting
   - Optimize queries

4. **Testing**:
   - Add unit tests for controllers
   - Add integration tests for API routes
   - Add frontend component tests

## Support

For issues or questions, refer to:
- Express.js docs: https://expressjs.com
- Mongoose docs: https://mongoosejs.com
- React docs: https://react.dev
- Vite docs: https://vitejs.dev
