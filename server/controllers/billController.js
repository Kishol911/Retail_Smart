const Bill = require('../models/Bill');
const Product = require('../models/Product');

// Generates the next sequential bill number, e.g. "BILL-1001", "BILL-1002"...
const generateBillId = async () => {
  const lastBill = await Bill.findOne().sort({ createdAt: -1 });
  if (!lastBill || !lastBill.billId) return 'BILL-1001';

  const lastNum = parseInt(lastBill.billId.replace('BILL-', ''), 10);
  const nextNum = isNaN(lastNum) ? 1001 : lastNum + 1;
  return `BILL-${nextNum}`;
};

// @desc    Create a new bill (checkout). Also decrements stock for each item.
// @route   POST /api/bills
// @access  Private
const createBill = async (req, res, next) => {
  try {
    const {
      items,
      taxRate = 0,
      customerName,
      customerPhone,
      customerGST,
      customerAddress,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error('Bill must have at least one item');
    }

    // Re-fetch each product from DB so price/stock is trusted server-side,
    // not just whatever the frontend cart sent.
    const billItems = [];
    let subtotal = 0;

    for (const cartItem of items) {
      const product = await Product.findById(cartItem.productId);

      if (!product) {
        res.status(404);
        throw new Error(`Product not found: ${cartItem.productId}`);
      }
      if (product.quantity < cartItem.quantity) {
        res.status(400);
        throw new Error(`Insufficient stock for "${product.name}" (only ${product.quantity} left)`);
      }

      billItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
      });
      subtotal += product.price * cartItem.quantity;

      // Decrement stock
      product.quantity -= cartItem.quantity;
      await product.save();
    }

    const taxAmount = Math.round(((subtotal * taxRate) / 100) * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
    const billId = await generateBillId();

    const bill = await Bill.create({
      billId,
      items: billItems,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      customerGST: customerGST || '',
      customerAddress: customerAddress || '',
    });

    res.status(201).json(bill);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bills, optionally filtered by date range (?from=&to=)
//          and searched by bill ID or customer phone (?search=)
// @route   GET /api/bills
// @access  Private
const getBills = async (req, res, next) => {
  try {
    const { from, to, search } = req.query;
    const filter = {};

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) {
        // Include the entire "to" day
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    if (search) {
      filter.$or = [
        { billId: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }

    const bills = await Bill.find(filter).sort({ date: -1 });
    res.json(bills);
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single bill by id (full detail view)
// @route   GET /api/bills/:id
// @access  Private
const getBillById = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      res.status(404);
      throw new Error('Bill not found');
    }
    res.json(bill);
  } catch (error) {
    next(error);
  }
};

module.exports = { createBill, getBills, getBillById };
