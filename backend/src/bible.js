import { Router } from 'express';
import pool from './db.js';
import { authenticate } from './middleware.js';

const router = Router();

const BOOKS = [
  { id: 1, name: 'Gênesis', abbreviation: 'Gn', testament: 'VT', chapters: 50 },
  { id: 2, name: 'Êxodo', abbreviation: 'Ex', testament: 'VT', chapters: 40 },
  { id: 3, name: 'Levítico', abbreviation: 'Lv', testament: 'VT', chapters: 27 },
  { id: 4, name: 'Números', abbreviation: 'Nm', testament: 'VT', chapters: 36 },
  { id: 5, name: 'Deuteronômio', abbreviation: 'Dt', testament: 'VT', chapters: 34 },
  { id: 6, name: 'Josué', abbreviation: 'Js', testament: 'VT', chapters: 24 },
  { id: 7, name: 'Juízes', abbreviation: 'Jz', testament: 'VT', chapters: 21 },
  { id: 8, name: 'Rute', abbreviation: 'Rt', testament: 'VT', chapters: 4 },
  { id: 9, name: '1 Samuel', abbreviation: '1Sm', testament: 'VT', chapters: 31 },
  { id: 10, name: '2 Samuel', abbreviation: '2Sm', testament: 'VT', chapters: 24 },
  { id: 11, name: '1 Reis', abbreviation: '1Rs', testament: 'VT', chapters: 22 },
  { id: 12, name: '2 Reis', abbreviation: '2Rs', testament: 'VT', chapters: 25 },
  { id: 13, name: '1 Crônicas', abbreviation: '1Cr', testament: 'VT', chapters: 29 },
  { id: 14, name: '2 Crônicas', abbreviation: '2Cr', testament: 'VT', chapters: 36 },
  { id: 15, name: 'Esdras', abbreviation: 'Ed', testament: 'VT', chapters: 10 },
  { id: 16, name: 'Neemias', abbreviation: 'Ne', testament: 'VT', chapters: 13 },
  { id: 17, name: 'Ester', abbreviation: 'Et', testament: 'VT', chapters: 10 },
  { id: 18, name: 'Jó', abbreviation: 'Jó', testament: 'VT', chapters: 42 },
  { id: 19, name: 'Salmos', abbreviation: 'Sl', testament: 'VT', chapters: 150 },
  { id: 20, name: 'Provérbios', abbreviation: 'Pv', testament: 'VT', chapters: 31 },
  { id: 21, name: 'Eclesiastes', abbreviation: 'Ec', testament: 'VT', chapters: 12 },
  { id: 22, name: 'Cantares', abbreviation: 'Ct', testament: 'VT', chapters: 8 },
  { id: 23, name: 'Isaías', abbreviation: 'Is', testament: 'VT', chapters: 66 },
  { id: 24, name: 'Jeremias', abbreviation: 'Jr', testament: 'VT', chapters: 52 },
  { id: 25, name: 'Lamentações', abbreviation: 'Lm', testament: 'VT', chapters: 5 },
  { id: 26, name: 'Ezequiel', abbreviation: 'Ez', testament: 'VT', chapters: 48 },
  { id: 27, name: 'Daniel', abbreviation: 'Dn', testament: 'VT', chapters: 12 },
  { id: 28, name: 'Oséias', abbreviation: 'Os', testament: 'VT', chapters: 14 },
  { id: 29, name: 'Joel', abbreviation: 'Jl', testament: 'VT', chapters: 3 },
  { id: 30, name: 'Amós', abbreviation: 'Am', testament: 'VT', chapters: 9 },
  { id: 31, name: 'Obadias', abbreviation: 'Ob', testament: 'VT', chapters: 1 },
  { id: 32, name: 'Jonas', abbreviation: 'Jn', testament: 'VT', chapters: 4 },
  { id: 33, name: 'Miquéias', abbreviation: 'Mq', testament: 'VT', chapters: 7 },
  { id: 34, name: 'Naum', abbreviation: 'Na', testament: 'VT', chapters: 3 },
  { id: 35, name: 'Habacuque', abbreviation: 'Hc', testament: 'VT', chapters: 3 },
  { id: 36, name: 'Sofonias', abbreviation: 'Sf', testament: 'VT', chapters: 3 },
  { id: 37, name: 'Ageu', abbreviation: 'Ag', testament: 'VT', chapters: 2 },
  { id: 38, name: 'Zacarias', abbreviation: 'Zc', testament: 'VT', chapters: 14 },
  { id: 39, name: 'Malaquias', abbreviation: 'Ml', testament: 'VT', chapters: 4 },
  { id: 40, name: 'Mateus', abbreviation: 'Mt', testament: 'NT', chapters: 28 },
  { id: 41, name: 'Marcos', abbreviation: 'Mc', testament: 'NT', chapters: 16 },
  { id: 42, name: 'Lucas', abbreviation: 'Lc', testament: 'NT', chapters: 24 },
  { id: 43, name: 'João', abbreviation: 'Jo', testament: 'NT', chapters: 21 },
  { id: 44, name: 'Atos', abbreviation: 'At', testament: 'NT', chapters: 28 },
  { id: 45, name: 'Romanos', abbreviation: 'Rm', testament: 'NT', chapters: 16 },
  { id: 46, name: '1 Coríntios', abbreviation: '1Co', testament: 'NT', chapters: 16 },
  { id: 47, name: '2 Coríntios', abbreviation: '2Co', testament: 'NT', chapters: 13 },
  { id: 48, name: 'Gálatas', abbreviation: 'Gl', testament: 'NT', chapters: 6 },
  { id: 49, name: 'Efésios', abbreviation: 'Ef', testament: 'NT', chapters: 6 },
  { id: 50, name: 'Filipenses', abbreviation: 'Fp', testament: 'NT', chapters: 4 },
  { id: 51, name: 'Colossenses', abbreviation: 'Cl', testament: 'NT', chapters: 4 },
  { id: 52, name: '1 Tessalonicenses', abbreviation: '1Ts', testament: 'NT', chapters: 5 },
  { id: 53, name: '2 Tessalonicenses', abbreviation: '2Ts', testament: 'NT', chapters: 3 },
  { id: 54, name: '1 Timóteo', abbreviation: '1Tm', testament: 'NT', chapters: 6 },
  { id: 55, name: '2 Timóteo', abbreviation: '2Tm', testament: 'NT', chapters: 4 },
  { id: 56, name: 'Tito', abbreviation: 'Tt', testament: 'NT', chapters: 3 },
  { id: 57, name: 'Filemom', abbreviation: 'Fm', testament: 'NT', chapters: 1 },
  { id: 58, name: 'Hebreus', abbreviation: 'Hb', testament: 'NT', chapters: 13 },
  { id: 59, name: 'Tiago', abbreviation: 'Tg', testament: 'NT', chapters: 5 },
  { id: 60, name: '1 Pedro', abbreviation: '1Pe', testament: 'NT', chapters: 5 },
  { id: 61, name: '2 Pedro', abbreviation: '2Pe', testament: 'NT', chapters: 3 },
  { id: 62, name: '1 João', abbreviation: '1Jo', testament: 'NT', chapters: 5 },
  { id: 63, name: '2 João', abbreviation: '2Jo', testament: 'NT', chapters: 1 },
  { id: 64, name: '3 João', abbreviation: '3Jo', testament: 'NT', chapters: 1 },
  { id: 65, name: 'Judas', abbreviation: 'Jd', testament: 'NT', chapters: 1 },
  { id: 66, name: 'Apocalipse', abbreviation: 'Ap', testament: 'NT', chapters: 22 },
];

router.get('/books', authenticate, (req, res) => {
  res.json(BOOKS);
});

router.get('/verses', authenticate, async (req, res) => {
  const { book, chapter, verse, version } = req.query;
  if (!book || !chapter) return res.status(400).json({ error: 'book and chapter required' });

  try {
    let query, params;
    if (verse) {
      query = 'SELECT * FROM bible_verses WHERE book_id = $1 AND chapter = $2 AND verse = $3 AND version = $4 ORDER BY verse';
      params = [book, chapter, verse, version || 'ARA'];
    } else {
      query = 'SELECT * FROM bible_verses WHERE book_id = $1 AND chapter = $2 AND version = $3 ORDER BY verse';
      params = [book, chapter, version || 'ARA'];
    }
    const result = await pool.query(query, params);
    if (result.rows.length > 0) {
      return res.json(result.rows);
    }
  } catch (e) {
  }

  res.json([]);
});

export { BOOKS };
export default router;
