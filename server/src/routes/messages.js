const express = require('express');
const Order = require('../models/Order');
const Message = require('../models/Message');
const { authRequired, loadUser } = require('../middleware/auth');

const router = express.Router();

router.use(authRequired, loadUser);

// Loads the order and ensures the caller is its owner or an admin.
async function loadOrderWithAccess(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return null;
  }
  if (req.user.role !== 'admin' && order.client.toString() !== req.userId) {
    res.status(404).json({ error: 'Order not found' });
    return null;
  }
  return order;
}

// GET /api/orders/:id/messages — the message thread for an order.
router.get('/:id/messages', async (req, res, next) => {
  try {
    const order = await loadOrderWithAccess(req, res);
    if (!order) return undefined;
    const messages = await Message.find({ order: order._id })
      .populate('author', 'name role')
      .sort({ createdAt: 1 });
    return res.json({ messages });
  } catch (err) {
    return next(err);
  }
});

// POST /api/orders/:id/messages — post to the thread as the signed-in user.
router.post('/:id/messages', async (req, res, next) => {
  try {
    const order = await loadOrderWithAccess(req, res);
    if (!order) return undefined;

    const { text } = req.body || {};
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    if (text.trim().length > 2000) {
      return res.status(400).json({ error: 'Message must be under 2000 characters' });
    }

    const message = await Message.create({
      order: order._id,
      author: req.userId,
      text: text.trim(),
    });
    await message.populate('author', 'name role');
    return res.status(201).json({ message });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
