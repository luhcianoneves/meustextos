import { Router } from 'express';
import pool from './db.js';
import { authenticate } from './middleware.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM collections WHERE user_id = $1 ORDER BY name',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Collections list error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { id, name, description, color } = req.body;
    const result = await pool.query(
      `INSERT INTO collections (id, user_id, name, description, color)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        color = EXCLUDED.color
      RETURNING *`,
      [id, req.user.id, name, description || null, color || 'indigo']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Collections save error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM collections WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ deleted: true });
  } catch (err) {
    console.error('Collections delete error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
