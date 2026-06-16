const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const flightSchema = new mongoose.Schema({
  airline:        { type: String, default: null },
  flightNumber:   { type: String, default: null },
  departureCity:  { type: String, default: null },
  arrivalCity:    { type: String, default: null },
  departureDate:  { type: String, default: null },
  departureTime:  { type: String, default: null },
  arrivalTime:    { type: String, default: null },
  terminal:       { type: String, default: null },
  bookingRef:     { type: String, default: null },
}, { _id: false });

const hotelSchema = new mongoose.Schema({
  hotelName:    { type: String, default: null },
  checkInDate:  { type: String, default: null },
  checkOutDate: { type: String, default: null },
  address:      { type: String, default: null },
  roomType:     { type: String, default: null },
  bookingRef:   { type: String, default: null },
}, { _id: false });

const trainSchema = new mongoose.Schema({
  trainNumber:        { type: String, default: null },
  trainName:          { type: String, default: null },
  departureStation:   { type: String, default: null },
  arrivalStation:     { type: String, default: null },
  date:               { type: String, default: null },
  departureTime:      { type: String, default: null },
  arrivalTime:        { type: String, default: null },
  class:              { type: String, default: null },
  bookingRef:         { type: String, default: null },
}, { _id: false });

const busSchema = new mongoose.Schema({
  busOperator:    { type: String, default: null },
  departure:      { type: String, default: null },
  arrival:        { type: String, default: null },
  date:           { type: String, default: null },
  departureTime:  { type: String, default: null },
  seatNumber:     { type: String, default: null },
  bookingRef:     { type: String, default: null },
}, { _id: false });

const extractedDataSchema = new mongoose.Schema({
  documentType: {
    type: String,
    enum: ['flight', 'hotel', 'train', 'bus', 'other'],
    required: true,
  },
  rawText:   { type: String, default: '' },
  fileName:  { type: String, default: null },
  fileType:  { type: String, default: null },
  flight:    { type: flightSchema,  default: null },
  hotel:     { type: hotelSchema,   default: null },
  train:     { type: trainSchema,   default: null },
  bus:       { type: busSchema,     default: null },
}, { _id: false });

// ── Itinerary day sub-schema ──────────────────────────────────────────────────
const itineraryDaySchema = new mongoose.Schema({
  day:          { type: Number, required: true },
  date:         { type: String, default: null },
  title:        { type: String, default: null },
  description:  { type: String, default: null },
  activities:   [{ type: String }],
  meals:        [{ type: String }],
  transport:    [{ type: String }],
  accommodation:{ type: String, default: null },
  tips:         [{ type: String }],
}, { _id: false });

// ── Main schema ───────────────────────────────────────────────────────────────
const itinerarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    extractedData: {
      type: [extractedDataSchema],
      default: [],
    },
    generatedItinerary: {
      tripTitle:       { type: String, default: null },
      destination:     { type: String, default: null },
      startDate:       { type: String, default: null },
      endDate:         { type: String, default: null },
      duration:        { type: Number, default: null },
      summary:         { type: String, default: null },
      itineraryDays:   { type: [itineraryDaySchema], default: [] },
      recommendations: [{ type: String }],
      reminders:       [{ type: String }],
      packingSuggestions: [{ type: String }],
      accommodationDetails: { type: String, default: null },
      transportationDetails: { type: String, default: null },
      estimatedBudget: { type: String, default: null },
      weatherInfo:     { type: String, default: null },
    },
    shareId: {
      type: String,
      unique: true,
      default: () => uuidv4(),
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    title: {
      type: String,
      default: null,
    },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ── Virtuals ──────────────────────────────────────────────────────────────────
itinerarySchema.virtual('shareUrl').get(function () {
  return `/share/${this.shareId}`;
});

// ── Compound index for user's trips sorted by date ────────────────────────────
itinerarySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Itinerary', itinerarySchema);
