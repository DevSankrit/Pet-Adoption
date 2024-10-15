module.exports = {
    MID: "YOUR_MERCHANT_ID", // Merchant ID from Paytm dashboard
    KEY: "YOUR_MERCHANT_KEY", // Merchant Key from Paytm dashboard
    WEBSITE: "WEBSTAGING", // For testing, use "WEBSTAGING"; for production, use "DEFAULT"
    CHANNEL_ID: "WEB",
    INDUSTRY_TYPE_ID: "Retail",
    CALLBACK_URL: "http://localhost:3000/payment/callback" // URL to handle the response
};
