import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Zap, Target, BookOpen, Tag, MessageSquare, X, ChevronRight, Loader2, Wand2 } from 'lucide-react';

interface AIAgentProps {
  editorContent: string;
  onSuggestionApply: (content: string) => void;
}

interface AgentSuggestion {
  id: string;
  type: 'tags' | 'summary' | 'structure' | 'bible_ref' | 'title';
  title: string;
  description: string;
  confidence: number;
  content?: string;
}

export const AIAgent: React.FC<AIAgentProps> = ({ editorContent, onSuggestionApply }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastAnalyzedLength, setLastAnalyzedLength] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (editorContent.length < 100 || editorContent.length === lastAnalyzedLength) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      analyzeContent(editorContent);
    }, 3000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [editorContent, lastAnalyzedLength]);

  const analyzeContent = async (content: string) => {
    setIsAnalyzing(true);
    setLastAnalyzedLength(content.length);

    const newSuggestions: AgentSuggestion[] = [];

    const wordCount = content.split(/\s+/).length;
    const hasBibleTerms = / Deus | Senhor | Jesus | Salmo | bíblic| espiritual | fé | oração | céu | inferno | pecado /i.test(content);
    const hasStructure = /^\d+\.|^[IVX]+\.|^\[/.test(content);

    if (wordCount > 200 && !content.includes('<h1') && !content.includes('# ')) {
      newSuggestions.push({
        id: 'structure-' + Date.now(),
        type: 'structure',
        title: 'Adicionar Títulos',
        description: 'O texto está longo sem estrutura. Posso adicionar títulos automaticamente?',
        confidence: 0.85,
        content: content
      });
    }

    if (hasBibleTerms) {
      newSuggestions.push({
        id: 'bible-' + Date.now(),
        type: 'bible_ref',
        title: 'Detectar Referências Bíblicas',
        description: 'Identifiquei menções bíblicas. Posso formatar as referências automaticamente?',
        confidence: 0.9
      });
    }

    if (wordCount > 50 && content.length > 500) {
      newSuggestions.push({
        id: 'tags-' + Date.now(),
        type: 'tags',
        title: 'Sugerir Tags',
        description: 'Posso analisar o conteúdo e gerar tags relevantes automaticamente.',
        confidence: 0.8
      });
    }

    if (wordCount > 100 && content.length > 1000) {
      newSuggestions.push({
        id: 'summary-' + Date.now(),
        type: 'summary',
        title: 'Gerar Resumo',
        description: 'Posso criar um resumo automático do texto para a biblioteca.',
        confidence: 0.75
      });
    }

    if (!content.startsWith('<h1>') && !content.startsWith('#') && wordCount > 20) {
      newSuggestions.push({
        id: 'title-' + Date.now(),
        type: 'title',
        title: 'Sugerir Título',
        description: 'Posso sugerir um título otimizado baseado no conteúdo.',
        confidence: 0.7
      });
    }

    setSuggestions(newSuggestions);
    setIsAnalyzing(false);
  };

  const applySuggestion = async (suggestion: AgentSuggestion) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    onSuggestionApply(JSON.stringify(suggestion));
  };

  const dismissSuggestion = (id: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  if (editorContent.length < 50) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className={`transition-all duration-300 ease-out ${isExpanded ? 'w-80' : 'w-auto'}`}>
        {isExpanded && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 mb-4 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-violet-500 to-indigo-600">
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold">AI Agent</span>
                {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
              </div>
              <p className="text-xs text-white/70 mt-1">Analisando seu texto em tempo real...</p>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto">
              {suggestions.length === 0 && !isAnalyzing && (
                <div className="text-center text-slate-400 py-4">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Tudo limpo! Continue escrevendo.</p>
                </div>
              )}

              {suggestions.map(s => (
                <div key={s.id} className="mb-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600 hover:border-indigo-200 dark:hover:border-indigo-500 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {s.type === 'tags' && <Tag className="w-4 h-4 text-indigo-500" />}
                      {s.type === 'summary' && <BookOpen className="w-4 h-4 text-emerald-500" />}
                      {s.type === 'structure' && <Target className="w-4 h-4 text-amber-500" />}
                      {s.type === 'bible_ref' && <BookOpen className="w-4 h-4 text-violet-500" />}
                      {s.type === 'title' && <MessageSquare className="w-4 h-4 text-blue-500" />}
                      <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{s.title}</span>
                    </div>
                    <button onClick={() => dismissSuggestion(s.id)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{s.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{Math.round(s.confidence * 100)}% confiança</span>
                    <button 
                      onClick={() => applySuggestion(s)}
                      className="flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-lg text-xs font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                    >
                      Aplicar <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-300 ${
            suggestions.length > 0 
              ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white animate-pulse' 
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <div className="relative">
            <Wand2 className="w-5 h-5" />
            {suggestions.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-ping"></span>
            )}
          </div>
          {isExpanded ? (
            <span className="font-semibold text-sm">Fechar</span>
          ) : (
            <>
              <span className="font-semibold text-sm">AI Agent</span>
              {suggestions.length > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">{suggestions.length}</span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};