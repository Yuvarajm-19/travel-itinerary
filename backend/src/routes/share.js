const { Router } = require('express');
const { getByShareId } = require('../controllers/itineraryController');

const router = Router();

/**
 * GET /api/share/:shareId
 * Public — no auth required
 */
router.get('/:shareId', getByShareId);

module.exports = router;
