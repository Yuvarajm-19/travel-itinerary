const { Router } = require('express');
const { protect } = require('../middleware/auth');
const upload = require('../config/multer');
const { uploadDocuments } = require('../controllers/uploadController');

const router = Router();

/**
 * POST /api/upload
 * Protected — multipart/form-data, field name: "documents" (1-10 files)
 */
router.post(
  '/',
  protect,
  upload.array('documents', 10),
  uploadDocuments
);

module.exports = router;
