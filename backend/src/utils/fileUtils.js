const fs = require('fs');
const path = require('path');

/**
 * Safely delete one or more files from disk.
 * Silently ignores missing files — no throw.
 * @param {string | string[]} filePaths
 */
const cleanupFiles = (filePaths) => {
  const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
  paths.forEach((filePath) => {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error(`⚠️  Could not delete file ${filePath}:`, err.message);
    }
  });
};

/**
 * Return the extension of a filename in lowercase, including the dot.
 * @param {string} filename
 * @returns {string}  e.g. '.pdf'
 */
const getFileExtension = (filename) => path.extname(filename).toLowerCase();

/**
 * Return a human-readable file size string.
 * @param {number} bytes
 * @returns {string}
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

module.exports = { cleanupFiles, getFileExtension, formatFileSize };
