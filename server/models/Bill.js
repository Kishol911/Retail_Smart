const mongoose = require('mongoose');

// One line item on a bill — snapshot of the product at time of sale
// (name/price copied in, so historical bills stay accurate even if the
// product is later edited or deleted from Inventory).
const billItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    price: { type: Number, required: true }, // price per unit at time of sale
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    // Short, human-friendly bill number (e.g. "BILL-1001") — separate from
    // Mongo's _id, used for display, search, and printed on invoices.
    billId: { type: String, required: true, unique: true },
    items: {
      type: [billItemSchema],
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    subtotal: { type: Number, required: true }, // sum of items before tax
    taxRate: { type: Number, default: 0 }, // e.g. 18 for 18% GST
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true }, // subtotal + taxAmount
    customerName: { type: String, default: 'Walk-in Customer' },
    customerPhone: { type: String, default: '' },
    customerGST: { type: String, default: '' }, // optional, customer's own GSTIN
    customerAddress: { type: String, default: '' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

billSchema.index({ date: -1 });
billSchema.index({ customerPhone: 1 });

module.exports = mongoose.model('Bill', billSchema);
