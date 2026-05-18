# Production Deployment & Domain Configuration Guide

This guide walks you through deploying **InterprepAI** to Vercel as a production-ready application, buying a custom domain, configuring DNS records, and ensuring MongoDB Atlas connects securely.

---

## Part 1: Setting up MongoDB Atlas (Cloud Database)

To ensure your database is accessible from Vercel's serverless functions:

1. **Create/Log in to MongoDB Atlas**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and log in.
2. **Retrieve Connection String**:
   - Go to your database cluster dashboard.
   - Click **Connect** → **Drivers**.
   - Copy the connection string. It will look like:
     `mongodb+srv://<username>:<password>@cluster0.uouykyr.mongodb.net/InterprepAI?retryWrites=true&w=majority`
   - Keep this safe. You will set this as `MONGODB_URI` in Vercel's settings.
3. **Configure Network Access**:
   - In MongoDB Atlas left sidebar, go to **Security** → **Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access From Anywhere** (this will add `0.0.0.0/0`).
   - Click **Confirm**. 
   > [!IMPORTANT]
   > Since Vercel's serverless functions use dynamic IP addresses, allowing access from anywhere (`0.0.0.0/0`) is required unless you use an advanced integration like VPC peering or a proxy.

---

## Part 2: Deploying to Vercel

1. **Push Changes to GitHub**: Ensure all latest code changes (with our updated robust routing and DB connection pooling) are committed and pushed to your GitHub repository.
2. **Import Project to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard).
   - Click **Add New** → **Project**.
   - Select your `interprep.ai` repository and click **Import**.
3. **Set Environment Variables**:
   Under the **Environment Variables** section, add the following variables:

   | Variable Name | Value | Description |
   |---|---|---|
   | `MONGODB_URI` | `mongodb+srv://...` (your Atlas connection string) | The cloud database URL |
   | `JWT_SECRET` | A strong 64-character hex string (e.g., `be3e70c9...`) | Secret for access tokens |
   | `JWT_REFRESH_SECRET` | A different strong 64-char hex string | Secret for refresh tokens |
   | `NODE_ENV` | `production` | Enforces production mode optimizations |
   | `OLLAMA_API_KEY_1` | Your Ollama API key | Ollama authentication key |

   > [!WARNING]
   > **Do not leak API keys!** Never commit your `.env.local` file or actual secrets to GitHub. Always set them inside this Vercel UI.
4. **Deploy**: Click **Deploy**. Vercel will build the React frontend and bundle the serverless Node.js backend. Once complete, you will receive a `.vercel.app` subdomain!

---

## Part 3: Buying and Mapping a Custom Domain

To host your app under your own brand (e.g., `interprepai.com`):

### Step 1: Buy a Domain
You can purchase a domain from any reputable domain registrar:
- **Directly through Vercel** (Easiest - DNS is automatically configured): Go to Vercel Dashboard → Settings → Domains → Add → type your domain and purchase it.
- **Third-Party Registrar** (Namecheap, GoDaddy, Google Domains/Squarespace, etc.): Buy the domain on their platform, then proceed to the next step.

### Step 2: Add Domain to Vercel Project
1. Go to your **Vercel Dashboard** → click your **InterprepAI** project.
2. Go to **Settings** → **Domains**.
3. In the input box, type your custom domain (e.g., `interprepai.com`) and click **Add**.
4. Vercel will recommend adding both the root domain (`interprepai.com`) and the subdomain `www.interprepai.com`. Accept this recommendation.

### Step 3: Configure DNS Records (For Third-Party Registrars)
Vercel will show a **"Validating..."** or **"Invalid Configuration"** status, along with the exact DNS records you need to add at your domain registrar.

Log in to your registrar (e.g., Namecheap or GoDaddy) and go to your **DNS Management / Advanced DNS** settings. Add the following records:

#### 1. For the Root Domain (`interprepai.com`):
- **Type**: `A`
- **Host**: `@`
- **Value**: `76.76.21.21` (Vercel's global IP address)
- **TTL**: Automatic / 30 mins

#### 2. For the `www` Subdomain (`www.interprepai.com`):
- **Type**: `CNAME`
- **Host**: `www`
- **Value**: `cname.vercel-dns.com`
- **TTL**: Automatic / 30 mins

*Note: Delete any conflicting `A` or `CNAME` records matching `@` or `www` that were automatically added by your registrar.*

### Step 4: Verification & SSL Setup
- Once the DNS records are saved, Vercel will automatically detect them (this can take anywhere from a few minutes up to an hour depending on DNS propagation).
- Once detected, the status will change to a green **"Valid"** checkmark, and Vercel will automatically generate a free, secure Let's Encrypt **SSL Certificate (HTTPS)** for your domain.

---

## Part 4: Dynamic CORS and Verification

Thanks to the dynamic CORS middleware we implemented:
- You **do not need** to update any `CORS_ORIGIN` environment variables when moving to a custom domain!
- The backend automatically detects the `Host` header and allows cross-origin requests from the exact domain your frontend is loaded from.

### Verify Everything is Working:
1. Visit your custom domain: `https://interprepai.com`
2. Open your browser console (F12) → go to the **Network** tab.
3. Test **Signup** or **Login**:
   - Submit a new account or log in with an existing one.
   - Confirm that requests to `/api/auth/login` succeed with `200 OK` or `201 Created`.
   - Ensure the app redirects you successfully to the Candidate or Recruiter Dashboard.
4. If you get any issues, check Vercel Logs under **Dashboard → Project → Logs** to troubleshoot instantly.
