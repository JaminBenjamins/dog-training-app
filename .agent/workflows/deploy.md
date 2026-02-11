---
description: Deploy to GitHub Pages
---

# Deploy Dog Training App to GitHub Pages

This workflow helps you deploy your DOGMAN UNLEASHED 254 app to GitHub Pages.

## Prerequisites
- GitHub account
- Repository created on GitHub (or create one now at https://github.com/new)

## Steps

### 1. Ensure all changes are committed
```bash
git add .
git commit -m "Prepare for GitHub Pages deployment"
```

### 2. Push to GitHub (if not already done)
```bash
# If you haven't set up the remote yet:
# git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

git push -u origin main
```

### 3. Enable GitHub Pages
- Go to your repository on GitHub
- Click **Settings** → **Pages**
- Under "Source", select branch `main` and folder `/ (root)`
- Click **Save**
- Your site will be available at: `https://YOUR_USERNAME.github.io/REPO_NAME/`

### 4. Deploy Backend (Choose One)

#### Option A: Render (Recommended - Free Tier)
1. Sign up at https://render.com
2. Create New Web Service → Connect GitHub repo
3. Settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add Environment Variables from your `.env` file
5. Deploy!

#### Option B: Railway
1. Sign up at https://railway.app
2. New Project → Deploy from GitHub
3. Add environment variables
4. Deploy automatically!

#### Option C: Vercel
```bash
npm install -g vercel
vercel
```
Then add environment variables in Vercel dashboard.

### 5. Update Frontend with Backend URL
Once backend is deployed, update the fetch URLs in `app.js`:
- Find: `http://localhost:3000/api/`
- Replace with: `https://YOUR_BACKEND_URL/api/`

### 6. Commit and push the updated app.js
```bash
git add app.js
git commit -m "Update backend URL for production"
git push
```

### 7. Wait for GitHub Pages to rebuild (2-5 minutes)

## Important Notes
- Your `.env` file is already in `.gitignore` ✅
- Never commit API keys to GitHub
- Add all environment variables to your backend hosting platform
- Update M-Pesa callback URL in Daraja dashboard to match your deployed backend

## Troubleshooting
- **404 on GitHub Pages**: Wait a few minutes, ensure `index.html` is in root
- **API calls fail**: Check CORS settings in server.js
- **M-Pesa not working**: Verify callback URL in Daraja dashboard

## Success! 🎉
Your site should now be live on GitHub Pages with a functioning backend!
