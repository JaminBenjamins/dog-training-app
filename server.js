const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Enable CORS for GitHub Pages frontend
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // In production, replace '*' with your GitHub Pages URL
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

app.use(express.json());
app.use(express.static('.'));

// In-memory store for payment statuses (CheckoutRequestID -> Status)
const pendingPayments = new Map();

// Whitelisted Safaricom IPs
const SAFARICOM_IPS = [
    '196.201.214.200', '196.201.214.206', '196.201.213.114',
    '196.201.214.207', '196.201.214.208', '196.201.213.44',
    '196.201.212.127', '196.201.212.138', '196.201.212.129',
    '196.201.212.136', '196.201.212.74', '196.201.212.69'
];

/**
 * Middleware to verify that requests come from Safaricom's trusted IPs
 */
const whitelistIPs = (req, res, next) => {
    // If using ngrok/proxy, the real IP is in 'x-forwarded-for'
    const xForwardedFor = req.headers['x-forwarded-for'];
    const clientIP = xForwardedFor ? xForwardedFor.split(',')[0].trim() : req.socket.remoteAddress;

    // Remove IPv6 prefix if present (e.g., ::ffff:192.168.1.1)
    const cleanIP = clientIP.replace(/^.*:/, '');

    if (SAFARICOM_IPS.includes(cleanIP)) {
        next();
    } else {
        console.warn(`[SECURITY] Potential spoof attempt blocked from IP: ${cleanIP}`);
        // During development with ngrok, you might want to log this but allow it
        // For production, strictly 403.
        res.status(403).json({ error: 'IP not whitelisted' });
    }
};

// 1. Middleware to generate M-Pesa Access Token
const generateToken = async (req, res, next) => {
    const key = process.env.MPESA_CONSUMER_KEY;
    const secret = process.env.MPESA_CONSUMER_SECRET;

    const auth = Buffer.from(`${key}:${secret}`).toString('base64');

    try {
        const response = await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            { headers: { Authorization: `Basic ${auth}` } }
        );
        req.token = response.data.access_token;
        next();
    } catch (error) {
        console.error('M-Pesa Auth Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to generate token. Ensure your .env credentials are correct.' });
    }
};

// 2. Route to trigger STK Push
app.post('/api/stkpush', generateToken, async (req, res) => {
    const phone = req.body.phone;
    const amount = req.body.amount || 1;

    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const stkPushData = {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerBuyGoodsOnline', // Changed for Till Number/Buy Goods
        Amount: amount,
        PartyA: phone,
        PartyB: shortcode, // For Buy Goods, this is the Store Number
        PhoneNumber: phone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: 'DogmanUnleashed254',
        TransactionDesc: 'Dogman Unleashed 254 Booking'
    };

    try {
        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', // Corrected endpoint
            stkPushData,
            { headers: { Authorization: `Bearer ${req.token}` } }
        );

        // Register the checkout request in our store
        pendingPayments.set(response.data.CheckoutRequestID, {
            status: 'PENDING',
            details: null,
            timestamp: Date.now()
        });

        res.status(200).json(response.data);
    } catch (error) {
        console.error('STK Push Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.response ? error.response.data : error.message });
    }
});

// 3. Callback Route (M-Pesa will call this)
app.post('/api/callback', whitelistIPs, (req, res) => {
    console.log('M-Pesa Callback Received:', JSON.stringify(req.body, null, 2));

    try {
        const result = req.body.Body.stkCallback;
        const checkoutRequestID = result.CheckoutRequestID;
        const resultCode = result.ResultCode;
        const resultDesc = result.ResultDesc;

        if (resultCode === 0) {
            // Extract Receipt Number from CallbackMetadata
            const metadata = result.CallbackMetadata.Item;
            const receiptItem = metadata.find(item => item.Name === 'MpesaReceiptNumber');
            const receiptNumber = receiptItem ? receiptItem.Value : 'N/A';

            console.log(`[SUCCESS] Payment for Request ${checkoutRequestID} confirmed. Receipt: ${receiptNumber}`);

            // Update our store
            pendingPayments.set(checkoutRequestID, {
                status: 'SUCCESS',
                details: { receiptNumber },
                timestamp: Date.now()
            });

            sendReceiptEmail(checkoutRequestID, receiptNumber);
        } else {
            console.warn(`[FAILURE] Payment for Request ${checkoutRequestID} failed. Reason: ${resultDesc} (Code: ${resultCode})`);

            // Update our store with failure
            pendingPayments.set(checkoutRequestID, {
                status: 'FAILED',
                details: { reason: resultDesc, code: resultCode },
                timestamp: Date.now()
            });
        }
    } catch (err) {
        console.error('Error processing M-Pesa callback:', err.message);
    }

    // Always respond with 200 OK so Safaricom doesn't retry
    res.status(200).json({ ResultCode: 0, ResultDesc: "Success" });
});

/**
 * 4. Internal Status Check Route
 * The frontend calls this to check if a callback has been received.
 */
app.get('/api/payment-status/:checkoutID', (req, res) => {
    const checkoutID = req.params.checkoutID;
    const payment = pendingPayments.get(checkoutID);

    if (!payment) {
        return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(payment);
});

// 4. Status Query Route (Polling)
app.post('/api/stkquery', generateToken, async (req, res) => {
    const checkoutRequestID = req.body.CheckoutRequestID;
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const queryData = {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID
    };

    try {
        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
            queryData,
            { headers: { Authorization: `Bearer ${req.token}` } }
        );
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Query Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.response ? error.response.data : error.message });
    }
});

// 5. Mock Email Function
function sendReceiptEmail(checkoutID, receiptNo) {
    console.log(`--- [EMAIL SIMULATION] ---`);
    console.log(`To: user@example.com`);
    console.log(`Subject: Your Elite K9 Training Receipt`);
    console.log(`Body: Thank you for your payment! Transaction ID: ${checkoutID} | Receipt: ${receiptNo}`);
    console.log(`--------------------------`);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
