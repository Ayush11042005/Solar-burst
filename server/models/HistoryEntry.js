const mongoose = require('mongoose');

const historyEntrySchema = new mongoose.Schema({
  action: { type: String, required: true, enum: ['upload', 'analysis', 'settings_change', 'delete'] },
  description: { type: String, required: true },
  uploadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Upload', default: null },
  analysisId: { type: mongoose.Schema.Types.ObjectId, ref: 'AnalysisResult', default: null },
  timestamp: { type: Date, default: Date.now, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
});

historyEntrySchema.index({ timestamp: -1 });
historyEntrySchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('HistoryEntry', historyEntrySchema);
