import React, { useMemo } from 'react';
import { TextEntry } from '../types';
import { BarChart3, Type, Hash, CalendarCheck, Network } from 'lucide-react';

interface StatsDashboardProps {
  entries: TextEntry[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ entries }) => {
  const totalTexts = entries.length;
  
  // Calculate total words
  const totalWords = entries.reduce((acc, entry) => {
    const div = document.createElement('div');
    div.innerHTML = entry.correctedBody || entry.originalBody || '';
    const text = div.textContent || div.innerText || "";
    return acc + text.trim().split(/\s+/).length;
  }, 0);

  // Tag frequency
  const tagCounts: Record<string, number> = {};
  entries.forEach(entry => {
    if (entry.tags && Array.isArray(entry.tags)) {
      entry.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });
  
  const sortedTags = Object.entries(tagCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  // Prepare Mind Map Data
  const mindMapData = useMemo(() => {
      // Pick top 6 tags for the "Planets"
      const topTags = sortedTags.slice(0, 6).map(([t]) => t);
      const nodes: { id: string, type: 'tag' | 'text', label: string, x: number, y: number, r: number, color: string }[] = [];
      const links: { x1: number, y1: number, x2: number, y2: number }[] = [];

      const centerX = 400;
      const centerY = 250;
      
      topTags.forEach((tag, i) => {
          const angle = (i / topTags.length) * 2 * Math.PI;
          const planetR = 150;
          const px = centerX + Math.cos(angle) * planetR;
          const py = centerY + Math.sin(angle) * planetR;

          // Add Tag Node (Planet)
          nodes.push({ id: `tag-${tag}`, type: 'tag', label: tag, x: px, y: py, r: 25, color: '#3B6FE0' }); // Azul 5A

          // Find connected texts (Moons)
          const relatedTexts = entries.filter(e => Array.isArray(e.tags) && e.tags.includes(tag)).slice(0, 4);
          relatedTexts.forEach((txt, j) => {
               const moonAngle = (j / relatedTexts.length) * 2 * Math.PI;
               const moonR = 50;
               const mx = px + Math.cos(moonAngle) * moonR;
               const my = py + Math.sin(moonAngle) * moonR;
               
               // Only add if not exists (texts can belong to multiple tags, simple dedupe by ID would require complex layouting, allowing overlap for this simple viz)
               nodes.push({ id: `txt-${tag}-${txt.id}`, type: 'text', label: txt.correctedTitle || txt.originalTitle || '', x: mx, y: my, r: 6, color: '#8492A6' });
               links.push({ x1: px, y1: py, x2: mx, y2: my });
          });
          
          // Link to Center (Abstract Core)
          links.push({ x1: centerX, y1: centerY, x2: px, y2: py });
      });

      // Core Node
      nodes.push({ id: 'core', type: 'tag', label: 'Luciano\'s Scribe', x: centerX, y: centerY, r: 10, color: '#C2540E' });

      return { nodes, links };
  }, [entries, sortedTags]);

  return (
    <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6 animate-in fade-in duration-500">
      <h2 className="font-display text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-2 sm:mb-6">
        <BarChart3 className="text-[#3B6FE0]" />
        Estatísticas de Produtividade
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Cards */}
        <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-lg border border-[#DEE3EA] dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#E8EFFC] dark:bg-indigo-900/30 rounded-md">
                <CalendarCheck className="w-6 h-6 text-[#2C5AC7] dark:text-indigo-400" />
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total de Textos</p>
                <h3 className="font-display text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">{totalTexts}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-lg border border-[#DEE3EA] dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-md">
                <Type className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Palavras Escritas</p>
                <h3 className="font-display text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">{totalWords.toLocaleString('pt-BR')}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-lg border border-[#DEE3EA] dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#FDEEE3] dark:bg-amber-900/30 rounded-md">
                <Hash className="w-6 h-6 text-[#C2540E] dark:text-amber-400" />
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Tags Únicas</p>
                <h3 className="font-display text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">{Object.keys(tagCounts).length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Mind Map */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg border border-[#DEE3EA] dark:border-slate-700">
          <h3 className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2"><Network className="w-5 h-5 text-[#3B6FE0]"/> Galáxia de Tópicos</h3>
          <p className="text-sm text-slate-500 mb-4">Visualização das suas principais tags e como os textos orbitam ao redor delas.</p>
          
          <div className="w-full overflow-x-auto border border-[#DEE3EA] dark:border-slate-700 rounded-md bg-[#F8FAFD] dark:bg-slate-900 flex justify-center">
              <svg width="800" height="500" viewBox="0 0 800 500" className="w-full min-w-[600px] h-auto">
                  {/* Lines */}
                  {mindMapData.links.map((link, i) => (
                      <line key={i} x1={link.x1} y1={link.y1} x2={link.x2} y2={link.y2} stroke="#DEE3EA" strokeWidth="1.5" className="dark:stroke-slate-700" />
                  ))}
                  {/* Nodes */}
                  {mindMapData.nodes.map((node, i) => (
                      <g key={i}>
                          <circle cx={node.x} cy={node.y} r={node.r} fill={node.color} opacity={node.type === 'tag' ? 0.9 : 0.7} />
                          <text 
                            x={node.x} 
                            y={node.y + node.r + 13} 
                            textAnchor="middle" 
                            className={`text-[11px] font-medium fill-slate-600 dark:fill-slate-300 pointer-events-none ${node.type === 'tag' ? 'font-bold uppercase tracking-wide' : ''}`}
                          >
                              {node.label.length > 20 ? node.label.substring(0,18)+'...' : node.label}
                          </text>
                      </g>
                  ))}
              </svg>
          </div>
      </div>

      {/* Tag Cloud List */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg border border-[#DEE3EA] dark:border-slate-700">
        <h3 className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-4">Detalhes dos Tópicos</h3>
        <div className="flex flex-wrap gap-2 sm:gap-3">
            {sortedTags.map(([tag, count], index) => (
                <div key={tag} className="flex items-center bg-[#F0F2F5] dark:bg-slate-700 rounded-md px-3 py-1.5 sm:px-4 sm:py-2">
                    <span className="text-slate-700 dark:text-slate-200 font-medium text-sm mr-2">{tag}</span>
                    <span className="bg-[#3B6FE0] dark:bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded">{count}</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
