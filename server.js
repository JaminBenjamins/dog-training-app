const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('.'));

// 1. Middleware to generate M-Pesa Access Token
const generateToken = async (req, res, next) => {
    const key = process.env.MPESA_CONSUMER_KEY;
    const secret = process.env.MPESA_CONSUMER_SECRET;

    // DEV MOCK: Allow "dummy_key" to pass for UI testing purposes
    if (key === 'dummy_key' || key === 'placeholder') {
        console.log('--- [DEV MOCK] Bypassing real M-Pesa auth for testing ---');
        req.token = 'MOCK_TOKEN_123456';
        return next();
    }

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

    // DEV MOCK: If using mock token, return success immediately
    if (req.token === 'MOCK_TOKEN_123456') {
        console.log(`--- [DEV MOCK] Simulating STK Push to ${phone} for KES ${amount} ---`);
        return res.status(200).json({
            MerchantRequestID: 'MOCK_123',
            CheckoutRequestID: 'MOCK_REQ_456',
            ResponseDescription: 'Success. Request accepted for processing',
            ResponseCode: '0',
            CustomerMessage: 'Success',
            mock: true
        });
    }

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
        res.status(200).json(response.data);
    } catch (error) {
        console.error('STK Push Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.response ? error.response.data : error.message });
    }
});

// 3. Callback Route (M-Pesa will call this)
app.post('/api/callback', (req, res) => {
    console.log('M-Pesa Callback Received:', JSON.stringify(req.body, null, 2));
    const result = req.body.Body.stkCallback;
    if (result.ResultCode === 0) {
        // Payment successful
        sendReceiptEmail(result.CheckoutRequestID);
    }
    res.status(200).send('OK');
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
function sendReceiptEmail(checkoutID) {
    console.log(`--- [EMAIL SIMULATION] ---`);
    console.log(`To: user@example.com`);
    console.log(`Subject: Your Elite K9 Training Receipt`);
    console.log(`Body: Thank you for your payment! Transaction ID: ${checkoutID}`);
    console.log(`--------------------------`);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
