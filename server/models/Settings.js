const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
  defaultChartType: { type: String, enum: ['bar', 'line', 'pie', 'area'], default: 'bar' },
  dataRetentionDays: { type: Number, default: 90 },
  notifications: { type: Boolean, default: true },
  apiKey: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
});

// Ensure singleton
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      apiKey: require('crypto').randomBytes(16).toString('hex'),
    });
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
