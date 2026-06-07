import { Router } from 'express';
import pool from './db.js';
import { authenticate } from './middleware.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM texts WHERE user_id = $1 ORDER BY "savedAt" DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Texts list error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const entry = req.body;
    const result = await pool.query(
      `INSERT INTO texts (id, user_id, "originalTitle", "originalBody", "correctedTitle", "correctedBody",
        summary, tags, "bibleCitations", versions, "creationDate", "savedAt", "isFavorite", "collectionId")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        "originalTitle" = EXCLUDED."originalTitle",
        "originalBody" = EXCLUDED."originalBody",
        "correctedTitle" = EXCLUDED."correctedTitle",
        "correctedBody" = EXCLUDED."correctedBody",
        summary = EXCLUDED.summary,
        tags = EXCLUDED.tags,
        "bibleCitations" = EXCLUDED."bibleCitations",
        versions = EXCLUDED.versions,
        "creationDate" = EXCLUDED."creationDate",
        "savedAt" = EXCLUDED."savedAt",
        "isFavorite" = EXCLUDED."isFavorite",
        "collectionId" = EXCLUDED."collectionId"
      RETURNING *`,
      [
        entry.id, req.user.id,
        entry.originalTitle || null,
        entry.originalBody || null,
        entry.correctedTitle || null,
        entry.correctedBody || null,
        entry.summary || null,
        JSON.stringify(entry.tags || []),
        JSON.stringify(entry.bibleCitations || []),
        JSON.stringify(entry.versions || []),
        entry.creationDate || null,
        entry.savedAt || Date.now(),
        entry.isFavorite || false,
        entry.collectionId || null,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Texts save error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/sync', authenticate, async (req, res) => {
  try {
    const { texts } = req.body;
    if (!Array.isArray(texts)) {
      return res.status(400).json({ error: 'Invalid payload.' });
    }

    const results = [];
    for (const entry of texts) {
      const result = await pool.query(
        `INSERT INTO texts (id, user_id, "originalTitle", "originalBody", "correctedTitle", "correctedBody",
          summary, tags, "bibleCitations", versions, "creationDate", "savedAt", "isFavorite", "collectionId")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET
          "originalTitle" = EXCLUDED."originalTitle",
          "originalBody" = EXCLUDED."originalBody",
          "correctedTitle" = EXCLUDED."correctedTitle",
          "correctedBody" = EXCLUDED."correctedBody",
          summary = EXCLUDED.summary,
          tags = EXCLUDED.tags,
          "bibleCitations" = EXCLUDED."bibleCitations",
          versions = EXCLUDED.versions,
          "creationDate" = EXCLUDED."creationDate",
          "savedAt" = EXCLUDED."savedAt",
          "isFavorite" = EXCLUDED."isFavorite",
          "collectionId" = EXCLUDED."collectionId"
        RETURNING *`,
        [
          entry.id, req.user.id,
          entry.originalTitle || null,
          entry.originalBody || null,
          entry.correctedTitle || null,
          entry.correctedBody || null,
          entry.summary || null,
          JSON.stringify(entry.tags || []),
          JSON.stringify(entry.bibleCitations || []),
          JSON.stringify(entry.versions || []),
          entry.creationDate || null,
          entry.savedAt || Date.now(),
          entry.isFavorite || false,
          entry.collectionId || null,
        ]
      );
      results.push(result.rows[0]);
    }

    res.json({ synced: results.length });
  } catch (err) {
    console.error('Texts sync error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM texts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ deleted: true });
  } catch (err) {
    console.error('Texts delete error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
