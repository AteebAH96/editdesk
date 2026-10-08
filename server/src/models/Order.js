const mongoose = require('mongoose');

const ORDER_TYPES = ['reel', 'promo', 'cinematic', 'tiktok', 'other'];
const ORDER_STATUSES = ['Pending', 'In Progress', 'In Review', 'Delivered'];

// Allowed status moves. Admins drive orders forward through the pipeline;
// an order in review can be sent back for another editing pass.
const ALLOWED_TRANSITIONS = {
  Pending: ['In Progress'],
  'In Progress': ['In Review'],
  'In Review': ['In Progress', 'Delivered'],
  Delivered: [],
};

const orderSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    type: { type: String, enum: ORDER_TYPES, required: true },
    description: { type: String, trim: true, maxlength: 3000, default: '' },
    referenceLinks: { type: [String], default: [] },
    deadline: { type: Date },
    status: { type: String, enum: ORDER_STATUSES, default: 'Pending' },
    deliveryUrl: { type: String, trim: true, default: '' },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_TYPES = ORDER_TYPES;
module.exports.ORDER_STATUSES = ORDER_STATUSES;
module.exports.ALLOWED_TRANSITIONS = ALLOWED_TRANSITIONS;
