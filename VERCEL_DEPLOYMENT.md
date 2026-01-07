# Vercel Deployment Guide for InterprepAI

This guide walks you through deploying InterprepAI (frontend + backend) to Vercel.

## Overview

- **Frontend**: React + TypeScript (Vite)
- **Backend**: Express.js (deployed as Vercel serverless functions via `/api` routes)
- **Database**: MongoDB (must be cloud-hosted, e.g., MongoDB Atlas)

## Prerequisites

1. Vercel account (sign up at https://vercel.com)
2. MongoDB Atlas account (free tier available at https://www.mongodb.com/cloud/atlas)
3. GitHub repository with this code pushed
4. Gemini API key (from Google AI Studio)

## Step 1: Set Up MongoDB Atlas (Cloud Database)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in
3. Create a free cluster
4. Get the connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/db`)
5. Keep this string safe—you'll use it in Vercel env vars

## Step 2: Prepare Your Project

1. Ensure `vercel.json` is in the root directory (already created)
2. Ensure `api/handler.ts` exists (already created)
3. Commit and push all changes to GitHub:
   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   git push origin main
   ```

## Step 3: Import Project into Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Select "Import Git Repository"
4. Connect your GitHub account and select the InterprepAI repository
5. Click "Import"

## Step 4: Configure Environment Variables in Vercel

After importing, you'll be prompted to set Environment Variables. Add the following:

### Required Variables (for all environments: Production, Preview, Development)

| Variable | Value | Example |
|----------|-------|---------|
| `MONGODB_URI` | Your MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/interprepai` |
| `JWT_SECRET` | A strong random string (change from the example!) | Generate with: `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | A different strong random string | Generate with: `openssl rand -hex 32` |
| `GEMINI_API_KEY` | Your Gemini API key from Google AI Studio | `AIzaSy...` |
| `CORS_ORIGIN` | Your frontend URL (auto-populated by Vercel) | `https://interprepai-olive.vercel.app` |

### Optional Variables

| Variable | Value | Example |
|----------|-------|---------|
| `VITE_API_URL` | Leave empty (uses relative `/api/...` paths) | (leave blank) |
| `VITE_GEMINI_API_KEY` | Same as `GEMINI_API_KEY` (exposed to frontend) | `AIzaSy...` |
| `NODE_ENV` | `production` | `production` |

**Important**: Do NOT store these secrets in your `.env.local` file in the repo. Use Vercel's UI only.

## Step 5: Configure for MongoDB Atlas

Before deploying, ensure your MongoDB cluster allows connections from Vercel:

1. In MongoDB Atlas, go to Network Access
2. Click "Add IP Address"
3. Select "Allow access from anywhere" (or specify `0.0.0.0/0` for development)
4. Confirm

## Step 6: Deploy

1. After setting all environment variables in Vercel, click "Deploy"
2. Wait for the build to complete (2–5 minutes)
3. Once deployed, you'll see your project URL, e.g., `https://interprepai-olive.vercel.app`

## Step 7: Verify Deployment

### Test Backend Health

```bash
curl https://interprepai-olive.vercel.app/api/health
```

Expected response:
```json
{"status":"Server is running"}
```

### Test Frontend

1. Visit https://interprepai-olive.vercel.app
2. Open DevTools (F12) → Network tab
3. Try signing up or logging in
4. Confirm requests go to `/api/auth/...` (not `localhost:5000`)
5. Check for CORS errors in the Console

## Step 8: Update Environment Variables After Deployment

If you need to update environment variables later:

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Update the variable
3. Redeploy by going to Deployments tab and clicking "Redeploy" on the latest deployment

## Troubleshooting

### Issue: `net::ERR_CONNECTION_REFUSED` on login/signup

**Cause**: Frontend is trying to reach `http://localhost:5000` instead of the Vercel backend.

**Fix**:
- Ensure `VITE_API_URL` is NOT set in Vercel (or is empty)
- Rebuild and redeploy: In Vercel Dashboard, go to Deployments and click "Redeploy" on the latest deployment

### Issue: CORS errors in the browser console

**Cause**: `CORS_ORIGIN` on backend doesn't include your frontend URL.

**Fix**:
- In Vercel Settings → Environment Variables, update `CORS_ORIGIN` to include your frontend URL:
  ```
  https://interprepai-olive.vercel.app
  ```
- Redeploy

### Issue: Database connection failed

**Cause**: 
- MongoDB Atlas cluster is not accessible from Vercel
- Connection string is invalid

**Fix**:
- Verify the `MONGODB_URI` in Vercel env vars (copy directly from MongoDB Atlas)
- Ensure network access is allowed in MongoDB Atlas (Network Access → Allow access from anywhere)
- Test the connection string locally first:
  ```bash
  mongosh "mongodb+srv://user:pass@cluster.mongodb.net/db"
  ```

### Issue: 502 Bad Gateway or timeout errors

**Cause**: Backend serverless function is timing out or failing.

**Fix**:
- Check Vercel Function logs: Go to Deployments → Click on deployment → Logs
- Ensure `MONGODB_URI` is correct and reachable
- Increase function timeout in `vercel.json` (currently set to 60 seconds)

## Local Development

For local development, you can still use the local Express server:

```bash
# Terminal 1: Frontend dev server
npm run dev:client

# Terminal 2: Backend dev server
npm run dev:server
```

Frontend will default to `http://localhost:5000` if `VITE_API_URL` is not set and you're on localhost.

## File Structure for Deployment

```
project-root/
├── vercel.json                # Vercel configuration
├── api/
│   └── handler.ts            # Serverless API handler
├── dist/                      # Built frontend (auto-generated)
├── backend/
│   ├── server.ts
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── middleware/
├── src/
│   └── (frontend code)
└── package.json              # Node dependencies
```

## Security Notes

- **Never commit secrets** to GitHub (`.env.local` is in `.gitignore`)
- Use Vercel's Environment Variables UI for all sensitive data
- Rotate JWT secrets periodically
- Use MongoDB Atlas VPC peering for production (not "Allow from anywhere")
- Enable HTTPS only (automatic with Vercel)

## Next Steps

1. Monitor Vercel logs in the dashboard
2. Set up error tracking (optional: Sentry, LogRocket)
3. Configure custom domain (optional: Vercel supports this)
4. Set up automated deployments on GitHub push

---

For issues, check Vercel's documentation: https://vercel.com/docs
