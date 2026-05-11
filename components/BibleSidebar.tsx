import React, { useState } from 'react';
import { Search, Copy, Loader2, BookOpen } from 'lucide-react';
import { searchBibleVerse } from '../services/aiService';

export const BibleSidebar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [version, setVersion] = useState('ARA');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    const text = await searchBibleVerse(query, version);
    setResult(text);
    setLoading(false);
  };

  const copyToClipboard = () => {
    if (!result) return;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = result;
    const text = tempDiv.innerText;
    navigator.clipboard.writeText(text);
    alert("Versículo copiado!");
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-indigo-50 dark:bg-slate-800">
        <h3 className="font-bold text-indigo-800 dark:text-indigo-400 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Bíblia Integrada
        </h3>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        <form onSubmit={handleSearch} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase">Passagem / Palavra</label>
            <div className="relative">
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ex: João 3:16 ou Amor"
                    className="w-full p-2 pl-8 border border-slate-300 rounded-md text-sm bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-2 top-2.5" />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase">Versão</label>
            <select 
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md text-sm bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
                <option value="ACF">ACF - Almeida Corrigida Fiel</option>
                <option value="ARA">ARA - Almeida Revista e Atualizada</option>
                <option value="NTLH">NTLH - Nova Tradução na Linguagem de Hoje</option>
                <option value="A Mensagem">A Mensagem</option>
                <option value="NVI">NVI - Nova Versão Internacional</option>
                <option value="KJV">KJV - King James Version</option>
            </select>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md text-sm font-medium transition-colors flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar na Bíblia"}
          </button>
        </form>

        {result && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-amber-50 dark:bg-slate-800 border border-amber-100 dark:border-slate-700 p-4 rounded-lg relative group">
                <button 
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2 p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Copiar"
                >
                    <Copy className="w-4 h-4" />
                </button>
                <div 
                    className="prose prose-sm text-slate-800 dark:text-slate-300 serif-font"
                    dangerouslySetInnerHTML={{ __html: result }} 
                />
            </div>
            <p className="text-xs text-center text-slate-400 mt-2">
                Gerado via IA. Verifique na sua Bíblia física.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};