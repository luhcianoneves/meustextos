import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB } from './db.js';
import authRoutes from './auth.js';
import textsRoutes from './texts.js';
import collectionsRoutes from './collections.js';
import uploadsRoutes from './uploads.js';
import bibleRoutes from './bible.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/texts', textsRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/upload', uploadsRoutes);
app.use('/api/bible', bibleRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

try {
  await initDB();
  console.log('Database initialized successfully');
} catch (err) {
  console.error('Failed to initialize database:', err.message);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Luciano Scribe API running on port ${PORT}`);
});
