const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Itinerary = require('../models/Itinerary');
const { generateItinerary } = require('../services/geminiService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// ── Generate ──────────────────────────────────────────────────────────────────
/**
 * POST /api/itinerary/generate
 * Protected — body: { extractedData: [...], title?: string }
 */
const generate = asyncHandler(async (req, res) => {
  const { extractedData, title } = req.body;

  if (!Array.isArray(extractedData) || extractedData.length === 0) {
    return errorResponse(res, 'extractedData array is required and must not be empty', 400);
  }

  // Call Gemini
  let generatedItinerary;
  try {
    generatedItinerary = await generateItinerary(extractedData);
  } catch (err) {
    return errorResponse(res, `AI generation failed: ${err.message}`, 502);
  }

  // Persist to DB
  const itinerary = await Itinerary.create({
    userId:            req.user._id,
    extractedData,
    generatedItinerary,
    title:             title || generatedItinerary.tripTitle || 'My Trip',
    tags:              generatedItinerary.destination ? [generatedItinerary.destination] : [],
  });

  return successResponse(res, { itinerary }, 'Itinerary generated successfully', 201);
});

// ── Get all (paginated) ───────────────────────────────────────────────────────
/**
 * GET /api/itinerary?page=1&limit=10&search=paris
 * Protected
 */
const getAll = asyncHandler(async (req, res) => {
  const page   = Math.max(parseInt(req.query.page  || '1',  10), 1);
  const limit  = Math.min(parseInt(req.query.limit || '10', 10), 50);
  const search = req.query.search?.trim();
  const skip   = (page - 1) * limit;

  const filter = { userId: req.user._id };

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [
      { title: regex },
      { 'generatedItinerary.tripTitle':   regex },
      { 'generatedItinerary.destination': regex },
    ];
  }

  const [itineraries, total] = await Promise.all([
    Itinerary.find(filter)
      .select('title generatedItinerary.tripTitle generatedItinerary.destination generatedItinerary.startDate generatedItinerary.endDate generatedItinerary.summary shareId isPublic createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Itinerary.countDocuments(filter),
  ]);

  return successResponse(res, {
    itineraries,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
});

// ── Get stats ─────────────────────────────────────────────────────────────────
/**
 * GET /api/itinerary/stats
 * Protected
 */
const getStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [total, recent, docTypes] = await Promise.all([
    Itinerary.countDocuments({ userId }),
    Itinerary.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title generatedItinerary.tripTitle generatedItinerary.destination generatedItinerary.startDate shareId createdAt')
      .lean(),
    Itinerary.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$extractedData' },
      { $group: { _id: '$extractedData.documentType', count: { $sum: 1 } } },
    ]),
  ]);

  return successResponse(res, {
    totalTrips:   total,
    recentTrips:  recent,
    documentTypes: docTypes,
  });
});

// ── Get single ────────────────────────────────────────────────────────────────
/**
 * GET /api/itinerary/:id
 * Protected — owner only
 */
const getOne = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return errorResponse(res, 'Invalid itinerary ID', 400);
  }

  const itinerary = await Itinerary.findOne({
    _id:    req.params.id,
    userId: req.user._id,
  });

  if (!itinerary) return errorResponse(res, 'Itinerary not found', 404);

  return successResponse(res, { itinerary });
});

// ── Update title / tags / visibility ─────────────────────────────────────────
/**
 * PUT /api/itinerary/:id
 * Protected — owner only
 */
const update = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return errorResponse(res, 'Invalid itinerary ID', 400);
  }

  const allowed = {};
  if (req.body.title    !== undefined) allowed.title    = req.body.title;
  if (req.body.tags     !== undefined) allowed.tags     = req.body.tags;
  if (req.body.isPublic !== undefined) allowed.isPublic = req.body.isPublic;

  const itinerary = await Itinerary.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    allowed,
    { new: true, runValidators: true }
  );

  if (!itinerary) return errorResponse(res, 'Itinerary not found', 404);

  return successResponse(res, { itinerary }, 'Itinerary updated');
});

// ── Delete ────────────────────────────────────────────────────────────────────
/**
 * DELETE /api/itinerary/:id
 * Protected — owner only
 */
const remove = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return errorResponse(res, 'Invalid itinerary ID', 400);
  }

  const itinerary = await Itinerary.findOneAndDelete({
    _id:    req.params.id,
    userId: req.user._id,
  });

  if (!itinerary) return errorResponse(res, 'Itinerary not found', 404);

  return successResponse(res, { id: req.params.id }, 'Itinerary deleted successfully');
});

// ── Public share view ─────────────────────────────────────────────────────────
/**
 * GET /api/share/:shareId
 * Public
 */
const getByShareId = asyncHandler(async (req, res) => {
  const itinerary = await Itinerary.findOne({
    shareId:  req.params.shareId,
    isPublic: true,
  })
    .populate('userId', 'name')
    .lean();

  if (!itinerary) {
    return errorResponse(res, 'Shared itinerary not found or is private', 404);
  }

  return successResponse(res, { itinerary });
});

module.exports = { generate, getAll, getStats, getOne, update, remove, getByShareId };
