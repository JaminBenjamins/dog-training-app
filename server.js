const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();

const MPESA_BASE_URLS = {
    sandbox: 'https://sandbox.safaricom.co.ke',
    production: 'https://api.safaricom.co.ke'
};

const mpesaConfig = {
    environment: (process.env.MPESA_ENVIRONMENT || 'sandbox').toLowerCase(),
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    shortcode: process.env.MPESA_SHORTCODE,
    partyB: process.env.MPESA_PARTY_B || process.env.MPESA_SHORTCODE,
    passkey: process.env.MPESA_PASSKEY,
    callbackUrl: process.env.MPESA_CALLBACK_URL,
    transactionType: process.env.MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline',
    accountReference: process.env.MPESA_ACCOUNT_REFERENCE || 'DogmanUnleashed254',
    transactionDescription: process.env.MPESA_TRANSACTION_DESC || 'Dogman Unleashed 254 Booking',
    enforceIpWhitelist: process.env.MPESA_ENFORCE_IP_WHITELIST === 'true',
    testAmount: process.env.MPESA_TEST_AMOUNT ? Number(process.env.MPESA_TEST_AMOUNT) : null
};

const mpesaBaseUrl = MPESA_BASE_URLS[mpesaConfig.environment] || MPESA_BASE_URLS.sandbox;
let tokenCache = {
    accessToken: null,
    expiresAt: 0
};

function isPlaceholder(value) {
    return !value || /replace|your_|placeholder/i.test(String(value));
}

// Enable CORS for hosted frontends.
app.use((req, res, next) => {
    const allowedOrigin = process.env.FRONTEND_ORIGIN || '*';
    res.header('Access-Control-Allow-Origin', allowedOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
});

app.use(express.json());
app.use(express.static('.'));

// In-memory store for payment statuses (CheckoutRequestID -> Status).
// Use a database before handling real production bookings.
const pendingPayments = new Map();

const SAFARICOM_IPS = [
    '196.201.214.200', '196.201.214.206', '196.201.213.114',
    '196.201.214.207', '196.201.214.208', '196.201.213.44',
    '196.201.212.127', '196.201.212.138', '196.201.212.129',
    '196.201.212.136', '196.201.212.74', '196.201.212.69'
];

function requireMpesaConfig() {
    const missing = [
        ['MPESA_CONSUMER_KEY', mpesaConfig.consumerKey],
        ['MPESA_CONSUMER_SECRET', mpesaConfig.consumerSecret],
        ['MPESA_SHORTCODE', mpesaConfig.shortcode],
        ['MPESA_PASSKEY', mpesaConfig.passkey],
        ['MPESA_CALLBACK_URL', mpesaConfig.callbackUrl]
    ].filter(([, value]) => isPlaceholder(value));

    if (missing.length) {
        const names = missing.map(([name]) => name).join(', ');
        throw new Error(`Missing required M-Pesa environment variables: ${names}`);
    }
}

function normalizeSafaricomPhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');

    if (/^2547\d{8}$/.test(digits) || /^2541\d{8}$/.test(digits)) {
        return digits;
    }

    if (/^07\d{8}$/.test(digits) || /^01\d{8}$/.test(digits)) {
        return `254${digits.slice(1)}`;
    }

    if (/^7\d{8}$/.test(digits) || /^1\d{8}$/.test(digits)) {
        return `254${digits}`;
    }

    return null;
}

function normalizeAmount(amount) {
    const configuredTestAmount = Number.isFinite(mpesaConfig.testAmount) ? mpesaConfig.testAmount : null;
    const rawAmount = configuredTestAmount || amount;
    const normalized = Math.round(Number(rawAmount));

    if (!Number.isFinite(normalized) || normalized < 1) {
        return null;
    }

    return normalized;
}

function getTimestamp() {
    return new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
}

function getPassword(timestamp) {
    return Buffer.from(`${mpesaConfig.shortcode}${mpesaConfig.passkey}${timestamp}`).toString('base64');
}

function getClientIp(req) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const rawIp = forwardedFor ? forwardedFor.split(',')[0].trim() : req.socket.remoteAddress;
    return rawIp.replace(/^.*:/, '');
}

function whitelistSafaricomIps(req, res, next) {
    if (!mpesaConfig.enforceIpWhitelist) {
        return next();
    }

    const clientIp = getClientIp(req);

    if (SAFARICOM_IPS.includes(clientIp)) {
        return next();
    }

    console.warn(`[SECURITY] M-Pesa callback blocked from non-Safaricom IP: ${clientIp}`);
    return res.status(403).json({ error: 'IP not whitelisted' });
}

async function getMpesaAccessToken() {
    requireMpesaConfig();

    if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt) {
        return tokenCache.accessToken;
    }

    const auth = Buffer
        .from(`${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`)
        .toString('base64');

    const response = await axios.get(
        `${mpesaBaseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        { headers: { Authorization: `Basic ${auth}` } }
    );

    const expiresIn = Number(response.data.expires_in || 3599);
    tokenCache = {
        accessToken: response.data.access_token,
        expiresAt: Date.now() + Math.max(expiresIn - 60, 60) * 1000
    };

    return tokenCache.accessToken;
}

app.get('/api/health', (req, res) => {
    const configured = Boolean(
        !isPlaceholder(mpesaConfig.consumerKey) &&
        !isPlaceholder(mpesaConfig.consumerSecret) &&
        !isPlaceholder(mpesaConfig.shortcode) &&
        !isPlaceholder(mpesaConfig.passkey) &&
        !isPlaceholder(mpesaConfig.callbackUrl)
    );

    res.json({
        ok: true,
        mpesaEnvironment: mpesaConfig.environment,
        mpesaConfigured: configured,
        callbackConfigured: !isPlaceholder(mpesaConfig.callbackUrl),
        passkeyConfigured: !isPlaceholder(mpesaConfig.passkey)
    });
});

app.post('/api/stkpush', async (req, res) => {
    const phone = normalizeSafaricomPhone(req.body.phone);
    const amount = normalizeAmount(req.body.amount);

    if (!phone) {
        return res.status(400).json({ error: 'Enter a valid Safaricom number, for example 0712345678.' });
    }

    if (!amount) {
        return res.status(400).json({ error: 'Enter a valid M-Pesa amount.' });
    }

    try {
        const token = await getMpesaAccessToken();
        const timestamp = getTimestamp();
        const password = getPassword(timestamp);

        const stkPushData = {
            BusinessShortCode: mpesaConfig.shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: mpesaConfig.transactionType,
            Amount: amount,
            PartyA: phone,
            PartyB: mpesaConfig.partyB,
            PhoneNumber: phone,
            CallBackURL: mpesaConfig.callbackUrl,
            AccountReference: mpesaConfig.accountReference,
            TransactionDesc: mpesaConfig.transactionDescription
        };

        const response = await axios.post(
            `${mpesaBaseUrl}/mpesa/stkpush/v1/processrequest`,
            stkPushData,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        pendingPayments.set(response.data.CheckoutRequestID, {
            status: 'PENDING',
            amount,
            phone,
            details: null,
            timestamp: Date.now()
        });

        res.status(200).json(response.data);
    } catch (error) {
        console.error('STK Push Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.response ? error.response.data : error.message });
    }
});

app.post('/api/callback', whitelistSafaricomIps, (req, res) => {
    console.log('M-Pesa Callback Received:', JSON.stringify(req.body, null, 2));

    try {
        const result = req.body.Body && req.body.Body.stkCallback;

        if (!result) {
            throw new Error('Invalid STK callback payload');
        }

        const checkoutRequestID = result.CheckoutRequestID;
        const resultCode = Number(result.ResultCode);
        const resultDesc = result.ResultDesc;

        if (resultCode === 0) {
            const metadata = (result.CallbackMetadata && result.CallbackMetadata.Item) || [];
            const findMetadata = (name) => metadata.find((item) => item.Name === name);
            const receiptNumber = (findMetadata('MpesaReceiptNumber') || {}).Value || 'N/A';
            const amount = (findMetadata('Amount') || {}).Value;
            const phone = (findMetadata('PhoneNumber') || {}).Value;

            console.log(`[SUCCESS] Payment ${checkoutRequestID} confirmed. Receipt: ${receiptNumber}`);

            pendingPayments.set(checkoutRequestID, {
                status: 'SUCCESS',
                details: { receiptNumber, amount, phone },
                timestamp: Date.now()
            });

            sendReceiptEmail(checkoutRequestID, receiptNumber);
        } else {
            console.warn(`[FAILURE] Payment ${checkoutRequestID} failed. Reason: ${resultDesc} (Code: ${resultCode})`);

            pendingPayments.set(checkoutRequestID, {
                status: 'FAILED',
                details: { reason: resultDesc, code: resultCode },
                timestamp: Date.now()
            });
        }
    } catch (err) {
        console.error('Error processing M-Pesa callback:', err.message);
    }

    res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
});

app.get('/api/payment-status/:checkoutID', (req, res) => {
    const payment = pendingPayments.get(req.params.checkoutID);

    if (!payment) {
        return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(payment);
});

app.post('/api/stkquery', async (req, res) => {
    const checkoutRequestID = req.body.CheckoutRequestID;

    if (!checkoutRequestID) {
        return res.status(400).json({ error: 'CheckoutRequestID is required.' });
    }

    try {
        const token = await getMpesaAccessToken();
        const timestamp = getTimestamp();

        const response = await axios.post(
            `${mpesaBaseUrl}/mpesa/stkpushquery/v1/query`,
            {
                BusinessShortCode: mpesaConfig.shortcode,
                Password: getPassword(timestamp),
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestID
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.ResultCode === '0') {
            const existingPayment = pendingPayments.get(checkoutRequestID) || {};
            pendingPayments.set(checkoutRequestID, {
                ...existingPayment,
                status: 'SUCCESS',
                details: {
                    ...(existingPayment.details || {}),
                    receiptNumber: response.data.MpesaReceiptNumber || 'STK-QUERY-CONFIRMED'
                },
                timestamp: Date.now()
            });
        }

        res.status(200).json(response.data);
    } catch (error) {
        console.error('Query Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.response ? error.response.data : error.message });
    }
});

function sendReceiptEmail(checkoutID, receiptNo) {
    console.log('--- [EMAIL SIMULATION] ---');
    console.log('To: user@example.com');
    console.log('Subject: Your Elite K9 Training Receipt');
    console.log(`Body: Thank you for your payment! Transaction ID: ${checkoutID} | Receipt: ${receiptNo}`);
    console.log('--------------------------');
}

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

module.exports = app;
