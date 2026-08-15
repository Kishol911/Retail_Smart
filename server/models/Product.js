const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    // Auto-generated, human-friendly unique ID, e.g. "E1", "A1", "C30" —
    // prefix is the first letter of the category, number increments per prefix.
    // Used for fast restocking by ID instead of typing the full product name.
    productId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
  },
  { timestamps: true }
);

// Speeds up search-by-name and filter-by-category queries used on the Inventory page.
productSchema.index({ name: 'text' });
productSchema.index({ category: 1 });

module.exports = mongoose.model('Product', productSchema);
