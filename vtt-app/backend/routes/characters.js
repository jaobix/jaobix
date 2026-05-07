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
  db.get('SELECT * FROM characters WHERE campaign_id = ? AND user_id = ? LIMIT 1',
  [req.params.campaignId, req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Character not found in this campaign' });
    res.json(row);
  });
});

router.get('/:id', authenticate, (req, res) => {
  db.get('SELECT * FROM characters WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Character not found' });

    // Parse JSON fields
    ['attributes', 'skills', 'combat', 'equipment', 'roleplay', 'spells'].forEach(field => {
      if (row[field]) {
        try { row[field] = JSON.parse(row[field]); } catch(e) { /* ignore */ }
      }
    });

    res.json(row);
  });
});

router.put('/:id', authenticate, (req, res) => {
  const id = req.params.id;
  const {
    name, class: charClass, level, background, race, alignment, xp,
    attributes, skills, combat, equipment, roleplay, spells
  } = req.body;

  db.run(`
    UPDATE characters SET
      name = ?, class = ?, level = ?, background = ?, race = ?, alignment = ?, xp = ?,
      attributes = ?, skills = ?, combat = ?, equipment = ?, roleplay = ?, spells = ?
    WHERE id = ? AND user_id = ?
  `, [
    name, charClass, level, background, race, alignment, xp,
    JSON.stringify(attributes), JSON.stringify(skills), JSON.stringify(combat),
    JSON.stringify(equipment), JSON.stringify(roleplay), JSON.stringify(spells),
    id, req.user.id
  ], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, updated: this.changes });
  });
});

module.exports = router;
