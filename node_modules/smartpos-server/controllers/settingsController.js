const Settings = require('../models/Settings');

// @desc    Get report/shop settings (singleton)
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSingleton();
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

// @desc    Update report settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSingleton();
    const { reportsEnabled, exportFormat, autoMonthlyReport } = req.body;

    if (reportsEnabled !== undefined) settings.reportsEnabled = reportsEnabled;
    if (exportFormat !== undefined) settings.exportFormat = exportFormat;
    if (autoMonthlyReport !== undefined) settings.autoMonthlyReport = autoMonthlyReport;

    const updated = await settings.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };
