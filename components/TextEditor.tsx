
import React, { useState, useEffect, useRef } from 'react';
import { Save, Sparkles, Loader2, Calendar, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify, Mic, MicOff, Bold, Italic, Underline, List, ListOrdered, Image as ImageIcon, Video, FolderOpen, Clock, Lightbulb, RotateCcw, Upload, Heading1, Heading2, Quote, Undo, Redo, RemoveFormatting } from 'lucide-react';
import { processTextEntry, generateIllustration, transcribeAudioFile } from '../services/geminiService';
import { TextEntry, Collection } from '../types';

interface TextEditorProps {
  onSave: (entry: TextEntry) => void;
  collections: Collection[];
}

export const TextEditor: React.FC<TextEditorProps> = ({ onSave, collections }) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribingFile, setIsTranscribingFile] = useState(false);
  const [illustrationLoading, setIllustrationLoading] = useState(false);
  const [previousVersions, setPreviousVersions] = useState<{timestamp: number, body: string, title: string}[]>([]);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save sketch version every 30s (simulated logic for "History")
  useEffect(() => {
    const interval = setInterval(() => {
        if (title && editorRef.current?.innerHTML) {
            setPreviousVersions(prev => {
                const newHistory = [{
                    timestamp: Date.now(),
                    title,
                    body: editorRef.current?.innerHTML || ''
                }, ...prev].slice(0, 3); // Keep only last 3
                return newHistory;
            });
        }
    }, 60000); // Every minute
    return () => clearInterval(interval);
  }, [title]);

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
        id: crypto.randomUUID(),
        originalTitle: title,
        originalBody: bodyContent,
        correctedTitle: processed.correctedTitle,
        correctedBody: processed.correctedBody,
        summary: processed.summary,
        tags: processed.tags,
        bibleCitations: processed.bibleCitations || [],
        creationDate: date,
        savedAt: Date.now(),
        isFavorite: false,
        collectionId: selectedCollection,
        versions: previousVersions
      };

      onSave(newEntry);
      setTitle('');
      if (editorRef.current) editorRef.current.innerHTML = '';
      setPreviousVersions([]);
      alert("Texto salvo e organizado!");
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8 transition-colors">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Sparkles className="text-indigo-500 w-6 h-6" />
            Novo Texto
          </h2>
          
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
                </label>
                <div className="flex gap-2">
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
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-1 p-2 border border-slate-300 dark:border-slate-700 border-b-0 rounded-t-lg bg-slate-50 dark:bg-slate-800">
              <ToolbarButton onClick={() => executeCommand('undo')} icon={<Undo className="w-4 h-4"/>} title="Desfazer" />
              <ToolbarButton onClick={() => executeCommand('redo')} icon={<Redo className="w-4 h-4"/>} title="Refazer" />
              <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
              
              <ToolbarButton onClick={() => executeCommand('formatBlock', 'h1')} icon={<Heading1 className="w-4 h-4"/>} title="Título 1" />
              <ToolbarButton onClick={() => executeCommand('formatBlock', 'h2')} icon={<Heading2 className="w-4 h-4"/>} title="Título 2" />
              <ToolbarButton onClick={() => executeCommand('formatBlock', 'blockquote')} icon={<Quote className="w-4 h-4"/>} title="Citação" />
              <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>

              <ToolbarButton onClick={() => executeCommand('bold')} icon={<Bold className="w-4 h-4"/>} title="Negrito" />
              <ToolbarButton onClick={() => executeCommand('italic')} icon={<Italic className="w-4 h-4"/>} title="Itálico" />
              <ToolbarButton onClick={() => executeCommand('underline')} icon={<Underline className="w-4 h-4"/>} title="Sublinhado" />
              <ToolbarButton onClick={() => executeCommand('removeFormat')} icon={<RemoveFormatting className="w-4 h-4"/>} title="Remover Formatação (Selecionar Texto)" />
              <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
              
              <ToolbarButton onClick={() => executeCommand('justifyLeft')} icon={<AlignLeft className="w-4 h-4"/>} title="Esquerda" />
              <ToolbarButton onClick={() => executeCommand('justifyCenter')} icon={<AlignCenter className="w-4 h-4"/>} title="Centro" />
              <ToolbarButton onClick={() => executeCommand('justifyRight')} icon={<AlignRight className="w-4 h-4"/>} title="Direita" />
              <ToolbarButton onClick={() => executeCommand('justifyFull')} icon={<AlignJustify className="w-4 h-4"/>} title="Justificado" />
              <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>

              <ToolbarButton onClick={() => executeCommand('insertUnorderedList')} icon={<List className="w-4 h-4"/>} title="Lista" />
              <ToolbarButton onClick={() => executeCommand('insertOrderedList')} icon={<ListOrdered className="w-4 h-4"/>} title="Numérica" />
              <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
              <ToolbarButton onClick={insertImage} icon={<ImageIcon className="w-4 h-4"/>} title="Imagem" />
              <ToolbarButton onClick={insertVideo} icon={<Video className="w-4 h-4"/>} title="Vídeo" />
            </div>

            <div
              ref={editorRef}
              contentEditable
              className="w-full px-8 py-8 min-h-[500px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-b-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all serif-font text-lg leading-relaxed rich-editor-content text-slate-950 dark:text-slate-100 overflow-y-auto"
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
              {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</> : <><Save className="w-5 h-5" /> Salvar</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToolbarButton: React.FC<{ onClick: () => void; icon: React.ReactNode; title: string }> = ({ onClick, icon, title }) => (
  <button onClick={onClick} title={title} className="p-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 rounded transition-colors">
    {icon}
  </button>
);
