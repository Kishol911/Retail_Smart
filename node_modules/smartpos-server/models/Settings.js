const mongoose = require('mongoose');

// This app has a single admin/shop, so report settings live in one
// singleton document rather than being duplicated per-user.
const settingsSchema = new mongoose.Schema(
  {
    reportsEnabled: { type: Boolean, default: true },
    exportFormat: { type: String, enum: ['PDF', 'Excel'], default: 'PDF' },
    autoMonthlyReport: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Always fetch/create the one settings document.
settingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
