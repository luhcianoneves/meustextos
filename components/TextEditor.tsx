
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Sparkles, Loader2, Calendar, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify, Mic, MicOff, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Image as ImageIcon, Video, FolderOpen, Clock, Lightbulb, RotateCcw, Upload, Heading1, Heading2, Heading3, Quote, Undo, Redo, RemoveFormatting, Download, Eye, EyeOff, File, FileText, Languages, FileEdit, BookOpen, CheckCircle, Sparkles as AISparkle, Link, Minus, Palette, Type as TypeIcon, Superscript, Subscript, Link2 } from 'lucide-react';
import { processTextEntry, generateIllustration, transcribeAudioFile, summarizeSelectedText, rewriteInStyle, translateText, suggestTitles, correctGrammar } from '../services/aiService';
import { TextEntry, Collection } from '../types';
import { jsPDF } from 'jspdf';
import { AIAgent } from './AIAgent';

interface TextEditorProps {
  onSave: (entry: TextEntry) => void;
  collections: Collection[];
  initialEntry: TextEntry | null;
}

export const TextEditor: React.FC<TextEditorProps> = ({ onSave, collections, initialEntry }) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribingFile, setIsTranscribingFile] = useState(false);
  const [illustrationLoading, setIllustrationLoading] = useState(false);
  const [previousVersions, setPreviousVersions] = useState<{timestamp: number, body: string, title: string}[]>([]);
  
  // Novas funcionalidades
  const [focusMode, setFocusMode] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [writingTime, setWritingTime] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [startTime] = useState<number>(Date.now());
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // AI Tools
  const [showAITools, setShowAITools] = useState(false);
  const [aiLoading, setAiLoading] = useState('');
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState('formal');
  const [selectedLanguage, setSelectedLanguage] = useState('Inglês');
  
  const editorRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Initial Data if editing
  useEffect(() => {
    if (initialEntry) {
        setTitle(initialEntry.correctedTitle || initialEntry.originalTitle);
        setDate(initialEntry.creationDate);
        setSelectedCollection(initialEntry.collectionId || '');
        if (editorRef.current) {
            editorRef.current.innerHTML = initialEntry.correctedBody || initialEntry.originalBody;
        }
        setPreviousVersions(initialEntry.versions || []);
    } else {
        setTitle('');
        setDate(new Date().toISOString().split('T')[0]);
        setSelectedCollection('');
        if (editorRef.current) editorRef.current.innerHTML = '';
        setPreviousVersions([]);
    }
  }, [initialEntry]);

  // Contador de palavras, caracteres e tempo de escrita
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    
    const updateCount = () => {
      const text = editor.innerText || '';
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
      setCharCount(text.length);
    };
    
    const interval = setInterval(updateCount, 1000);
    editor.addEventListener('input', updateCount);
    return () => {
      clearInterval(interval);
      editor.removeEventListener('input', updateCount);
    };
  }, []);

  // Tempo de escrita
  useEffect(() => {
    const timer = setInterval(() => {
      setWritingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Auto-save a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (title && editorRef.current?.innerHTML) {
        setAutoSaveStatus('Salvando...');
        localStorage.setItem('luciano-scribe-autosave', JSON.stringify({
          title,
          body: editorRef.current.innerHTML,
          date,
          collectionId: selectedCollection,
          savedAt: Date.now()
        }));
        setTimeout(() => setAutoSaveStatus(''), 2000);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [title, date, selectedCollection]);

  // Carregar auto-save ao iniciar
  useEffect(() => {
    const autosave = localStorage.getItem('luciano-scribe-autosave');
    if (autosave && !initialEntry) {
      const data = JSON.parse(autosave);
      if (data.savedAt > Date.now() - 3600000) { // menos de 1 hora
        if (confirm('Encontrou um rascunho não salvo. Deseja recuperar?')) {
          setTitle(data.title);
          setDate(data.date);
          setSelectedCollection(data.collectionId || '');
          if (editorRef.current) editorRef.current.innerHTML = data.body;
        }
      }
    }
  }, []);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript && editorRef.current) {
          document.execCommand('insertText', false, finalTranscript);
        }
      };
      
      recognitionRef.current.onend = () => {
         if (isListening) recognitionRef.current.start();
      };
    }
  }, [isListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) return alert("Navegador não suportado.");
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      editorRef.current?.focus();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (approx 20MB limit for browser stability in this demo)
    if (file.size > 20 * 1024 * 1024) {
        alert("O arquivo é muito grande. Por favor, use arquivos menores que 20MB.");
        return;
    }

    setIsTranscribingFile(true);
    const reader = new FileReader();
    reader.onload = async () => {
        try {
            const base64String = (reader.result as string).split(',')[1];
            const transcription = await transcribeAudioFile(base64String, file.type);
            document.execCommand('insertText', false, " " + transcription + " ");
        } catch (error) {
            alert("Erro na transcrição do arquivo.");
        } finally {
            setIsTranscribingFile(false);
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    reader.readAsDataURL(file);
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertImage = () => {
    const url = prompt("Cole a URL da imagem:");
    if (url) executeCommand('insertImage', url);
  };

  const insertVideo = () => {
    const url = prompt("Cole a URL do vídeo (MP4 ou similar):");
    if (url) {
      const videoHtml = `<br><video controls src="${url}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;"></video><br>`;
      document.execCommand('insertHTML', false, videoHtml);
    }
  };

  const insertLink = () => {
    const url = prompt("Cole a URL do link:");
    if (url) {
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        executeCommand('createLink', url);
      } else {
        executeCommand('insertHTML', false, `<a href="${url}" target="_blank">${url}</a>`);
      }
    }
  };

  const insertHR = () => {
    executeCommand('insertHTML', false, '<hr style="border: none; border-top: 2px solid #e2e8f0; margin: 20px 0;">');
  };

  const insertTable = () => {
    const rows = prompt("Número de linhas:", "3");
    const cols = prompt("Número de colunas:", "3");
    if (!rows || !cols) return;
    
    let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">';
    for (let i = 0; i < parseInt(rows); i++) {
      tableHtml += '<tr>';
      for (let j = 0; j < parseInt(cols); j++) {
        tableHtml += `<td style="border: 1px solid #e2e8f0; padding: 8px;">Célula ${i+1}-${j+1}</td>`;
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</table><br>';
    executeCommand('insertHTML', false, tableHtml);
  };

  const setTextColor = (color: string) => {
    executeCommand('foreColor', color);
  };

  const setHighlight = (color: string) => {
    executeCommand('hiliteColor', color);
  };

  const insertEmoji = () => {
    const emojis = ['😀', '❤️', '🙏', '✨', '⭐', '🔥', '💡', '📖', '🎯', '✅'];
    const emoji = prompt(`Escolha um emoji:\n${emojis.join(' ')}`);
    if (emoji && emojis.includes(emoji)) {
      executeCommand('insertText', emoji);
    }
  };

  const insertTemplate = (type: string) => {
    let html = '';
    switch(type) {
      case 'versiculo':
        html = `<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; font-style: italic;"><p style="margin: 0;">Seu texto aqui</p><small style="color: #92400e;">— Referência</small></div>`;
        break;
      case 'destaque':
        html = `<div style="background: #dbeafe; border: 1px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 8px;"><strong>💡 Ponto Principal:</strong><p style="margin: 10px 0 0 0;">Seu conteúdo aqui</p></div>`;
        break;
      case 'alert':
        html = `<div style="background: #fee2e2; border: 1px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 8px; color: #991b1b;"><strong>⚠️ Importante:</strong><p style="margin: 10px 0 0 0;">Seu conteúdo aqui</p></div>`;
        break;
      case 'passo':
        html = `<ol style="margin: 15px 0; padding-left: 25px;"><li style="margin-bottom: 10px;">Passo 1</li><li style="margin-bottom: 10px;">Passo 2</li><li style="margin-bottom: 10px;">Passo 3</li></ol>`;
        break;
      case 'comparacao':
        html = `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0;"><div style="background: #f0fdf4; padding: 15px; border-radius: 8px;"><strong>✅ Prós:</strong><ul style="margin: 10px 0 0 0; padding-left: 20px;"><li>Item 1</li></ul></div><div style="background: #fef2f2; padding: 15px; border-radius: 8px;"><strong>❌ Contras:</strong><ul style="margin: 10px 0 0 0; padding-left: 20px;"><li>Item 1</li></ul></div></div>`;
        break;
    }
    if (html) executeCommand('insertHTML', false, html);
  };

  const handleGenerateIllustration = async () => {
    const content = editorRef.current?.innerText;
    if (!content || content.length < 50) {
        alert("Escreva um pouco mais para gerar uma ilustração.");
        return;
    }
    setIllustrationLoading(true);
    const illus = await generateIllustration(content);
    const html = `<br/><blockquote style="border-left: 4px solid #6366f1; padding-left: 1rem; color: #4b5563; font-style: italic; background-color: #f8fafc; padding: 10px;"><strong>💡 Ilustração Sugerida:</strong><br/>${illus}</blockquote><br/>`;
    document.execCommand('insertHTML', false, html);
    setIllustrationLoading(false);
  };

  const handleSave = async () => {
    const bodyContent = editorRef.current?.innerHTML || '';
    if (!title.trim() || !bodyContent.trim() || !date) return alert("Preencha todos os campos.");

    setIsProcessing(true);
    try {
      const processed = await processTextEntry(title, bodyContent);
      
      const newEntry: TextEntry = {
        // Use existing ID if editing, otherwise create new
        id: initialEntry ? initialEntry.id : crypto.randomUUID(),
        originalTitle: title,
        originalBody: bodyContent,
        correctedTitle: processed.correctedTitle,
        correctedBody: processed.correctedBody,
        summary: processed.summary,
        tags: processed.tags,
        bibleCitations: processed.bibleCitations || [],
        creationDate: date,
        savedAt: Date.now(),
        // Preserve favorite status if editing
        isFavorite: initialEntry ? initialEntry.isFavorite : false,
        collectionId: selectedCollection,
        versions: previousVersions
      };

      onSave(newEntry);
      
      // Only clear if not editing (or handled by parent unmount)
      if (!initialEntry) {
        setTitle('');
        if (editorRef.current) editorRef.current.innerHTML = '';
        setPreviousVersions([]);
      }
      
      alert(initialEntry ? "Texto atualizado com sucesso!" : "Texto salvo e organizado!");
    } catch (error) {
      console.error(error);
      alert("Erro ao processar.");
    } finally {
      setIsProcessing(false);
    }
  };

  const restoreVersion = (v: {title: string, body: string}) => {
      if(confirm("Substituir o texto atual por esta versão antiga?")) {
          setTitle(v.title);
          if (editorRef.current) editorRef.current.innerHTML = v.body;
      }
  }

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          handleSave();
        } else if (e.key === 'b') {
          e.preventDefault();
          executeCommand('bold');
        } else if (e.key === 'i') {
          e.preventDefault();
          executeCommand('italic');
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [title]); // Dependência title para evitar warning

  // Funções de exportação
  const exportToPDF = () => {
    const doc = new jsPDF();
    const text = editorRef.current?.innerText || '';
    const lines = doc.splitTextIntoLines(text, 180);
    doc.setFontSize(16);
    doc.text(title, 20, 20);
    doc.setFontSize(11);
    doc.text(lines, 20, 40);
    doc.save(`${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
  };

  const exportToWord = () => {
    const text = editorRef.current?.innerHTML || '';
    const html = `<html><body><h1>${title}</h1>${text}</body></html>`;
    const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToTxt = () => {
    const text = editorRef.current?.innerText || '';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getSelectedText = () => {
    const selection = window.getSelection();
    return selection?.toString() || editorRef.current?.innerText || '';
  };

  const handleSummarize = async () => {
    const text = getSelectedText();
    if (!text) return alert("Selecione ou escreva um texto primeiro.");
    setAiLoading('Resumindo...');
    try {
      const summary = await summarizeSelectedText(text);
      if (editorRef.current) {
        document.execCommand('insertHTML', false, `<br/><div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 1rem; margin: 1rem 0;"><strong>Resumo:</strong><p>${summary}</p></div>`);
      }
    } catch (e) { alert("Erro ao resumir."); }
    setAiLoading('');
  };

  const handleRewrite = async () => {
    const text = getSelectedText();
    if (!text) return alert("Selecione um texto primeiro.");
    setAiLoading('Reescrevendo...');
    try {
      const rewritten = await rewriteInStyle(text, selectedStyle);
      if (editorRef.current) {
        editorRef.current.innerHTML = rewritten;
      }
    } catch (e) { alert("Erro ao reescrever."); }
    setAiLoading('');
  };

  const handleTranslate = async () => {
    const text = getSelectedText();
    if (!text) return alert("Selecione um texto primeiro.");
    setAiLoading('Traduzindo...');
    try {
      const translated = await translateText(text, selectedLanguage);
      if (editorRef.current) {
        editorRef.current.innerHTML = translated;
      }
    } catch (e) { alert("Erro ao traduzir."); }
    setAiLoading('');
  };

  const handleSuggestTitles = async () => {
    const text = getSelectedText();
    if (!text) return alert("Escreva um texto primeiro.");
    setAiLoading('Gerando títulos...');
    try {
      const titles = await suggestTitles(text);
      setSuggestedTitles(titles);
    } catch (e) { alert("Erro ao sugerir títulos."); }
    setAiLoading('');
  };

  const handleCorrectGrammar = async () => {
    const text = editorRef.current?.innerText;
    if (!text) return alert("Escreva um texto primeiro.");
    setAiLoading('Corrigindo...');
    try {
      const corrected = await correctGrammar(text);
      if (editorRef.current) {
        editorRef.current.innerHTML = corrected;
      }
    } catch (e) { alert("Erro ao corrigir."); }
    setAiLoading('');
  };

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${focusMode ? 'fixed inset-0 z-50 bg-white p-8 overflow-y-auto' : ''}`}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8 transition-colors">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Sparkles className="text-indigo-500 w-6 h-6" />
            {initialEntry ? 'Editar Texto' : 'Novo Texto'}
          </h2>
          
          {/* Auto-save status */}
          {autoSaveStatus && (
            <span className="text-xs text-emerald-600 animate-pulse">{autoSaveStatus}</span>
          )}
          
          {/* Modo Focus - Botão sair */}
          {focusMode && (
            <button 
                onClick={() => setFocusMode(false)}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600"
            >
                <EyeOff className="w-3 h-3" /> Sair Focus
            </button>
          )}
          
          {/* Version History Dropdown */}
          {previousVersions.length > 0 && (
              <div className="relative group">
                  <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-500">
                      <Clock className="w-3 h-3" /> Histórico ({previousVersions.length})
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-700 shadow-xl rounded-lg border border-slate-100 dark:border-slate-600 hidden group-hover:block z-10 p-2">
                      <p className="text-xs font-bold text-slate-400 p-2">Últimos rascunhos:</p>
                      {previousVersions.map((v, i) => (
                          <div key={i} onClick={() => restoreVersion(v)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer rounded text-xs text-slate-700 dark:text-slate-200 flex justify-between">
                             <span>{new Date(v.timestamp).toLocaleTimeString()}</span>
                             <RotateCcw className="w-3 h-3"/>
                          </div>
                      ))}
                  </div>
              </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            
            <div className="col-span-1">
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" /> Estudo/Série
                </label>
                <select 
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
                >
                    <option value="">Sem Série</option>
                    {collections.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Type className="w-4 h-4" /> Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Reflexão sobre Salmos 23..."
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <AlignLeft className="w-4 h-4" /> Conteúdo
                <span className="text-xs text-slate-400 ml-2">| {wordCount} palavras | {charCount} caracteres | {formatTime(writingTime)}</span>
                </label>
                <div className="flex gap-2">
                    {/* Modo Focus */}
                    <button 
                        onClick={() => setFocusMode(!focusMode)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${focusMode ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        title="Modo Focus (escrita sem distrações)"
                    >
                        {focusMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        Focus
                    </button>
                    
                    {/* Export Menu */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                        >
                            <Download className="w-3 h-3" />
                            Exportar
                        </button>
                        {showExportMenu && (
                            <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-700 shadow-xl rounded-lg border border-slate-100 dark:border-slate-600 z-20">
                                <button onClick={() => { exportToPDF(); setShowExportMenu(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2">
                                    <Download className="w-4 h-4" /> PDF
                                </button>
                                <button onClick={() => { exportToWord(); setShowExportMenu(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2">
                                    <File className="w-4 h-4" /> Word
                                </button>
                                <button onClick={() => { exportToTxt(); setShowExportMenu(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> TXT
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={handleGenerateIllustration}
                        disabled={illustrationLoading}
                        className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                        title="Gerar metáfora/ilustração via IA"
                    >
                        {illustrationLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Lightbulb className="w-3 h-3" />}
                        Ilustração IA
                    </button>
                    
                    {/* Audio Import Button */}
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isTranscribingFile}
                        className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                        title="Importar áudio (MP3/WAV)"
                    >
                        {isTranscribingFile ? <Loader2 className="w-3 h-3 animate-spin"/> : <Upload className="w-3 h-3" />}
                        Importar Áudio
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="audio/*"
                        onChange={handleFileUpload}
                    />

                    <button 
                        onClick={toggleListening}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all ${isListening ? 'bg-red-100 text-red-600 animate-pulse border border-red-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                        {isListening ? 'Parar' : 'Ditar'}
                    </button>
                    
                    {/* AI Tools */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowAITools(!showAITools)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${showAITools ? 'bg-violet-100 text-violet-700' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}
                        >
                            <AISparkle className="w-3 h-3" />
                            IA Tools {aiLoading && <Loader2 className="w-3 h-3 animate-spin"/>}
                        </button>
                        {showAITools && (
                            <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-700 shadow-xl rounded-lg border border-slate-100 dark:border-slate-600 z-20 p-2 max-h-96 overflow-y-auto">
                                <p className="text-xs font-bold text-slate-400 px-2 mb-2">PROCESSAMENTO DE TEXTO</p>
                                <button onClick={handleCorrectGrammar} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2 rounded">
                                    <CheckCircle className="w-4 h-4" /> Corrigir Gramática
                                </button>
                                <button onClick={handleSummarize} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2 rounded">
                                    <FileText className="w-4 h-4" /> Resumir Texto
                                </button>
                                <button onClick={handleSuggestTitles} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2 rounded">
                                    <BookOpen className="w-4 h-4" /> Sugerir Títulos
                                </button>
                                <button onClick={handleGenerateIllustration} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2 rounded">
                                    <Lightbulb className="w-4 h-4" /> Gerar Ilustração
                                </button>
                                <div className="border-t border-slate-200 dark:border-slate-600 mt-2 pt-2">
                                    <p className="text-xs font-bold text-slate-400 px-2 mb-1">REESCRITA</p>
                                    <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} className="w-full px-2 py-1 text-sm mb-1 rounded">
                                        <option value="formal">Formal</option>
                                        <option value="informal">Informal</option>
                                        <option value="poético">Poético</option>
                                        <option value="pregação">Pregação</option>
                                        <option value="infantil">Infantil</option>
                                        <option value="acadêmico">Acadêmico</option>
                                        <option value="devocional">Devocional</option>
                                    </select>
                                    <button onClick={handleRewrite} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2 rounded">
                                        <FileEdit className="w-4 h-4" /> Reescrever Texto
                                    </button>
                                </div>
                                <div className="border-t border-slate-200 dark:border-slate-600 mt-2 pt-2">
                                    <p className="text-xs font-bold text-slate-400 px-2 mb-1">TRADUÇÃO</p>
                                    <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="w-full px-2 py-1 text-sm mb-1 rounded">
                                        <option value="Inglês">Inglês</option>
                                        <option value="Espanhol">Espanhol</option>
                                        <option value="Francês">Francês</option>
                                        <option value="Alemão">Alemão</option>
                                        <option value="Italiano">Italiano</option>
                                        <option value="Hebraico">Hebraico</option>
                                        <option value="Grego">Grego</option>
                                    </select>
                                    <button onClick={handleTranslate} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2 rounded">
                                        <Languages className="w-4 h-4" /> Traduzir Texto
                                    </button>
                                </div>
                                <div className="border-t border-slate-200 dark:border-slate-600 mt-2 pt-2">
                                    <p className="text-xs font-bold text-slate-400 px-2 mb-1">ESTRUTURA</p>
                                    <button onClick={() => {
                                      const text = getSelectedText();
                                      if (!text) return alert("Selecione um texto");
                                      executeCommand('insertHTML', false, `<h2>Introdução</h2><p>${text.split('.').slice(0, 2).join('.')}.</p><h2>Desenvolvimento</h2><p>Seu conteúdo aqui</p><h2>Conclusão</h2><p>Sua conclusão aqui</p>`);
                                    }} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2 rounded">
                                        <Link2 className="w-4 h-4" /> Criar Estrutura
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {suggestedTitles.length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-700 shadow-xl rounded-lg border border-slate-100 dark:border-slate-600 z-30 p-3">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-slate-400">Títulos Sugeridos</p>
                        <button onClick={() => setSuggestedTitles([])} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                    {suggestedTitles.map((t, i) => (
                        <div key={i} onClick={() => { setTitle(t); setSuggestedTitles([]); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer rounded text-sm text-slate-700 dark:text-slate-200 mb-1">
                            {t}
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-1 p-2 border border-slate-300 dark:border-slate-700 border-b-0 rounded-t-lg bg-slate-50 dark:bg-slate-800">
              <ToolbarButton onClick={() => executeCommand('undo')} icon={<Undo className="w-4 h-4"/>} title="Desfazer (Ctrl+Z)" />
              <ToolbarButton onClick={() => executeCommand('redo')} icon={<Redo className="w-4 h-4"/>} title="Refazer (Ctrl+Y)" />
              <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
              
              <ToolbarButton onClick={() => executeCommand('formatBlock', 'h1')} icon={<Heading1 className="w-4 h-4"/>} title="Título 1" />
              <ToolbarButton onClick={() => executeCommand('formatBlock', 'h2')} icon={<Heading2 className="w-4 h-4"/>} title="Título 2" />
              <ToolbarButton onClick={() => executeCommand('formatBlock', 'h3')} icon={<Heading3 className="w-4 h-4"/>} title="Título 3" />
              <ToolbarButton onClick={() => executeCommand('formatBlock', 'blockquote')} icon={<Quote className="w-4 h-4"/>} title="Citação" />
              <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>

              <ToolbarButton onClick={() => executeCommand('bold')} icon={<Bold className="w-4 h-4"/>} title="Negrito (Ctrl+B)" />
              <ToolbarButton onClick={() => executeCommand('italic')} icon={<Italic className="w-4 h-4"/>} title="Itálico (Ctrl+I)" />
              <ToolbarButton onClick={() => executeCommand('underline')} icon={<Underline className="w-4 h-4"/>} title="Sublinhado (Ctrl+U)" />
              <ToolbarButton onClick={() => executeCommand('strikethrough')} icon={<Strikethrough className="w-4 h-4"/>} title="Tachado" />
              <ToolbarButton onClick={() => executeCommand('superscript')} icon={<Superscript className="w-4 h-4"/>} title="Sobrescrito" />
              <ToolbarButton onClick={() => executeCommand('subscript')} icon={<Subscript className="w-4 h-4"/>} title="Subscrito" />
              <ToolbarButton onClick={() => executeCommand('removeFormat')} icon={<RemoveFormatting className="w-4 h-4"/>} title="Limpar Formatação" />
              <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
              
              <ToolbarButton onClick={() => executeCommand('justifyLeft')} icon={<AlignLeft className="w-4 h-4"/>} title="Esquerda" />
              <ToolbarButton onClick={() => executeCommand('justifyCenter')} icon={<AlignCenter className="w-4 h-4"/>} title="Centro" />
              <ToolbarButton onClick={() => executeCommand('justifyRight')} icon={<AlignRight className="w-4 h-4"/>} title="Direita" />
              <ToolbarButton onClick={() => executeCommand('justifyFull')} icon={<AlignJustify className="w-4 h-4"/>} title="Justificado" />
              <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>

              <ToolbarButton onClick={() => executeCommand('insertUnorderedList')} icon={<List className="w-4 h-4"/>} title="Lista" />
              <ToolbarButton onClick={() => executeCommand('insertOrderedList')} icon={<ListOrdered className="w-4 h-4"/>} title="Lista Numerada" />
              <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
              
              <ToolbarButton onClick={insertImage} icon={<ImageIcon className="w-4 h-4"/>} title="Inserir Imagem" />
              <ToolbarButton onClick={insertVideo} icon={<Video className="w-4 h-4"/>} title="Inserir Vídeo" />
              <ToolbarButton onClick={insertLink} icon={<Link className="w-4 h-4"/>} title="Inserir Link" />
              <ToolbarButton onClick={insertHR} icon={<Minus className="w-4 h-4"/>} title="Linha Horizontal" />
              <ToolbarButton onClick={insertTable} icon={<Palette className="w-4 h-4"/>} title="Tabela" />
              <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>

              {/* Color picker */}
              <div className="relative group">
                <ToolbarButton onClick={() => {}} icon={<Palette className="w-4 h-4"/>} title="Cor do Texto" />
                <div className="absolute left-0 top-full mt-1 hidden group-hover:flex flex-wrap gap-1 p-2 bg-white dark:bg-slate-700 shadow-xl rounded-lg z-30 w-32">
                  {['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'].map(c => (
                    <button key={c} onClick={() => setTextColor(c)} className="w-6 h-6 rounded border border-slate-200" style={{backgroundColor: c}} />
                  ))}
                </div>
              </div>

              {/* Highlight picker */}
              <div className="relative group">
                <ToolbarButton onClick={() => {}} icon={<TypeIcon className="w-4 h-4"/>} title="Destacar Texto" />
                <div className="absolute left-0 top-full mt-1 hidden group-hover:flex flex-wrap gap-1 p-2 bg-white dark:bg-slate-700 shadow-xl rounded-lg z-30 w-32">
                  {['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#f5d0fe', '#ffffff'].map(c => (
                    <button key={c} onClick={() => setHighlight(c)} className="w-6 h-6 rounded border border-slate-300" style={{backgroundColor: c}} />
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Templates Bar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border border-slate-300 dark:border-slate-700 border-t-0 bg-slate-50 dark:bg-slate-800 rounded-b-lg">
              <span className="text-xs text-slate-400 mr-2">Modelos:</span>
              <button onClick={() => insertTemplate('versiculo')} className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200">📖 Versículo</button>
              <button onClick={() => insertTemplate('destaque')} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">💡 Destaque</button>
              <button onClick={() => insertTemplate('alert')} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">⚠️ Alerta</button>
              <button onClick={() => insertTemplate('passo')} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">📝 Passos</button>
              <button onClick={() => insertTemplate('comparacao')} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200">⚖️ Comparação</button>
              <button onClick={insertEmoji} className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200">😀 Emoji</button>
            </div>

            <div
              ref={editorRef}
              contentEditable
              className="w-full px-8 py-8 min-h-[500px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-b-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all serif-font text-lg leading-relaxed rich-editor-content text-black dark:text-slate-100 overflow-y-auto"
              data-placeholder="Comece a escrever ou importe um áudio..."
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium shadow-md transition-all transform active:scale-95 ${
                isProcessing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</> : <><Save className="w-5 h-5" /> {initialEntry ? 'Atualizar Texto' : 'Salvar'}</>}
            </button>
          </div>
        </div>

        <AIAgent 
          editorContent={editorRef.current?.innerText || ''}
          onSuggestionApply={(suggestion) => {
            try {
              const s = JSON.parse(suggestion);
              if (s.type === 'tags') handleSuggestTitles();
              if (s.type === 'summary') handleSummarize();
            } catch (e) {}
          }}
        />
      </div>
    </div>
  );
};

const ToolbarButton: React.FC<{ onClick: () => void; icon: React.ReactNode; title: string }> = ({ onClick, icon, title }) => (
  <button onClick={onClick} title={title} className="p-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 rounded transition-colors">
    {icon}
  </button>
);
