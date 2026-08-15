const Bill = require('../models/Bill');

// @desc    Get dashboard analytics: today's sales, this month's sales,
//          order counts, and best-selling products (by quantity sold)
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayAgg, monthAgg, bestSellers, recentBills] = await Promise.all([
      Bill.aggregate([
        { $match: { date: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      ]),
      Bill.aggregate([
        { $match: { date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      ]),
      Bill.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            unitsSold: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { unitsSold: -1 } },
        { $limit: 5 },
      ]),
      Bill.find().sort({ date: -1 }).limit(5),
    ]);

    res.json({
      todaySales: todayAgg[0]?.total || 0,
      todayOrders: todayAgg[0]?.orders || 0,
      monthSales: monthAgg[0]?.total || 0,
      monthOrders: monthAgg[0]?.orders || 0,
      bestSellers: bestSellers.map((b) => ({
        name: b._id,
        unitsSold: b.unitsSold,
        revenue: b.revenue,
      })),
      recentBills,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
