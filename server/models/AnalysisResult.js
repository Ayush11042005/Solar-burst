const mongoose = require('mongoose');

const analysisResultSchema = new mongoose.Schema({
  uploadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Upload', required: true, index: true },
  analysisType: { type: String, default: 'full' },
  results: { type: mongoose.Schema.Types.Mixed, default: {} },
  charts: [{ type: mongoose.Schema.Types.Mixed }],
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'completed', 'error'], default: 'completed' },
});

analysisResultSchema.index({ uploadId: 1, createdAt: -1 });

module.exports = mongoose.model('AnalysisResult', analysisResultSchema);
