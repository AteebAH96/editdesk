const express = require('express');
const Order = require('../models/Order');
const { ORDER_TYPES, ORDER_STATUSES, ALLOWED_TRANSITIONS } = require('../models/Order');
const { authRequired, loadUser, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authRequired, loadUser);

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') &&
      !url.username && !url.password && value.length <= 2048;
  } catch {
    return false;
  }
}

// Accept reference links as an array or a newline/comma-separated string.
function normalizeLinks(input) {
  if (!input) return [];
  const raw = Array.isArray(input) ? input : String(input).split(/[\n,]+/);
  return raw.map((s) => s.trim()).filter(Boolean);
}

function orderAccessFilter(req) {
  // Admins see everything; clients see only their own orders.
  return req.user.role === 'admin' ? {} : { client: req.userId };
}

// GET /api/orders — list orders. Admins may filter with ?status=...
router.get('/', async (req, res, next) => {
  try {
    const filter = orderAccessFilter(req);
    if (req.user.role === 'admin' && req.query.status) {
      if (!ORDER_STATUSES.includes(req.query.status)) {
        return res.status(400).json({ error: 'Invalid status filter' });
      }
      filter.status = req.query.status;
    }
    const orders = await Order.find(filter)
      .populate('client', 'name email')
      .sort({ createdAt: -1 });
    return res.json({ orders });
  } catch (err) {
    return next(err);
  }
});

// POST /api/orders — create an order for the signed-in user.
router.post('/', async (req, res, next) => {
  try {
    const { title, type, description, referenceLinks, deadline } = req.body || {};

    if (typeof title !== 'string' || !title.trim() || title.trim().length > 120) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!ORDER_TYPES.includes(type)) {
      return res.status(400).json({ error: `Type must be one of: ${ORDER_TYPES.join(', ')}` });
    }

    if (description != null && typeof description !== 'string') {
      return res.status(400).json({ error: 'Description must be text' });
    }
    if ((description || '').trim().length > 3000) {
      return res.status(400).json({ error: 'Description must be under 3000 characters' });
    }
    const links = normalizeLinks(referenceLinks);
    if (links.length > 10) return res.status(400).json({ error: 'Use at most 10 reference links' });
    const bad = links.find((l) => !isHttpUrl(l));
    if (bad) {
      return res.status(400).json({ error: `Reference link is not a valid URL: ${bad}` });
    }

    let deadlineDate;
    if (deadline) {
      deadlineDate = new Date(deadline);
      if (Number.isNaN(deadlineDate.getTime())) {
        return res.status(400).json({ error: 'Deadline is not a valid date' });
      }
    }

    const order = await Order.create({
      title: title.trim(),
      type,
      description: (description || '').trim(),
      referenceLinks: links,
      deadline: deadlineDate,
      client: req.userId,
    });
    await order.populate('client', 'name email');
    return res.status(201).json({ order });
  } catch (err) {
    return next(err);
  }
});

async function findOrderFor(req, res) {
  const order = await Order.findById(req.params.id).populate('client', 'name email');
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return null;
  }
  if (req.user.role !== 'admin' && order.client._id.toString() !== req.userId) {
    res.status(404).json({ error: 'Order not found' });
    return null;
  }
  return order;
}

// GET /api/orders/:id — order detail (owner or admin).
router.get('/:id', async (req, res, next) => {
  try {
    const order = await findOrderFor(req, res);
    if (!order) return undefined;
    return res.json({ order });
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/orders/:id/status — admin moves the order through the pipeline.
router.patch('/:id/status', requireRole('admin'), async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${ORDER_STATUSES.join(', ')}` });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const allowed = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return res
        .status(422)
        .json({ error: `Cannot move order from "${order.status}" to "${status}"` });
    }
    order.status = status;
    await order.save();
    await order.populate('client', 'name email');
    return res.json({ order });
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/orders/:id/delivery — admin sets (or clears) the delivery URL.
router.patch('/:id/delivery', requireRole('admin'), async (req, res, next) => {
  try {
    const { deliveryUrl } = req.body || {};
    const trimmed = (deliveryUrl || '').trim();
    if (trimmed && !isHttpUrl(trimmed)) {
      return res.status(400).json({ error: 'Delivery URL must be a valid http(s) URL' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    order.deliveryUrl = trimmed;
    await order.save();
    await order.populate('client', 'name email');
    return res.json({ order });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
