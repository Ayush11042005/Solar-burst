const serverless = require('serverless-http');
const connectDB = require('../../server/db');
const app = require('../../server/index');

module.exports.handler = async (event, context) => {
  // Prevent context timeout from waiting for empty event loops (fixes buffering/hangs)
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    // Always await connection; it uses global cache securely under the hood
    await connectDB();
  } catch (e) {
    // If MongoDB blocks the connection or URI is missing, Netlify usually crashes with 502 Bad Gateway.
    // Instead, we catch it here and send a clean 500 JSON response to the React frontend.
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: "Database Connection Failed",
        details: e.message,
        hint: "Make sure MONGODB_URI is set in Netlify Environment Variables AND you allowed IP 0.0.0.0/0 in MongoDB Atlas Network Access."
      })
    };
  }
  
  const handler = serverless(app);
  return handler(event, context);
};
