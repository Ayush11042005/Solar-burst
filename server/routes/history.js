const express = require('express');
const router = express.Router();
const HistoryEntry = require('../models/HistoryEntry');

// GET /api/history — paginated, filterable
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const filter = {};

    // Filter by action type
    if (req.query.action && req.query.action !== 'all') {
      filter.action = req.query.action;
    }

    // Search by description
    if (req.query.search) {
      filter.description = { $regex: req.query.search, $options: 'i' };
    }

    // Date range filter
    if (req.query.from || req.query.to) {
      filter.timestamp = {};
      if (req.query.from) filter.timestamp.$gte = new Date(req.query.from);
      if (req.query.to) filter.timestamp.$lte = new Date(req.query.to);
    }

    const [entries, total] = await Promise.all([
      HistoryEntry.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      HistoryEntry.countDocuments(filter),
    ]);

    res.json({
      entries,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + entries.length < total,
    });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/history — clear all history
router.delete('/', async (req, res) => {
  try {
    const result = await HistoryEntry.deleteMany({});
    res.json({ message: 'History cleared', deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
