
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Copy, Loader2, BookOpen, Plus, X, ChevronDown } from 'lucide-react';
import { getApiConfig, getToken } from '../services/storageService';
import { searchBibleVerse } from '../services/aiService';

interface VersePanel {
  id: string;
  query: string;
  version: string;
  loading: boolean;
  result: string | null;
  error: string | null;
}

const VERSION_OPTIONS = [
  { value: 'ACF', label: 'ACF - Almeida Corrigida Fiel' },
  { value: 'ARA', label: 'ARA - Almeida Revista e Atualizada' },
  { value: 'NVI', label: 'NVI - Nova Versão Internacional' },
  { value: 'NTLH', label: 'NTLH - Nova Tradução na Linguagem de Hoje' },
  { value: 'KJA', label: 'KJA - King James Atualizada' },
  { value: 'KJF', label: 'KJF - King James Fiel' },
  { value: 'NAA', label: 'NAA - Nova Almeida Atualizada' },
  { value: 'A Mensagem', label: 'A Mensagem - The Message' },
];

const BOOK_NAME_TO_ID: Record<string, number> = {
  'genesis': 1, 'gênesis': 1, 'gn': 1,
  'exodo': 2, 'êxodo': 2, 'ex': 2,
  'levitico': 3, 'levítico': 3, 'lv': 3,
  'numeros': 4, 'números': 4, 'nm': 4,
  'deuteronomio': 5, 'deuteronômio': 5, 'dt': 5,
  'josue': 6, 'josué': 6, 'js': 6,
  'juizes': 7, 'juízes': 7, 'jz': 7,
  'rute': 8, 'rt': 8,
  '1 samuel': 9, '1sm': 9,
  '2 samuel': 10, '2sm': 10,
  '1 reis': 11, '1rs': 11,
  '2 reis': 12, '2rs': 12,
  '1 cronicas': 13, '1 crônicas': 13, '1cr': 13,
  '2 cronicas': 14, '2 crônicas': 14, '2cr': 14,
  'esdras': 15, 'ed': 15,
  'neemias': 16, 'ne': 16,
  'ester': 17, 'et': 17,
  'jó': 18,
  'salmos': 19, 'sl': 19,
  'proverbios': 20, 'provérbios': 20, 'pv': 20,
  'eclesiastes': 21, 'ec': 21,
  'cantares': 22, 'ct': 22,
  'isaias': 23, 'isaías': 23, 'is': 23,
  'jeremias': 24, 'jr': 24,
  'lamentacoes': 25, 'lamentações': 25, 'lm': 25,
  'ezequiel': 26, 'ez': 26,
  'daniel': 27, 'dn': 27,
  'oseias': 28, 'oséias': 28, 'os': 28,
  'joel': 29, 'jl': 29,
  'amos': 30, 'amós': 30, 'am': 30,
  'obadias': 31, 'ob': 31,
  'jonas': 32, 'jn': 32,
  'miqueias': 33, 'miquéias': 33, 'mq': 33,
  'naum': 34, 'na': 34,
  'habacuque': 35, 'hc': 35,
  'sofonias': 36, 'sf': 36,
  'ageu': 37, 'ag': 37,
  'zacarias': 38, 'zc': 38,
  'malaquias': 39, 'ml': 39,
  'mateus': 40, 'mt': 40,
  'marcos': 41, 'mc': 41,
  'lucas': 42, 'lc': 42,
  'joao': 43, 'joão': 43, 'jo': 43,
  'atos': 44, 'at': 44,
  'romanos': 45, 'rm': 45,
  '1 corintios': 46, '1 coríntios': 46, '1co': 46,
  '2 corintios': 47, '2 coríntios': 47, '2co': 47,
  'galatas': 48, 'gálatas': 48, 'gl': 48,
  'efesios': 49, 'efésios': 49, 'ef': 49,
  'filipenses': 50, 'fp': 50,
  'colossenses': 51, 'cl': 51,
  '1 tessalonicenses': 52, '1ts': 52,
  '2 tessalonicenses': 53, '2ts': 53,
  '1 timoteo': 54, '1 timóteo': 54, '1tm': 54,
  '2 timoteo': 55, '2 timóteo': 55, '2tm': 55,
  'tito': 56, 'tt': 56,
  'filemom': 57, 'fm': 57,
  'hebreus': 58, 'hb': 58,
  'tiago': 59, 'tg': 59,
  '1 pedro': 60, '1pe': 60,
  '2 pedro': 61, '2pe': 61,
  '1 joao': 62, '1 joão': 62, '1jo': 62,
  '2 joao': 63, '2 joão': 63, '2jo': 63,
  '3 joao': 64, '3 joão': 64, '3jo': 64,
  'judas': 65, 'jd': 65,
  'apocalipse': 66, 'ap': 66,
};

const resolveBookId = (input: string): number | null => {
  const trimmed = input.trim().toLowerCase();
  if (BOOK_NAME_TO_ID[trimmed] !== undefined) return BOOK_NAME_TO_ID[trimmed];
  const normalized = trimmed.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return BOOK_NAME_TO_ID[normalized] ?? null;
};

const parseReference = (q: string): { bookId: number; chapter: number; verse?: number } | null => {
  const trimmed = q.trim();
  let match = trimmed.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (match) {
    const bookId = resolveBookId(match[1]);
    if (!bookId) return null;
    return { bookId, chapter: parseInt(match[2]), verse: parseInt(match[3]) };
  }
  match = trimmed.match(/^(.+?)\s+(\d+)$/);
  if (match) {
    const bookId = resolveBookId(match[1]);
    if (!bookId) return null;
    return { bookId, chapter: parseInt(match[2]) };
  }
  return null;
};

export const BibleSidebar: React.FC = () => {
  const [panels, setPanels] = useState<VersePanel[]>([
    { id: '1', query: '', version: 'ARA', loading: false, result: null, error: null }
  ]);

  const addPanel = () => {
    const id = Date.now().toString();
    setPanels(prev => [...prev, { id, query: '', version: 'ARA', loading: false, result: null, error: null }]);
  };

  const removePanel = (id: string) => {
    setPanels(prev => prev.filter(p => p.id !== id));
  };

  const updatePanel = (id: string, updates: Partial<VersePanel>) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const BOOK_ABBREVIATIONS: Record<number, string> = {
    1: 'Gn', 2: 'Ex', 3: 'Lv', 4: 'Nm', 5: 'Dt', 6: 'Js', 7: 'Jz', 8: 'Rt',
    9: '1Sm', 10: '2Sm', 11: '1Rs', 12: '2Rs', 13: '1Cr', 14: '2Cr',
    15: 'Ed', 16: 'Ne', 17: 'Et', 18: 'Jó', 19: 'Sl', 20: 'Pv', 21: 'Ec',
    22: 'Ct', 23: 'Is', 24: 'Jr', 25: 'Lm', 26: 'Ez', 27: 'Dn', 28: 'Os',
    29: 'Jl', 30: 'Am', 31: 'Ob', 32: 'Jn', 33: 'Mq', 34: 'Na', 35: 'Hc',
    36: 'Sf', 37: 'Ag', 38: 'Zc', 39: 'Ml', 40: 'Mt', 41: 'Mc', 42: 'Lc',
    43: 'Jo', 44: 'At', 45: 'Rm', 46: '1Co', 47: '2Co', 48: 'Gl', 49: 'Ef',
    50: 'Fp', 51: 'Cl', 52: '1Ts', 53: '2Ts', 54: '1Tm', 55: '2Tm', 56: 'Tt',
    57: 'Fm', 58: 'Hb', 59: 'Tg', 60: '1Pe', 61: '2Pe', 62: '1Jo', 63: '2Jo',
    64: '3Jo', 65: 'Jd', 66: 'Ap',
  };

  const fetchVerse = useCallback(async (panel: VersePanel) => {
    if (!panel.query.trim()) return;
    updatePanel(panel.id, { loading: true, result: null, error: null });

    try {
      const parsed = parseReference(panel.query);
      if (parsed) {
        const config = getApiConfig();
        const token = getToken();
        const url = `${config.url.replace(/\/$/, '')}/api/bible/verses?book=${parsed.bookId}&chapter=${parsed.chapter}&version=${panel.version}`;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(url, { headers });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const abbrev = BOOK_ABBREVIATIONS[parsed.bookId] || `Livro ${parsed.bookId}`;
            if (parsed.verse) {
              const v = data.find((x: any) => x.verse === parsed.verse);
              if (v) {
                updatePanel(panel.id, {
                  result: `<p><strong>${abbrev} ${parsed.chapter}:${parsed.verse}</strong> (${panel.version})</p><p>${v.text}</p>`,
                  loading: false
                });
                return;
              }
            } else {
              updatePanel(panel.id, {
                result: `<p><strong>${abbrev} ${parsed.chapter}</strong> (${panel.version})</p><p>${data.map((v: any) => `<sup>${v.verse}</sup> ${v.text}`).join(' ')}</p>`,
                loading: false
              });
              return;
            }
          }
        }
      }

      const text = await searchBibleVerse(panel.query, panel.version);
      updatePanel(panel.id, { result: text, loading: false, error: text ? null : 'Versículo não encontrado.' });
    } catch (err) {
      updatePanel(panel.id, { error: 'Erro ao buscar o versículo.', loading: false });
    }
  }, []);

  const copyToClipboard = (result: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = result;
    const text = tempDiv.innerText;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900 border-l border-[#DEE3EA] dark:border-slate-800">
      <div className="p-4 border-b border-[#DEE3EA] dark:border-slate-800 bg-[#FDEEE3] dark:bg-slate-800">
        <h3 className="font-display font-semibold text-[#B8431A] dark:text-amber-400 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Bíblia Integrada
        </h3>
      </div>

      <div className="p-3 flex-1 overflow-y-auto space-y-3">
        {panels.map(panel => (
          <div key={panel.id} className="bg-[#F8FAFD] dark:bg-slate-800/50 rounded-md border border-[#DEE3EA] dark:border-slate-700 p-3">
            <div className="flex items-center gap-2 mb-2">
              <select value={panel.version} onChange={e => updatePanel(panel.id, { version: e.target.value })}
                className="flex-1 p-1.5 border border-[#DEE3EA] dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none">
                {VERSION_OPTIONS.map(v => <option key={v.value} value={v.value}>{v.value}</option>)}
              </select>
              {panels.length > 1 && (
                <button onClick={() => removePanel(panel.id)} className="text-slate-400 hover:text-red-500 p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex gap-1">
              <input type="text" value={panel.query} onChange={e => updatePanel(panel.id, { query: e.target.value })}
                placeholder="Ex: João 3:16" onKeyDown={e => e.key === 'Enter' && fetchVerse(panel)}
                className="flex-1 p-1.5 text-xs border border-[#DEE3EA] dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none" />
              <button onClick={() => fetchVerse(panel)} disabled={panel.loading}
                className="p-1.5 bg-[#3B6FE0] text-white rounded hover:bg-[#2C5AC7] disabled:opacity-50">
                {panel.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              </button>
            </div>

            {panel.result && (
              <div className="mt-2 relative group bg-[#FDEEE3] dark:bg-slate-800 border border-[#F6D4B8] dark:border-slate-700 p-3 rounded-md">
                <button onClick={() => copyToClipboard(panel.result!)}
                  className="absolute top-1 right-1 p-1 text-[#B8431A] dark:text-amber-400 hover:bg-[#F6D4B8] dark:hover:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copiar">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <div className="serif-font prose prose-xs text-slate-800 dark:text-slate-300 text-sm" dangerouslySetInnerHTML={{ __html: panel.result }} />
              </div>
            )}

            {panel.error && (
              <p className="mt-2 text-xs text-red-500">{panel.error}</p>
            )}
          </div>
        ))}

        <button onClick={addPanel}
          className="w-full py-2 border-2 border-dashed border-[#DEE3EA] dark:border-slate-600 rounded-md text-sm text-slate-500 hover:text-[#3B6FE0] hover:border-[#3B6FE0] transition-colors flex items-center justify-center gap-1">
          <Plus className="w-4 h-4" /> Adicionar Versão
        </button>
      </div>
    </div>
  );
};

export default BibleSidebar;