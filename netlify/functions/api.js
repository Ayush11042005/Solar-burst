const serverless = require('serverless-http');
const connectDB = require('../../server/db');
const app = require('../../server/index');

module.exports.handler = async (event, context) => {
  // Prevent context timeout from waiting for empty event loops (fixes buffering/hangs)
  context.callbackWaitsForEmptyEventLoop = false;

  // Always await connection; it uses global cache securely under the hood
  await connectDB();
  
  const handler = serverless(app);
  return handler(event, context);
};
