const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { getOverview } = require('../controllers/devsecopsController');

const router = express.Router();

router.get('/overview', asyncHandler(getOverview));

module.exports = router;
