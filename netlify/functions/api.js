const serverless = require('serverless-http');
const connectDB = require('../../server/db');
const app = require('../../server/index');

// Cache the database connection across function invocations
let isConnected = false;

module.exports.handler = async (event, context) => {
  // Prevent context timeout from waiting for empty event loops
  context.callbackWaitsForEmptyEventLoop = false;

  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  
  const handler = serverless(app);
  return handler(event, context);
};
