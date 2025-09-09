const express = require('express');
const router = express.Router();
const messages = require('../models/partyMessage');
const { authenticateToken } = require('../auth');
const { getIo } = require('../socket');

router.use(authenticateToken);

router.post('/', async (req, res) => {
  try {
    const msg = await messages.create({
      party_id: req.body.party_id,
      user_id: req.user.userId,
      message: req.body.message
    });
    getIo().emit('partyMessage', msg);
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: 'failed to create party message' });
  }
});

module.exports = router;
