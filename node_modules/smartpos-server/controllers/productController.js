const Product = require('../models/Product');

// Generates the next unique product ID for a category, e.g. "Electronics" -> "E1", "E2"...
// Prefix = first letter of the category (uppercased). Number = highest existing + 1
// among products that already use that prefix.
const generateProductId = async (category) => {
  const prefix = category.trim().charAt(0).toUpperCase();

  const existing = await Product.find({ productId: { $regex: `^${prefix}\\d+$` } })
    .sort({ productId: -1 })
    .limit(50); // small buffer since sort is lexical, not numeric

  let maxNum = 0;
  existing.forEach((p) => {
    const num = parseInt(p.productId.slice(prefix.length), 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  });

  return `${prefix}${maxNum + 1}`;
};

// @desc    Get all products (supports ?search=, ?category=, ?sort=name|price|quantity, ?order=asc|desc)
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res, next) => {
  try {
    const { search, category, sort, order } = req.query;

    const filter = {};

    if (search) {
      // Case-insensitive partial match on product name
      filter.name = { $regex: search, $options: 'i' };
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    // Default sort is newest first; allow explicit column sorting for the
    // Inventory page's A-Z / Z-A filter buttons on Name, Price, Quantity.
    const sortableFields = ['name', 'price', 'quantity'];
    let sortSpec = { createdAt: -1 };
    if (sort && sortableFields.includes(sort)) {
      sortSpec = { [sort]: order === 'desc' ? -1 : 1 };
    }

    const products = await Product.find(filter).sort(sortSpec);
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Check whether a product with this exact name already exists
//          (used by the "Add Product" modal to decide new vs. restock)
// @route   GET /api/products/check?name=...
// @access  Private
const checkExistingProduct = async (req, res, next) => {
  try {
    const { name } = req.query;
    if (!name) {
      res.status(400);
      throw new Error('Name is required');
    }

    // Exact match, case-insensitive
    const product = await Product.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });
    res.json({ exists: !!product, product: product || null });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single product by id
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new product (auto-assigns a unique productId)
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res, next) => {
  try {
    const { name, price, quantity, category } = req.body;

    if (!name || price === undefined || quantity === undefined || !category) {
      res.status(400);
      throw new Error('Please provide name, price, quantity and category');
    }

    const productId = await generateProductId(category);
    const product = await Product.create({ productId, name, price, quantity, category });
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Restock an existing product — find it by its productId or exact name,
//          and add to its current quantity (rather than overwriting it).
// @route   POST /api/products/restock
// @access  Private
const restockProduct = async (req, res, next) => {
  try {
    const { identifier, addQuantity } = req.body;

    if (!identifier || !addQuantity || addQuantity <= 0) {
      res.status(400);
      throw new Error('Please provide a product ID or name, and a positive quantity to add');
    }

    const product = await Product.findOne({
      $or: [
        { productId: identifier.trim().toUpperCase() },
        { name: { $regex: `^${identifier.trim()}$`, $options: 'i' } },
      ],
    });

    if (!product) {
      res.status(404);
      throw new Error('No matching product found for that ID or name');
    }

    product.quantity += Number(addQuantity);
    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const { name, price, quantity, category } = req.body;

    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;
    if (quantity !== undefined) product.quantity = quantity;
    if (category !== undefined) product.category = category;

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    await product.deleteOne();
    res.json({ message: 'Product removed', _id: req.params.id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  checkExistingProduct,
  createProduct,
  restockProduct,
  updateProduct,
  deleteProduct,
};
