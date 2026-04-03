const express = require('express');
const router = express.Router();
const Upload = require('../models/Upload');
const AnalysisResult = require('../models/AnalysisResult');
const HistoryEntry = require('../models/HistoryEntry');

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUploads, totalAnalyses, recentUpload, storageAgg, recentHistory, uploadsOverTime, analysisTypes] =
      await Promise.all([
        Upload.countDocuments(),
        AnalysisResult.countDocuments(),
        Upload.findOne().sort({ uploadedAt: -1 }).select('uploadedAt originalName').lean(),
        Upload.aggregate([{ $group: { _id: null, totalSize: { $sum: '$fileSize' } } }]),
        HistoryEntry.find().sort({ timestamp: -1 }).limit(5).lean(),
        // Uploads per day for last 30 days
        Upload.aggregate([
          { $match: { uploadedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$uploadedAt' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        // Analysis type distribution
        AnalysisResult.aggregate([
          { $group: { _id: '$analysisType', count: { $sum: 1 } } },
        ]),
      ]);

    res.json({
      totalUploads,
      totalAnalyses,
      mostRecentUpload: recentUpload,
      storageUsed: storageAgg[0]?.totalSize || 0,
      recentActivity: recentHistory,
      uploadsOverTime: uploadsOverTime.map((d) => ({ date: d._id, count: d.count })),
      analysisTypes: analysisTypes.map((d) => ({ name: d._id || 'full', value: d.count })),
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
