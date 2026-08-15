const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  checkExistingProduct,
  createProduct,
  restockProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

// Every product route requires a logged-in admin (JWT).
router.use(protect);

// These specific paths must be declared BEFORE '/:id', otherwise Express
// would treat "check" or "restock" as an :id value.
router.get('/check', checkExistingProduct);
router.post('/restock', restockProduct);

router.route('/').get(getProducts).post(createProduct);
router.route('/:id').get(getProductById).put(updateProduct).delete(deleteProduct);

module.exports = router;
