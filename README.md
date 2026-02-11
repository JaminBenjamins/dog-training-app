# 🐕 DOGMAN UNLEASHED 254

Premium dog training appointment booking and payment system with M-Pesa integration.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)

## 🌟 Features

- **Premium UI**: Modern, responsive design with smooth animations
- **Interactive Calendar**: Monthly calendar view for booking appointments
- **M-Pesa Integration**: STK Push payment system for seamless transactions
- **Multiple Services**: Puppy Foundations, Obedience Mastery, Behavior Modification
- **Real-time Payment Status**: Live payment tracking and status updates
- **Auto-scrolling Testimonials**: Smooth testimonial carousel with pause-on-hover

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/dogman-unleashed-254.git
   cd dogman-unleashed-254
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   MPESA_CONSUMER_KEY=your_consumer_key
   MPESA_CONSUMER_SECRET=your_consumer_secret
   MPESA_SHORTCODE=your_shortcode
   MPESA_PASSKEY=your_passkey
   MPESA_CALLBACK_URL=http://localhost:3000/api/callback
   PORT=3000
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000`

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Options:

- **GitHub Pages** (Frontend only) - Free
- **Render** (Backend) - Free tier available
- **Vercel** (Full-stack) - Free tier available
- **Railway** (Full-stack) - Free tier available

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Payment**: M-Pesa Daraja API (Sandbox/Production)
- **Deployment**: GitHub Pages + Render (recommended)

## 📁 Project Structure

```
dogman-unleashed-254/
├── index.html          # Main HTML file
├── styles.css          # Stylesheets
├── app.js             # Frontend JavaScript
├── config.js          # API configuration
├── server.js          # Backend Express server
├── package.json       # Node dependencies
├── .env              # Environment variables (not committed)
├── .gitignore        # Git ignore rules
├── DEPLOYMENT.md     # Deployment guide
└── vercel.json       # Vercel configuration
```

## 🔧 Configuration

### For Production Deployment:

Edit `config.js` and update the `API_BASE_URL`:

```javascript
const config = {
    API_BASE_URL: 'https://your-backend-url.onrender.com' // Your deployed backend URL
};
```

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `MPESA_CONSUMER_KEY` | M-Pesa API consumer key |
| `MPESA_CONSUMER_SECRET` | M-Pesa API consumer secret |
| `MPESA_SHORTCODE` | M-Pesa business shortcode/till number |
| `MPESA_PASSKEY` | M-Pesa STK Push passkey |
| `MPESA_CALLBACK_URL` | M-Pesa callback URL (must be publicly accessible) |
| `PORT` | Server port (default: 3000) |

## 📝 API Endpoints

- `POST /api/stkpush` - Initiate STK Push payment
- `POST /api/stkquery` - Query payment status
- `POST /api/callback` - M-Pesa callback endpoint
- `GET /api/payment-status/:checkoutID` - Check payment status

## 🧪 Testing

For M-Pesa sandbox testing, use these test credentials:
- **Phone Number**: `254708374149` (or any other test number)
- **PIN**: `1234` (test PIN)

## 🔒 Security

- ✅ Environment variables are in `.gitignore`
- ✅ CORS enabled for cross-origin requests
- ✅ IP whitelisting for M-Pesa callbacks
- ✅ Secure payment handling

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check the [DEPLOYMENT.md](./DEPLOYMENT.md) guide
- Consult M-Pesa documentation: https://developer.safaricom.co.ke/

## 📄 License

ISC License - See LICENSE file for details

## 🎯 Roadmap

- [ ] Email confirmations
- [ ] SMS notifications
- [ ] Admin dashboard
- [ ] Multi-language support
- [ ] Payment history

---

**Made with ❤️ for dog lovers in Kenya** 🇰🇪
