# DOGMAN UNLEASHED 254

Premium dog training appointment booking and payment system with M-Pesa STK Push integration.

## Features

- Premium booking UI
- Interactive calendar scheduling
- M-Pesa Express STK Push checkout
- Callback-based payment tracking
- Manual STK query fallback
- Auto-scrolling testimonials

## Quick Start

```bash
npm install
cp .env.example .env
npm start
```

Open `http://localhost:3000`.

## M-Pesa Setup

1. Create a Safaricom Daraja app and enable M-Pesa Express/STK Push.
2. Copy `.env.example` to `.env`.
3. Fill in `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, and `MPESA_PASSKEY`.
4. Set `MPESA_CALLBACK_URL` to a public HTTPS URL ending in `/api/callback`.
5. For local testing, expose the app with a tunnel such as ngrok and use that HTTPS callback URL.
6. Keep `MPESA_ENVIRONMENT=sandbox` while testing. Change it to `production` only after Safaricom approves live credentials.

For sandbox testing, you can set:

```env
MPESA_TEST_AMOUNT=1
```

That forces all checkout requests to KES 1 from the backend while preserving real booking prices in the UI.

## Local Callback Testing

Start the backend:

```bash
npm start
```

Expose it with Cloudflare Tunnel:

```bash
npm run tunnel:cloudflare
```

Copy the generated `https://...trycloudflare.com` URL into `.env`:

```env
MPESA_CALLBACK_URL=https://your-generated-url.trycloudflare.com/api/callback
```

Then restart `npm start` so the backend reloads `.env`.

You can verify the public callback tunnel with:

```bash
curl https://your-generated-url.trycloudflare.com/api/health
```

## Important Environment Variables

```env
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PARTY_B=174379
MPESA_PASSKEY=your_lipa_na_mpesa_passkey
MPESA_CALLBACK_URL=https://your-domain.example.com/api/callback
MPESA_TRANSACTION_TYPE=CustomerPayBillOnline
MPESA_ACCOUNT_REFERENCE=DogmanUnleashed254
MPESA_TRANSACTION_DESC=Dogman Unleashed 254 Booking
```

Use `CustomerPayBillOnline` for a paybill and `CustomerBuyGoodsOnline` for a till/buy-goods checkout.

## API Routes

- `POST /api/stkpush` starts an STK Push.
- `POST /api/callback` receives the M-Pesa callback.
- `GET /api/payment-status/:checkoutID` returns local payment status.
- `POST /api/stkquery` asks Safaricom for the STK status.
- `GET /api/health` checks whether the backend is up and M-Pesa env vars are present.

## Deployment Notes

- Do not commit `.env`.
- Your callback URL must be public HTTPS.
- The current payment store is in memory. Use a database before taking production bookings.
- Set `FRONTEND_ORIGIN` to your deployed frontend URL instead of `*` for production.
