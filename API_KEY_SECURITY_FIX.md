# Gemini API Key Compromise Alert

## What Happened
Your Gemini API key was publicly exposed in the GitHub repository and has been disabled by Google for security reasons.

**Error**: `"Your API key was reported as leaked. Please use another API key."`

## Immediate Actions Required

1. **Generate a new Gemini API key** (takes 30 seconds):
   - Go to: https://aistudio.google.com/apikey
   - Delete the old/leaked key
   - Click "Create API Key"
   - Copy the new key

2. **Update your project**:
   - Paste the new key in `.env.local`:
     ```
     VITE_GEMINI_API_KEY=your-new-key-here
     GEMINI_API_KEY=your-new-key-here
     ```
   - Test locally to confirm it works

3. **Push to GitHub**:
   ```bash
   git add .env.example .env.local
   git commit -m "Security: rotate compromised Gemini API key"
   git push origin main
   ```

4. **Update Vercel environment variables**:
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Update `GEMINI_API_KEY` to your new key
   - Redeploy the project

## Why This Happened

- Gemini API keys were committed to the public repository
- `.env.local` should be in `.gitignore` (it is now, but the old key was already exposed)
- Never commit secrets or API keys to version control

## Prevention

- All secrets are now in `.env.local` (git-ignored)
- Use Vercel's Environment Variables UI for production secrets
- Review GitHub commit history and revoke any exposed keys
- Consider enabling Dependabot or similar to detect leaked secrets

## Files Updated

- `.env.local` — placeholder for new key
- `.env.example` — clearer instructions for key setup
- This file — documentation

---

**Next Step**: Generate your new key at https://aistudio.google.com/apikey and update the files above.
