import React, { useState, useRef } from 'react';
import { Upload, Loader2, FileText, CheckCircle, X, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { searchBibleVerse, suggestTitles, correctGrammar, rewriteInStyle, summarizeSelectedText, translateText } from '../services/aiService';

interface ImportTextsProps {
  onImportComplete: (count: number) => void;
}

interface ParsedText {
  title: string;
  content: string;
  suggestedDate: string;
}

export const ImportTexts: React.FC<ImportTextsProps> = ({ onImportComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedTexts, setParsedTexts] = useState<ParsedText[]>([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseTextsWithAI = async (text: string): Promise<ParsedText[]> => {
    try {
      const { processTextEntry } = await import('../services/aiService');
      const result = await processTextEntry('Analisar textos', text);
      const texts: ParsedText[] = [{
        title: result.correctedTitle || 'Texto Importado',
        content: result.correctedBody || text.substring(0, 5000),
        suggestedDate: new Date().toISOString().split('T')[0]
      }];
      return texts;
    } catch {
      return [{
        title: 'Texto Importado',
        content: text.substring(0, 5000),
        suggestedDate: new Date().toISOString().split('T')[0]
      }];
    }
  };

  const handleFile = async (file: File) => {
    setError('');
    setIsProcessing(true);
    setProgress(10);

    try {
      let text = '';

      if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        text = await file.text();
      } else if (file.name.endsWith('.html') || file.name.includes('google') || file.name.includes('doc')) {
        const reader = new FileReader();
        text = await new Promise((resolve) => {
          reader.onload = (e) => {
            const div = document.createElement('div');
            div.innerHTML = e.target?.result as string;
            resolve(div.innerText || '');
          };
          reader.readAsText(file);
        });
      } else {
        text = await file.text();
      }

      setProgress(30);
      const parsed = await parseTextsWithAI(text);
      setProgress(90);
      setParsedTexts(parsed);
      setProgress(100);
    } catch (err) {
      setError('Erro ao processar arquivo. Tente novamente.');
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await handleFile(file);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFile(file);
  };

  const saveAllTexts = async () => {
    setIsProcessing(true);
    let saved = 0;

    try {
      const { processTextEntry } = await import('../services/aiService');
      
      for (const text of parsedTexts) {
        const result = await processTextEntry(text.title, text.content);
        
        const entry = {
          id: crypto.randomUUID(),
          originalTitle: text.title,
          originalBody: text.content,
          correctedTitle: result.correctedTitle || text.title,
          correctedBody: result.correctedBody || text.content,
          summary: result.summary || text.content.substring(0, 100) + '...',
          tags: result.tags || [],
          bibleCitations: result.bibleCitations || [],
          creationDate: text.suggestedDate,
          savedAt: Date.now(),
          isFavorite: false,
          collectionId: '',
          versions: []
        };

        const existing = JSON.parse(localStorage.getItem('luciano-scribe-texts') || '[]');
        localStorage.setItem('luciano-scribe-texts', JSON.stringify([entry, ...existing]));
        saved++;
      }
    } catch (err) {
      console.error("Erro ao processar textos:", err);
    }

    setIsProcessing(false);
    onImportComplete(saved);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-[#DEE3EA] dark:border-slate-700 p-5 sm:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="w-5 h-5 text-[#3B6FE0]" />
        <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Importar Textos</h3>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Arraste um arquivo do Google Docs, Word ou texto. A IA identificará cada texto automaticamente.
      </p>

      {!parsedTexts.length && !isProcessing && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-colors ${
            isDragging 
              ? 'border-[#3B6FE0] bg-[#E8EFFC] dark:bg-indigo-900/20' 
              : 'border-[#DEE3EA] dark:border-slate-600 hover:border-[#3B6FE0]'
          }`}
        >
          <Upload className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <p className="text-slate-600 dark:text-slate-300 font-medium">Clique ou arraste o arquivo aqui</p>
          <p className="text-xs text-slate-400 mt-1">.txt, .md, .html, .docx</p>
          <input ref={fileInputRef} type="file" className="hidden" accept=".txt,.md,.html,.doc,.docx" onChange={handleFileSelect} />
        </div>
      )}

      {isProcessing && !parsedTexts.length && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 mx-auto text-[#3B6FE0] animate-spin mb-3" />
          <p className="text-slate-600 dark:text-slate-300">Analisando textos com IA...</p>
          <div className="w-full bg-[#F0F2F5] dark:bg-slate-700 rounded-full h-2 mt-4">
            <div className="bg-[#3B6FE0] h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md mt-4">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {parsedTexts.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {parsedTexts.length} texto(s) identificado(s)
            </p>
            <button onClick={() => { setParsedTexts([]); setProgress(0); }} className="text-xs text-slate-400 hover:text-slate-600">
              Limpar
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
            {parsedTexts.map((text, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-[#F8FAFD] dark:bg-slate-700/50 rounded-md">
                <FileText className="w-4 h-4 text-[#3B6FE0] mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{text.title}</p>
                  <p className="text-xs text-slate-400">{text.content.substring(0, 60)}...</p>
                </div>
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>
            ))}
          </div>

          <button
            onClick={saveAllTexts}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#3B6FE0] hover:bg-[#2C5AC7] text-white rounded-md font-semibold disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Salvar {parsedTexts.length} Textos
          </button>
        </div>
      )}
    </div>
  );
};
