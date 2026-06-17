const asyncHandler = require('express-async-handler');
const { processDocument } = require('../services/ocrService');
const { cleanupFiles } = require('../utils/fileUtils');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * POST /api/upload
 * Protected — accepts 1-10 files
 * Runs OCR / PDF text extraction and returns structured data for each file.
 */
const uploadDocuments = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return errorResponse(res, 'No files were uploaded', 400);
  }

  const results = [];
  const filePaths = req.files.map((f) => f.path);

  try {
    // Process all files concurrently
    const settled = await Promise.allSettled(
      req.files.map((file) => processDocument(file))
    );

    settled.forEach((result, index) => {
      const file = req.files[index];
      if (result.status === 'fulfilled') {
        results.push({
          success:      true,
          fileName:     file.originalname,
          fileSize:     file.size,
          ...result.value,
        });
      } else {
        console.error(`Failed to process ${file.originalname}:`, result.reason);
        results.push({
          success:      false,
          fileName:     file.originalname,
          documentType: 'other',
          rawText:      '',
          error:        result.reason?.message || 'Processing failed',
        });
      }
    });

    return successResponse(
      res,
      {
        count:   results.length,
        results,
      },
      'Documents processed successfully'
    );
  } finally {
    // Always clean up temp files from disk
    cleanupFiles(filePaths);
  }
});

module.exports = { uploadDocuments };
