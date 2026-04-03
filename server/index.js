require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// ─── Security Middleware ─────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,  // Disable CSP so React app loads correctly
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting — 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// CORS — restrict in production
if (isProd) {
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
    credentials: true,
  }));
} else {
  app.use(cors());
}

// ─── Body Parsing ────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── Serve uploaded files ────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ──────────────────────────────────────────────────
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/analysis', require('./routes/analysis'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/history', require('./routes/history'));
app.use('/api/settings', require('./routes/settings'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: isProd ? 'production' : 'development', timestamp: new Date().toISOString() });
});

// ─── Serve React frontend in production ──────────────────────────
if (isProd) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));

  // SPA fallback — serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

// ─── Global Error Handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
  }
  res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
});

// ─── Start Server ────────────────────────────────────────────────
if (require.main === module) {
  async function start() {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 SolarBurst API server running on port ${PORT} (${isProd ? 'production' : 'development'})`);
    });
  }

  start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = app;
