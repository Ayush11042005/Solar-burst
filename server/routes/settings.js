const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const HistoryEntry = require('../models/HistoryEntry');
const Upload = require('../models/Upload');
const AnalysisResult = require('../models/AnalysisResult');
const fs = require('fs');
const path = require('path');

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings
router.put('/', async (req, res) => {
  try {
    const { theme, defaultChartType, dataRetentionDays, notifications } = req.body;
    let settings = await Settings.getSettings();

    const changes = [];
    if (theme !== undefined && theme !== settings.theme) {
      changes.push(`theme: ${settings.theme} → ${theme}`);
      settings.theme = theme;
    }
    if (defaultChartType !== undefined && defaultChartType !== settings.defaultChartType) {
      changes.push(`chart type: ${settings.defaultChartType} → ${defaultChartType}`);
      settings.defaultChartType = defaultChartType;
    }
    if (dataRetentionDays !== undefined && dataRetentionDays !== settings.dataRetentionDays) {
      changes.push(`retention: ${settings.dataRetentionDays} → ${dataRetentionDays} days`);
      settings.dataRetentionDays = dataRetentionDays;
    }
    if (notifications !== undefined && notifications !== settings.notifications) {
      changes.push(`notifications: ${settings.notifications} → ${notifications}`);
      settings.notifications = notifications;
    }

    settings.updatedAt = new Date();
    await settings.save();

    // Log to history
    if (changes.length > 0) {
      await HistoryEntry.create({
        action: 'settings_change',
        description: `Settings updated: ${changes.join(', ')}`,
        metadata: { changes },
      });
    }

    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/settings/data — delete ALL data
router.delete('/data', async (req, res) => {
  try {
    // Delete all uploads, analyses, history
    const [uploads, analyses, history] = await Promise.all([
      Upload.deleteMany({}),
      AnalysisResult.deleteMany({}),
      HistoryEntry.deleteMany({}),
    ]);

    // Clean up uploaded files
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      files.forEach((f) => {
        try { fs.unlinkSync(path.join(uploadsDir, f)); } catch (e) { /* ignore */ }
      });
    }

    // Log this action
    await HistoryEntry.create({
      action: 'delete',
      description: `All data deleted: ${uploads.deletedCount} uploads, ${analyses.deletedCount} analyses`,
    });

    res.json({
      message: 'All data deleted',
      deleted: {
        uploads: uploads.deletedCount,
        analyses: analyses.deletedCount,
        history: history.deletedCount,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
