import React, { useState, useRef } from 'react';
import { Upload, Loader2, FileText, CheckCircle, X, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

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
    const prompt = `Analise o texto abaixo e identifique múltiplos textos/blog posts/reflexões. 

Para CADA texto identificado, retorne no formato EXATO:
[TITLE: título do texto]
[DATE: data estimada no formato YYYY-MM-DD]
[CONTENT: conteúdo completo do texto]

Separe cada texto com "---SEPARATOR---"

Se o texto for muito longo, divida em partes lógicas (por temas ou parágrafos principais).

Texto para analisar:
${text}`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDDiqW_bT1m2c8hVJyVzG2-kGy7JZh4wIw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 32000
        }
      })
    });

    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const texts: ParsedText[] = [];
    const segments = result.split('---SEPARATOR---');

    for (const segment of segments) {
      const titleMatch = segment.match(/\[TITLE:\s*(.*?)\]/i);
      const dateMatch = segment.match(/\[DATE:\s*(.*?)\]/i);
      const contentMatch = segment.match(/\[CONTENT:\s*(.*?)\]/i);

      if (titleMatch && contentMatch) {
        texts.push({
          title: titleMatch[1].trim(),
          content: contentMatch[1].trim(),
          suggestedDate: dateMatch ? dateMatch[1].trim() : new Date().toISOString().split('T')[0]
        });
      }
    }

    return texts.length > 0 ? texts : [{
      title: 'Texto Importado',
      content: text.substring(0, 5000),
      suggestedDate: new Date().toISOString().split('T')[0]
    }];
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

    for (const text of parsedTexts) {
      const processed = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDDiqW_bT1m2c8hVJyVzG2-kGy7JZh4wIw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Analise o texto e extraia: título corrigido, corpo formatado em HTML, resumo em 1 frase, tags relevantes (lista de 3-5 palavras), e citações bíblicas se houver. Retorne JSON com: correctedTitle, correctedBody, summary, tags, bibleCitations. Texto: ${text.content.substring(0, 3000)}` }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 4000 }
        })
      });

      const data = await processed.json();
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      let parsed = { correctedTitle: text.title, correctedBody: text.content, summary: '', tags: [], bibleCitations: [] as any[] };
      
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = { ...parsed, ...JSON.parse(jsonMatch[0]) };
      } catch (e) {}

      const entry = {
        id: crypto.randomUUID(),
        originalTitle: text.title,
        originalBody: text.content,
        correctedTitle: parsed.correctedTitle,
        correctedBody: parsed.correctedBody,
        summary: parsed.summary || text.content.substring(0, 100) + '...',
        tags: parsed.tags || [],
        bibleCitations: parsed.bibleCitations || [],
        creationDate: text.suggestedDate,
        savedAt: Date.now(),
        isFavorite: false,
        collectionId: '',
        versions: []
      };

      const existing = JSON.parse(localStorage.getItem('texts') || '[]');
      localStorage.setItem('texts', JSON.stringify([entry, ...existing]));
      saved++;
    }

    setIsProcessing(false);
    onImportComplete(saved);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="w-5 h-5 text-indigo-500" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Importar Textos</h3>
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
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragging 
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
              : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400'
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
          <Loader2 className="w-8 h-8 mx-auto text-indigo-500 animate-spin mb-3" />
          <p className="text-slate-600 dark:text-slate-300">Analisando textos com IA...</p>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-4">
            <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg mt-4">
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
              <div key={i} className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <FileText className="w-4 h-4 text-indigo-500 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{text.title}</p>
                  <p className="text-xs text-slate-400">{text.content.substring(0, 60)}...</p>
                </div>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
            ))}
          </div>

          <button
            onClick={saveAllTexts}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Salvar {parsedTexts.length} Textos
          </button>
        </div>
      )}
    </div>
  );
};