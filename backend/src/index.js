import express from 'express';
import cors from 'cors';
import { initDB } from './db.js';
import authRoutes from './auth.js';
import textsRoutes from './texts.js';
import collectionsRoutes from './collections.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/texts', textsRoutes);
app.use('/api/collections', collectionsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

await initDB();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Luciano's Scribe API running on port ${PORT}`);
});
