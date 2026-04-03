const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now, index: true },
  rowCount: { type: Number, default: 0 },
  columnNames: [String],
  status: { type: String, enum: ['uploaded', 'parsed', 'analyzed', 'error'], default: 'uploaded' },
  filePath: { type: String },
  fileSize: { type: Number, default: 0 },
  parsedData: { type: mongoose.Schema.Types.Mixed, default: [] },
});

uploadSchema.index({ uploadedAt: -1 });

module.exports = mongoose.model('Upload', uploadSchema);
