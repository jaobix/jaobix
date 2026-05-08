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

router.post('/', authenticate, (req, res) => {
  if (req.user.role !== 'dm') return res.status(403).json({ error: 'Only DMs can create campaigns' });

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Campaign name required' });

  db.run('INSERT INTO campaigns (name, dm_id) VALUES (?, ?)', [name, req.user.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const campaignId = this.lastID;

    // Also create a default map for this campaign
    db.run('INSERT INTO maps (campaign_id, name) VALUES (?, ?)', [campaignId, 'Default Map'], function(err) {
       res.status(201).json({ id: campaignId, name, dm_id: req.user.id });
    });
  });
});

router.get('/', authenticate, (req, res) => {
  if (req.user.role === 'dm') {
    db.all('SELECT * FROM campaigns WHERE dm_id = ?', [req.user.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } else {
    db.all(`
      SELECT c.* FROM campaigns c
      JOIN characters ch ON c.id = ch.campaign_id
      WHERE ch.user_id = ?
    `, [req.user.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  }
});

router.post('/:id/join', authenticate, (req, res) => {
  const campaignId = req.params.id;
  db.run('INSERT INTO characters (user_id, campaign_id, name) VALUES (?, ?, ?)',
    [req.user.id, campaignId, `New Character (${req.user.username})`],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Joined campaign', characterId: this.lastID });
  });
});

module.exports = router;
