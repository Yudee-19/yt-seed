# 🚀 Render Deployment Guide for YT Seed Pipeline

This guide walks you through deploying the YT Seed backend (FastAPI + Celery + Redis) on Render with **minimal parameters** (3 keywords, 3 channels).

---

## 📋 Prerequisites

1. **GitHub Repository**: Your code must be pushed to GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **MongoDB Database**: 
   - Option A: Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available)
   - Option B: Use Render's managed MongoDB (paid)
4. **API Keys**:
   - YouTube Data API v3 key from [Google Cloud Console](https://console.cloud.google.com/)
   - OpenAI API key from [OpenAI Platform](https://platform.openai.com/)

---

## 🎯 Deployment Steps

### **Option 1: One-Click Deploy with Blueprint (Recommended)**

1. **Push `render.yaml` to your repository**
   ```bash
   git add render.yaml
   git commit -m "Add Render blueprint configuration"
   git push origin kajkarma_prod
   ```

2. **Create New Blueprint on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click **"New"** → **"Blueprint"**
   - Connect your GitHub repository
   - Select branch: `kajkarma_prod`
   - Render will auto-detect `render.yaml`

3. **Set Secret Environment Variables**
   
   After blueprint creation, you must manually set these secrets in the Render dashboard for **both services** (web + worker):
   
   | Variable Name | Where to Get It | Example Value |
   |--------------|-----------------|---------------|
   | `YOUTUBE_API_KEY` | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials | `AIzaSyC...` |
   | `OPENAI_API_KEY` | [OpenAI Platform](https://platform.openai.com/api-keys) | `sk-proj-...` |
   | `MONGO_URI` | MongoDB Atlas → Connect → Drivers | `mongodb+srv://user:pass@cluster.mongodb.net/` |

   **How to set secrets:**
   - Go to each service (yt-seed-api, yt-seed-celery-worker)
   - Click **"Environment"** tab
   - Find the variable and click **"Edit"**
   - Paste your secret value
   - Click **"Save Changes"**

4. **Deploy**
   - Click **"Apply"** on the blueprint page
   - Render will provision:
     - ✅ Redis instance
     - ✅ FastAPI web service
     - ✅ Celery worker
   - Wait 5-10 minutes for build + deploy

---

### **Option 2: Manual Service Creation**

If you prefer manual setup:

#### **Step 1: Create Redis**
1. Dashboard → **"New"** → **"Redis"**
2. Name: `yt-seed-redis`
3. Plan: **Starter (Free)**
4. Region: **Oregon** (or your choice)
5. Click **"Create Redis"**
6. Copy the **Internal Redis URL** (looks like `redis://red-...`)

#### **Step 2: Create Web Service (FastAPI)**
1. Dashboard → **"New"** → **"Web Service"**
2. Connect your GitHub repo → Select `kajkarma_prod` branch
3. Configure:
   - **Name**: `yt-seed-api`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Starter (Free)
4. **Environment Variables** → Add all variables from table below
5. Click **"Create Web Service"**

#### **Step 3: Create Worker (Celery)**
1. Dashboard → **"New"** → **"Background Worker"**
2. Connect same repo → Select `kajkarma_prod` branch
3. Configure:
   - **Name**: `yt-seed-celery-worker`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `celery -A celery_worker worker --loglevel=info --concurrency=2`
   - **Plan**: Starter (Free)
4. **Environment Variables** → Add same variables as web service
5. Click **"Create Background Worker"**

#### **Environment Variables Table** (for manual setup)

| Variable | Value | Notes |
|----------|-------|-------|
| `YOUTUBE_API_KEY` | `<your_key>` | ⚠️ Secret - set manually |
| `OPENAI_API_KEY` | `<your_key>` | ⚠️ Secret - set manually |
| `MONGO_URI` | `<your_connection_string>` | ⚠️ Secret - set manually |
| `MONGO_DB_NAME` | `yt_seed_production` | Can be any name |
| `REDIS_URL` | `redis://red-...` | Copy from Redis service |
| `MAX_KEYWORDS` | `3` | Limits keywords per seed |
| `MAX_CHANNELS` | `3` | Limits discovered channels |
| `MAX_RESULTS_PER_SEARCH` | `5` | Limits YouTube search results |
| `VIDEOS_PER_CANDIDATE` | `3` | Videos fetched per channel |

---

## ✅ Verify Deployment

### **1. Check Service Health**
- Go to your web service URL: `https://yt-seed-api.onrender.com`
- You should see: `{"message":"Kajkarma AI Pipeline API"}`
- Visit `/docs`: `https://yt-seed-api.onrender.com/docs` to see API documentation

### **2. Test the API**
```bash
# Check progress endpoint
curl https://yt-seed-api.onrender.com/progress

# Expected response:
# {"status":"empty","data":{}}
```

### **3. Monitor Logs**
- **Web Service Logs**: Dashboard → yt-seed-api → Logs
- **Worker Logs**: Dashboard → yt-seed-celery-worker → Logs
- **Redis Logs**: Dashboard → yt-seed-redis → Logs

---

## 🎬 Running a Pipeline

### **1. Prepare Your Google Sheet**
- Create a public Google Sheet with columns: `Channel_Name`, `Channel_URL`
- File → Share → Publish to web → Select CSV format
- Copy the CSV export URL (must contain `output=csv` or `export?format=csv`)

### **2. Trigger Pipeline**
```bash
curl -X POST "https://yt-seed-api.onrender.com/start_pipeline" \
  -H "Content-Type: application/json" \
  -d '{"sheet_url":"https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv"}'
```

**Response:**
```json
{
  "task_id": "abc123-def456",
  "message": "Pipeline 'Loader' task started."
}
```

### **3. Check Task Status**
```bash
curl https://yt-seed-api.onrender.com/status/abc123-def456
```

### **4. Monitor Progress**
```bash
curl https://yt-seed-api.onrender.com/progress
```

### **5. Download Results**
```bash
curl https://yt-seed-api.onrender.com/download_tier1_2
```

---

## 🔧 Configuration Tuning

### **Increase Limits (Use More Resources)**
Edit environment variables in Render dashboard:
```
MAX_KEYWORDS=10          # More keywords = more API calls
MAX_CHANNELS=10          # More channels = longer runtime
MAX_RESULTS_PER_SEARCH=20  # More search results
VIDEOS_PER_CANDIDATE=10    # More videos per channel
```

### **Decrease Limits (Save Quota/Cost)**
```
MAX_KEYWORDS=1           # Minimal run
MAX_CHANNELS=1
MAX_RESULTS_PER_SEARCH=3
VIDEOS_PER_CANDIDATE=1
```

---

## 💰 Cost Estimation (Render Free Tier)

| Service | Free Tier | Notes |
|---------|-----------|-------|
| Web Service | 750 hrs/month | Sleeps after 15 min inactivity |
| Background Worker | 750 hrs/month | Stays active (uses free hours) |
| Redis | 25 MB | Enough for small runs |

**⚠️ Important**: 
- Worker runs 24/7 and consumes free hours quickly
- Consider scaling to 0 workers when not in use
- Upgrade to paid plan (~$7/month) for production

---

## 🐛 Troubleshooting

### **Issue: Web service won't start**
- Check logs for Python errors
- Verify `requirements.txt` installs correctly
- Ensure `PORT` environment variable is used (it's auto-set by Render)

### **Issue: Celery worker crashes**
- Check Redis connection (verify `REDIS_URL` is correct)
- Look for import errors in logs
- Ensure MongoDB is reachable

### **Issue: Tasks not processing**
- Verify Redis is running (check Redis service logs)
- Check if Celery worker is online (worker logs should show "ready")
- Ensure `REDIS_URL` is identical in both web + worker services

### **Issue: YouTube quota exceeded**
- Pipeline has built-in circuit breaker (pauses tasks)
- Wait 24 hours for quota reset
- Reduce limits: `MAX_KEYWORDS=1`, `MAX_CHANNELS=1`

### **Issue: MongoDB connection timeout**
- Whitelist Render IPs in MongoDB Atlas:
  - Atlas → Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
- Verify `MONGO_URI` is correct

---

## 🔐 Security Best Practices

1. **Never commit secrets to Git**
   - All API keys should be set in Render dashboard only
   - Add `.env` to `.gitignore`

2. **Restrict MongoDB Access**
   - Use strong passwords
   - Enable IP whitelisting in production

3. **Use Render Environment Groups**
   - Create an environment group for shared variables
   - Link to multiple services

4. **Enable HTTPS**
   - Render provides free SSL certificates
   - All traffic is encrypted by default

---

## 📊 Monitoring & Alerts

### **Set Up Render Notifications**
1. Dashboard → Account Settings → Notifications
2. Enable:
   - Deploy failures
   - Service health checks
   - Billing alerts

### **Custom Health Checks**
- Render automatically pings `/progress` (defined in `render.yaml`)
- If endpoint returns errors, service will restart

---

## 🚀 Next Steps

1. **Test with minimal settings** (3 keywords, 3 channels)
2. **Monitor logs** for any errors
3. **Check YouTube API quota usage** in Google Cloud Console
4. **Scale up** gradually once tested
5. **Add frontend** (optional) by deploying the `/frontend` folder as a static site

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Celery Documentation](https://docs.celeryq.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [YouTube API Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)

---

## ❓ Need Help?

- **Render Support**: [Render Community](https://community.render.com/)
- **Pipeline Issues**: Check project README.md
- **API Errors**: Review service logs in Render dashboard

---

**Happy Deploying! 🎉**
