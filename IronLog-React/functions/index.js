
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const mercadopago = require("mercadopago");
const axios = require("axios");
const crypto = require("crypto");

admin.initializeApp();

// --- MERCADOPAGO CONFIGURATION ---
const MP_ACCESS_TOKEN = functions.config().mercadopago ? functions.config().mercadopago.access_token : "YOUR_MERCADOPAGO_ACCESS_TOKEN";
const MP_WEBHOOK_SECRET = functions.config().mercadopago ? functions.config().mercadopago.webhook_secret : "YOUR_MERCADOPAGO_WEBHOOK_SECRET";

mercadopago.configure({
    access_token: MP_ACCESS_TOKEN,
});

// --- BINANCE PAY CONFIGURATION ---
const BINANCE_API_KEY = functions.config().binance ? functions.config().binance.api_key : "YOUR_BINANCE_API_KEY";
const BINANCE_SECRET_KEY = functions.config().binance ? functions.config().binance.secret_key : "YOUR_BINANCE_SECRET_KEY";
const BINANCE_API_URL = "https://bpay.binanceapi.com"; // Use "https://bpay.binanceapi.com" for production

// Helper to create Binance signature
const createBinanceSignature = (payload) => {
    const payloadString = JSON.stringify(payload);
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString("hex");
    const signaturePayload = `${timestamp}\n${nonce}\n${payloadString}\n`;
    const signature = crypto
        .createHmac("sha512", BINANCE_SECRET_KEY)
        .update(signaturePayload)
        .digest("hex")
        .toUpperCase();
    
    return { timestamp, nonce, signature };
};

// --- TIER PRICES ---
// Prices in USD for Binance, and local currency (e.g., ARS, BRL) for MercadoPago
const TIER_PRICES = {
    monthly: { usd: 5.99, local: 5000 },
    yearly: { usd: 49.99, local: 45000 },
    lifetime: { usd: 99.99, local: 85000 },
};

/**
 * =================================================================
 *                    MERCADOPAGO FUNCTIONS
 * =================================================================
 */

exports.createMercadoPagoPreference = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }

    const { tier, success_url, failure_url } = data;
    const price = TIER_PRICES[tier]?.local;

    if (!price) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid tier specified.");
    }

    const preference = {
        items: [{
            title: `IronLog PRO - ${tier}`,
            quantity: 1,
            currency_id: "ARS", // Change to your country's currency ID (e.g., BRL)
            unit_price: price,
        }],
        payer: {
            email: context.auth.token.email,
        },
        back_urls: {
            success: success_url,
            failure: failure_url,
        },
        auto_return: "approved",
        external_reference: context.auth.uid, // Link payment to Firebase User ID
        notification_url: `https://<YOUR_REGION>-<YOUR_PROJECT_ID>.cloudfunctions.net/mercadoPagoWebhook`, // Replace with your actual webhook URL
    };

    try {
        const response = await mercadopago.preferences.create(preference);
        return { id: response.body.id, init_point: response.body.init_point };
    } catch (error) {
        console.error("Error creating MercadoPago preference:", error);
        throw new functions.https.HttpsError("internal", "Could not create MercadoPago preference.");
    }
});

exports.mercadoPagoWebhook = functions.https.onRequest(async (req, res) => {
    const { "x-signature-id": signatureId, "x-request-id": requestId } = req.headers;
    const { topic, id } = req.query;

    if (topic !== "payment" || !id) {
        return res.status(200).send("Not a payment notification.");
    }
    
    // TODO: Verify webhook signature for production security
    // This is a simplified verification. Refer to MercadoPago docs for the full implementation.
    // const check = crypto.createHmac('sha256', MP_WEBHOOK_SECRET).update(`id:${id};request-id:${requestId};ts:${signatureId}`).digest('hex');

    try {
        const payment = await mercadopago.payment.findById(Number(id));
        const paymentData = payment.body;

        if (paymentData.status === "approved") {
            const uid = paymentData.external_reference;
            const tier = paymentData.items[0].title.split(" - ")[1].toLowerCase();

            const newSub = {
                isPro: true,
                tier: tier,
                expiryDate: null, // Handle expiry for subscriptions later if needed
                paymentSource: "MercadoPago",
            };

            await admin.firestore().doc(`users/${uid}/data/subscription`).set(newSub, { merge: true });
            console.log(`Successfully granted PRO tier via MercadoPago to user ${uid}`);
        }

        res.status(200).send("Webhook received");
    } catch (error) {
        console.error("Error handling MercadoPago webhook:", error);
        res.status(500).send("Webhook processing error");
    }
});


/**
 * =================================================================
 *                      BINANCE PAY FUNCTIONS
 * =================================================================
 */

exports.createBinancePayOrder = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }

    const { tier } = data;
    const price = TIER_PRICES[tier]?.usd;
    
    if (!price) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid tier specified.");
    }
    
    const merchantTradeNo = `IRONLOG-${context.auth.uid}-${tier}-${Date.now()}`;

    const orderPayload = {
        env: { terminalType: "WEB" },
        merchantTradeNo: merchantTradeNo,
        orderAmount: price,
        currency: "USDT", // BUSD or USDT are common
        goods: {
            goodsType: "01", // Virtual Goods
            goodsCategory: "D000", // Other
            referenceGoodsId: `PRO_${tier.toUpperCase()}`,
            goodsName: `IronLog PRO - ${tier}`,
        },
        // For webhook notifications
        webhookUrl: `https://<YOUR_REGION>-<YOUR_PROJECT_ID>.cloudfunctions.net/binancePayWebhook`,
    };

    const { timestamp, nonce, signature } = createBinanceSignature(orderPayload);

    try {
        const response = await axios.post(`${BINANCE_API_URL}/binancepay/openapi/v2/order`, orderPayload, {
            headers: {
                "Content-Type": "application/json",
                "BinancePay-Timestamp": timestamp,
                "BinancePay-Nonce": nonce,
                "BinancePay-Certificate-SN": BINANCE_API_KEY,
                "BinancePay-Signature": signature,
            },
        });

        if (response.data.status === "SUCCESS") {
            return { checkoutUrl: response.data.data.checkoutUrl };
        } else {
            console.error("Binance Pay API Error:", response.data.errorMessage);
            throw new functions.https.HttpsError("internal", `Binance Pay Error: ${response.data.errorMessage}`);
        }
    } catch (error) {
        console.error("Error creating Binance Pay order:", error.response ? error.response.data : error);
        throw new functions.https.HttpsError("internal", "Could not create Binance Pay order.");
    }
});


exports.binancePayWebhook = functions.https.onRequest(async (req, res) => {
    // 1. Verify Signature (CRITICAL FOR SECURITY)
    const { "binancepay-timestamp": timestamp, "binancepay-nonce": nonce, "binancepay-signature": signature } = req.headers;
    const payloadString = JSON.stringify(req.body);
    const signaturePayload = `${timestamp}\n${nonce}\n${payloadString}\n`;
    
    const expectedSignature = crypto
        .createHmac("sha512", BINANCE_SECRET_KEY)
        .update(signaturePayload)
        .digest("hex")
        .toUpperCase();

    if (signature !== expectedSignature) {
        console.error("Invalid Binance Pay webhook signature.");
        return res.status(400).json({ returnCode: "FAIL", returnMessage: "Invalid signature" });
    }

    const { bizStatus, merchantTradeNo } = req.body.data;
    
    if (bizStatus === "PAY_SUCCESS") {
        try {
            // Extract UID and tier from merchantTradeNo
            const [, uid, tier] = merchantTradeNo.split("-");
            
            const newSub = {
                isPro: true,
                tier: tier.toLowerCase(),
                expiryDate: null, // Handle expiry later if needed
                paymentSource: "BinancePay",
            };

            await admin.firestore().doc(`users/${uid}/data/subscription`).set(newSub, { merge: true });
            console.log(`Successfully granted PRO tier via Binance Pay to user ${uid}`);

        } catch (error) {
            console.error("Error processing successful Binance Pay payment:", error);
            // If processing fails, tell Binance to try again later
            return res.status(500).json({ returnCode: "FAIL", returnMessage: "Internal server error" });
        }
    }

    // Acknowledge receipt to Binance
    res.status(200).json({ returnCode: "SUCCESS", returnMessage: null });
});

