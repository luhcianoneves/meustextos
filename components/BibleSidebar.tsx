
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
  { value: 'NTLH', label: 'NTLH - Nova Tradução na Linguagem de Hoje' },
  { value: 'A Mensagem', label: 'A Mensagem' },
  { value: 'NVI', label: 'NVI - Nova Versão Internacional' },
  { value: 'KJV', label: 'KJV - King James Version' },
];

const parseReference = (q: string): { book: string; chapter: number; verse: number } | null => {
  const match = q.trim().match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!match) return null;
  const bookMap: Record<string, string> = {
    'gn': 'Gênesis', 'ex': 'Êxodo', 'lv': 'Levítico', 'nm': 'Números', 'dt': 'Deuteronômio',
    'js': 'Josué', 'jz': 'Juízes', 'rt': 'Rute', '1sm': '1 Samuel', '2sm': '2 Samuel',
    '1rs': '1 Reis', '2rs': '2 Reis', '1cr': '1 Crônicas', '2cr': '2 Crônicas',
    'ed': 'Esdras', 'ne': 'Neemias', 'et': 'Ester', 'jó': 'Jó', 'sl': 'Salmos',
    'pv': 'Provérbios', 'ec': 'Eclesiastes', 'ct': 'Cantares', 'is': 'Isaías',
    'jr': 'Jeremias', 'lm': 'Lamentações', 'ez': 'Ezequiel', 'dn': 'Daniel',
    'os': 'Oséias', 'jl': 'Joel', 'am': 'Amós', 'ob': 'Obadias', 'jn': 'Jonas',
    'mq': 'Miquéias', 'na': 'Naum', 'hc': 'Habacuque', 'sf': 'Sofonias',
    'ag': 'Ageu', 'zc': 'Zacarias', 'ml': 'Malaquias',
    'mt': 'Mateus', 'mc': 'Marcos', 'lc': 'Lucas', 'jo': 'João',
    'at': 'Atos', 'rm': 'Romanos', '1co': '1 Coríntios', '2co': '2 Coríntios',
    'gl': 'Gálatas', 'ef': 'Efésios', 'fp': 'Filipenses', 'cl': 'Colossenses',
    '1ts': '1 Tessalonicenses', '2ts': '2 Tessalonicenses', '1tm': '1 Timóteo',
    '2tm': '2 Timóteo', 'tt': 'Tito', 'fm': 'Filemom', 'hb': 'Hebreus',
    'tg': 'Tiago', '1pe': '1 Pedro', '2pe': '2 Pedro', '1jo': '1 João',
    '2jo': '2 João', '3jo': '3 João', 'jd': 'Judas', 'ap': 'Apocalipse',
    'genesis': 'Gênesis', 'exodo': 'Êxodo', 'levitico': 'Levítico', 'numeros': 'Números',
    'deuteronomio': 'Deuteronômio', 'josue': 'Josué', 'juizes': 'Juízes', 'rute': 'Rute',
      'samuel': '1 Samuel', 'reis': '1 Reis', 'cronicas': '1 Crônicas',
      'esdras': 'Esdras', 'neemias': 'Neemias', 'ester': 'Ester',
      'salmos': 'Salmos', 'provérbios': 'Provérbios', 'eclesiastes': 'Eclesiastes',
      'cantares': 'Cantares', 'isaias': 'Isaías', 'jeremias': 'Jeremias',
      'lamentações': 'Lamentações', 'ezequiel': 'Ezequiel', 'daniel': 'Daniel',
      'oseias': 'Oséias', 'joel': 'Joel', 'amos': 'Amós', 'obadias': 'Obadias',
      'jonas': 'Jonas', 'miqueias': 'Miquéias', 'naum': 'Naum', 'habacuque': 'Habacuque',
      'sofonias': 'Sofonias', 'ageu': 'Ageu', 'zacarias': 'Zacarias', 'malaquias': 'Malaquias',
      'mateus': 'Mateus', 'marcos': 'Marcos', 'lucas': 'Lucas',
      'atos': 'Atos', 'romanos': 'Romanos', 'coríntios': '1 Coríntios',
      'gálatas': 'Gálatas', 'efésios': 'Efésios', 'filipenses': 'Filipenses',
      'colossenses': 'Colossenses', 'tessalonicenses': '1 Tessalonicenses',
      'timóteo': '1 Timóteo', 'tito': 'Tito', 'filemom': 'Filemom',
      'hebreus': 'Hebreus', 'tiago': 'Tiago', 'pedro': '1 Pedro',
      'judas': 'Judas', 'apocalipse': 'Apocalipse',
  };
  const raw = match[1].trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const book = bookMap[raw] || match[1].trim();
  return { book, chapter: parseInt(match[2]), verse: parseInt(match[3]) };
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

  const fetchVerse = useCallback(async (panel: VersePanel) => {
    if (!panel.query.trim()) return;
    updatePanel(panel.id, { loading: true, result: null, error: null });

    try {
      const parsed = parseReference(panel.query);
      if (parsed) {
        const config = getApiConfig();
        const token = getToken();
        const url = `${config.url.replace(/\/$/, '')}/api/bible/verses?book=${encodeURIComponent(parsed.book)}&chapter=${parsed.chapter}&verse=${parsed.verse}&version=${panel.version}`;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(url, { headers });

        if (res.ok) {
          const data = await res.json();
          if (data && data.text) {
            updatePanel(panel.id, {
              result: `<p><strong>${parsed.book} ${parsed.chapter}:${parsed.verse}</strong> (${panel.version})</p><p>${data.text}</p>`,
              loading: false
            });
            return;
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
    <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-indigo-50 dark:bg-slate-800">
        <h3 className="font-bold text-indigo-800 dark:text-indigo-400 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Bíblia Integrada
        </h3>
      </div>

      <div className="p-3 flex-1 overflow-y-auto space-y-3">
        {panels.map(panel => (
          <div key={panel.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-center gap-2 mb-2">
              <select value={panel.version} onChange={e => updatePanel(panel.id, { version: e.target.value })}
                className="flex-1 p-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none">
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
                className="flex-1 p-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none" />
              <button onClick={() => fetchVerse(panel)} disabled={panel.loading}
                className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">
                {panel.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              </button>
            </div>

            {panel.result && (
              <div className="mt-2 relative group bg-amber-50 dark:bg-slate-800 border border-amber-100 dark:border-slate-700 p-3 rounded-lg">
                <button onClick={() => copyToClipboard(panel.result!)}
                  className="absolute top-1 right-1 p-1 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copiar">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <div className="prose prose-xs text-slate-800 dark:text-slate-300 text-sm" dangerouslySetInnerHTML={{ __html: panel.result }} />
              </div>
            )}

            {panel.error && (
              <p className="mt-2 text-xs text-red-500">{panel.error}</p>
            )}
          </div>
        ))}

        <button onClick={addPanel}
          className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-500 hover:text-indigo-600 hover:border-indigo-400 transition-colors flex items-center justify-center gap-1">
          <Plus className="w-4 h-4" /> Adicionar Versão
        </button>
      </div>
    </div>
  );
};

export default BibleSidebar;
