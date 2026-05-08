const express = require('express');
const router = express.Router();
const db = require('../db/database');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const jwt = require('jsonwebtoken');
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'supersecretvttkey');
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.get('/campaign/:campaignId', authenticate, (req, res) => {
  db.get('SELECT * FROM maps WHERE campaign_id = ? LIMIT 1', [req.params.campaignId], (err, map) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!map) return res.status(404).json({ error: 'Map not found' });

    db.all('SELECT * FROM tokens WHERE map_id = ?', [map.id], (err, tokens) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ map, tokens });
    });
  });
});

module.exports = router;
