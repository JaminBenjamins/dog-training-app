# 🚀 Deployment Guide - DOGMAN UNLEASHED 254

## Overview
This app has two components:
- **Frontend**: HTML, CSS, JavaScript (can be hosted on GitHub Pages)
- **Backend**: Node.js/Express server for M-Pesa integration (requires separate hosting)

---

## 🌟 Option 1: GitHub Pages (Frontend) + Render (Backend)

### **Step 1: Prepare Your Repository**

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Name it: `dogman-unleashed-254` (or your preferred name)
   - Make it **Public** (required for free GitHub Pages)
   - Don't initialize with README, .gitignore, or license

2. **Link your local repository to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/dogman-unleashed-254.git
   git branch -M main
   git push -u origin main
   ```

### **Step 2: Enable GitHub Pages**

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **Save**
5. Your site will be live at: `https://YOUR_USERNAME.github.io/dogman-unleashed-254/`

### **Step 3: Deploy Backend to Render (FREE)**

1. **Sign up at [Render.com](https://render.com)** (free tier available)

2. **Create a New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `dogman-backend`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: `Free`

3. **Add Environment Variables** (in Render dashboard):
   - `MPESA_CONSUMER_KEY`: Your M-Pesa consumer key
   - `MPESA_CONSUMER_SECRET`: Your M-Pesa consumer secret
   - `MPESA_SHORTCODE`: Your M-Pesa shortcode
   - `MPESA_PASSKEY`: Your M-Pesa passkey
   - `MPESA_CALLBACK_URL`: `https://dogman-backend.onrender.com/api/callback`
   - `PORT`: `3000` (or leave empty, Render sets this automatically)

4. **Deploy** - Render will give you a URL like: `https://dogman-backend.onrender.com`

### **Step 4: Update Frontend to Use Backend URL**

Update `app.js` to point to your Render backend URL instead of `localhost:3000`.

Find all instances of:
```javascript
fetch('http://localhost:3000/api/stkpush', ...)
```

Replace with:
```javascript
fetch('https://dogman-backend.onrender.com/api/stkpush', ...)
```

### **Step 5: Push Changes and Go Live! 🎉**

```bash
git add .
git commit -m "Update backend URL for production"
git push
```

Your site will auto-update on GitHub Pages!

---

## 🔧 Option 2: All-in-One Hosting (Vercel/Netlify/Railway)

### **Vercel (Recommended for Full-Stack Apps)**

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Add Environment Variables** in Vercel dashboard

4. **Create `vercel.json`** (already included in this project)

### **Railway (Great for Node.js apps)**

1. **Sign up at [Railway.app](https://railway.app)**
2. **Create New Project** → Import from GitHub
3. **Add Environment Variables**
4. **Deploy** - Railway auto-detects Node.js and deploys

---

## 📝 Important Notes

### **M-Pesa Callback URL**
When deploying to production, update your M-Pesa Daraja app callback URL to:
- **Render**: `https://dogman-backend.onrender.com/api/callback`
- **Vercel**: `https://your-app.vercel.app/api/callback`
- **Railway**: `https://your-app.up.railway.app/api/callback`

### **CORS Configuration**
If frontend and backend are on different domains, you'll need to enable CORS in `server.js`. Add this after line 7:

```javascript
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
```

### **Security Considerations**
- ✅ `.env` file is in `.gitignore` (already done)
- ✅ Never commit API keys to GitHub
- ✅ Use environment variables on your hosting platform
- ✅ Keep your M-Pesa credentials secure

---

## 🎯 Quick Deployment Checklist

- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Enable GitHub Pages for frontend
- [ ] Deploy backend to Render/Vercel/Railway
- [ ] Add environment variables to backend host
- [ ] Update `app.js` with production backend URL
- [ ] Update M-Pesa callback URL in Daraja dashboard
- [ ] Test the live site!

---

## 🆘 Troubleshooting

**GitHub Pages shows 404:**
- Wait 2-5 minutes after enabling Pages
- Check that `index.html` is in the root directory
- Verify your repository is public

**Backend API calls fail:**
- Check CORS is enabled
- Verify backend URL is correct in `app.js`
- Check environment variables are set on hosting platform

**M-Pesa callback not working:**
- Verify callback URL in Daraja dashboard matches deployed backend
- Check server logs for incoming requests
- Ensure IP whitelisting allows Safaricom IPs

---

## 📞 Need Help?
- GitHub Pages: https://docs.github.com/pages
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
- M-Pesa Daraja: https://developer.safaricom.co.ke/

Good luck with your deployment! 🚀
