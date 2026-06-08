
import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, BookOpen } from 'lucide-react';
import { getApiConfig, getToken } from '../services/storageService';

interface BibleBook {
  id: number; name: string; abbreviation: string; testament: string; chapters: number;
}

interface Verse {
  id: number; book_id: number; chapter: number; verse: number; text: string; version: string;
}

interface BibleSelectorProps {
  onSelect: (reference: string, text: string, version: string) => void;
  onClose: () => void;
}

const BOOKS: BibleBook[] = [
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

const VERSIONS = ['ACF', 'ARA', 'NVI', 'NTLH', 'KJV'];

const BibleSelector: React.FC<BibleSelectorProps> = ({ onSelect, onClose }) => {
  const [selectedBook, setSelectedBook] = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [selectedVersion, setSelectedVersion] = useState('ARA');
  const [searchQuery, setSearchQuery] = useState('');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);

  const filteredBooks = BOOKS.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const book = selectedBook ? BOOKS.find(b => b.id === selectedBook) : null;
  const chapters = book ? Array.from({ length: book.chapters }, (_, i) => i + 1) : [];

  const fetchVerses = async () => {
    if (!selectedBook || !selectedChapter) return;
    setLoading(true);
    try {
      const config = getApiConfig();
      const token = getToken();
      const url = `${config.url.replace(/\/$/, '')}/api/bible/verses?book=${selectedBook}&chapter=${selectedChapter}&version=${selectedVersion}`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      setVerses(Array.isArray(data) ? data : []);
    } catch {
      setVerses([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedBook && selectedChapter) fetchVerses();
  }, [selectedBook, selectedChapter, selectedVersion]);

  const handleInsert = () => {
    if (!book || !selectedChapter) return;
    if (selectedVerse && verses.length > 0) {
      const v = verses.find(v => v.verse === selectedVerse);
      if (v) {
        onSelect(`${book.abbreviation} ${selectedChapter}:${selectedVerse} (${selectedVersion})`, v.text, selectedVersion);
        return;
      }
    }
    onSelect(`${book.abbreviation} ${selectedChapter} (${selectedVersion})`, verses.map(v => v.text).join(' '), selectedVersion);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" /> Inserir Citação Bíblica
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input type="text" placeholder="Buscar livro..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Livro</label>
              <select value={selectedBook || ''} onChange={e => { setSelectedBook(Number(e.target.value)); setSelectedChapter(null); setSelectedVerse(null); setVerses([]); }}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                size={8}>
                {filteredBooks.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.abbreviation})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Capítulo</label>
              <select value={selectedChapter || ''} onChange={e => { setSelectedChapter(Number(e.target.value)); setSelectedVerse(null); }}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                size={8}>
                {chapters.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Versículo</label>
              <select value={selectedVerse || ''} onChange={e => setSelectedVerse(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                size={8}>
                <option value="">Todos</option>
                {verses.map(v => (
                  <option key={v.id || v.verse} value={v.verse}>{v.verse}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <label className="text-xs font-semibold text-slate-500 mr-2">Versão:</label>
            {VERSIONS.map(v => (
              <button key={v} onClick={() => setSelectedVersion(v)}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${selectedVersion === v ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}>
                {v}
              </button>
            ))}
          </div>

          {loading && <div className="flex items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin"/> Carregando...</div>}

          {verses.length > 0 && (
            <div className="max-h-40 overflow-y-auto bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              {verses.map(v => (
                <div key={v.verse}
                  onClick={() => setSelectedVerse(v.verse)}
                  className={`p-2 rounded cursor-pointer text-sm ${selectedVerse === v.verse ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  <strong className="text-indigo-600 dark:text-indigo-400">{v.verse}</strong> {v.text}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
          <button onClick={handleInsert} disabled={!book || !selectedChapter}
            className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Inserir Citação
          </button>
        </div>
      </div>
    </div>
  );
};

export default BibleSelector;
