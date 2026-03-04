# Deployment & Configuration Guide

## Current Status
- ✅ Frontend deployed on Vercel: https://itda-ai-classroom.vercel.app/
- ⚠️ Backend needs proper configuration on Render

---

## Backend Deployment Issues

### Problem
The Render backend is not accessible. This is likely because:
1. Service URL is incorrect
2. Build command didn't work properly
3. Start command needs fixing

### Solution

**Step 1: Check Render Service URL**
1. Go to https://dashboard.render.com/
2. Find your "itda-ai-classroom-backend" service
3. In the top section, copy the actual **URL** (should be like `https://[service-name]-[random].onrender.com`)

**Step 2: Fix Backend Configuration**

Your `backend/package.json` needs this start script:

```json
{
  "scripts": {
    "dev": "node server/index.js",
    "start": "node server/index.js"
  }
}
```

**Step 3: Update Render Settings**
1. Go to your Render service dashboard
2. Click **Settings** → **Build & Deploy**
3. Change:
   - **Build Command**: `npm install` (instead of `cd backend && npm install`)
   - **Start Command**: `cd backend && npm run start` (instead of `npm run dev`)

4. Click **"Environment"** tab and verify:
   ```
   SUPABASE_URL = https://mhndcwiomsjzmxxyppzf.supabase.co
   SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   DATABASE_PASSWORD = Rathod@9001
   PORT = 3001
   NODE_ENV = production
   ```

5. Click **"Deploy"** button

**Step 4: Get Backend URL**
- After deployment, copy the service URL (e.g., `https://itda-ai-classroom-abc123.onrender.com`)

**Step 5: Update Frontend**
1. Go to Vercel: https://vercel.com/dashboard
2. Select **ITDA_AI_CLASSROOM** project
3. Go to **Settings** → **Environment Variables**
4. Update: `VITE_API_URL = https://your-render-backend-url` (use actual URL from step 4)
5. Go to **Deployments** and click **Redeploy** on the latest deployment

---

## Testing After Fix

```bash
# Test backend health
curl https://your-render-backend-url/api/health

# Should return:
# {"ok":true,"db":"connected","provider":"supabase"}
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Backend returns 404 | Check Render URL is correct and service is running |
| Frontend can't connect to API | Ensure VITE_API_URL is set correctly in Vercel |
| Build fails on Render | Make sure root `package.json` exists |
| Database connection error | Verify SUPABASE_URL and SERVICE_ROLE_KEY in Render |

---

## Next Steps

1. Update Render backend configuration as per **Step 2-3** above
2. Note the actual Render URL
3. Update Vercel environment variable
4. Test both frontend and API
5. Let me know the working backend URL once it's deployed!

