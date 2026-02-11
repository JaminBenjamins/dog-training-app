# 🚀 Quick Deployment Checklist for GitHub Pages

## ✅ Pre-Deployment Checklist

- [x] Git repository created: `https://github.com/JaminBenjamins/dog-training-app`
- [x] CORS enabled in server.js
- [x] Config system implemented for API URLs
- [x] .env file in .gitignore
- [x] Code committed to git

## 📋 Next Steps

### Step 1: Push to GitHub
```bash
git push -u origin main
```

### Step 2: Enable GitHub Pages
1. Go to: https://github.com/JaminBenjamins/dog-training-app/settings/pages
2. Under "Source":
   - Branch: `main`
   - Folder: `/ (root)`
3. Click **Save**
4. Your frontend will be live at: `https://jaminbenjamins.github.io/dog-training-app/`

### Step 3: Deploy Backend to Render

1. **Sign up/Login**: https://render.com
2. **New Web Service**: Click "New +" → "Web Service"
3. **Connect GitHub**: Select `JaminBenjamins/dog-training-app`
4. **Configure**:
   - **Name**: `dogman-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

5. **Environment Variables** (Add these in Render dashboard):
   ```
   MPESA_CONSUMER_KEY=<your_key>
   MPESA_CONSUMER_SECRET=<your_secret>
   MPESA_SHORTCODE=<your_shortcode>
   MPESA_PASSKEY=<your_passkey>
   MPESA_CALLBACK_URL=https://dogman-backend.onrender.com/api/callback
   ```

6. **Deploy** → Copy your Render URL (e.g., `https://dogman-backend.onrender.com`)

### Step 4: Update config.js

Edit `config.js` and change:
```javascript
API_BASE_URL: 'https://dogman-backend.onrender.com'
```

### Step 5: Commit and Push
```bash
git add config.js
git commit -m "Update API URL for production"
git push
```

### Step 6: Update M-Pesa Callback
1. Go to: https://developer.safaricom.co.ke
2. Update your app's callback URL to:
   ```
   https://dogman-backend.onrender.com/api/callback
   ```

## 🎉 You're Live!

- **Frontend**: https://jaminbenjamins.github.io/dog-training-app/
- **Backend**: https://dogman-backend.onrender.com

## ⚠️ Important Notes

- GitHub Pages may take 2-5 minutes to update after each push
- Render free tier may spin down after inactivity (first request will be slower)
- Test the M-Pesa integration thoroughly in sandbox mode first

## 🆘 Troubleshooting

**Issue**: API calls fail from GitHub Pages
- **Solution**: Ensure `config.js` has the correct backend URL
- **Solution**: Check browser console for CORS errors
- **Solution**: Verify backend is running on Render

**Issue**: M-Pesa callback not working
- **Solution**: Verify callback URL in Daraja dashboard
- **Solution**: Check Render logs for incoming requests
- **Solution**: Ensure environment variables are set correctly

**Issue**: 404 on GitHub Pages
- **Solution**: Wait 5 minutes after enabling Pages
- **Solution**: Check repository is public
- **Solution**: Verify `index.html` is in root directory

## 📚 Additional Resources

- **Detailed Guide**: See `DEPLOYMENT.md`
- **Project Setup**: See `README.md`
- **Workflow**: Use `/deploy` command in chat
