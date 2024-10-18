// In your Paypal.js file
const paypal = require('@paypal/checkout-server-sdk');

PAYPAL_CLIENT_ID = 'AQV3jpbKQpeNicX0ZIolaUi7WO8zK0LuR9TSFBxbQ_CelIjeEl2UJfVNQfVzIHt29F6-Y8Qdg9KZGy5B'; // Your actual sandbox client ID
PAYPAL_CLIENT_SECRET = 'EEO1MM7uqyyN27IBNPuLiTpsRkTzZnGnPFbIpfsjj68eSJ7EdCWT3ONIz73wgnRGjG4hWDRBj_WLGxOW'; // Your actual sandbox secret

// Creating an environment
const environment = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
);

const client = new paypal.core.PayPalHttpClient(environment);

module.exports = { client, paypal }; // Export paypal for use in server.js
