
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Calendar, Tag, BookOpen, ChevronDown, ChevronUp, Hash, BookMarked, Download, FileText, File, Star, Volume2, Share2, LayoutGrid, LayoutList, Folder, Presentation, Link as LinkIcon, HelpCircle, Loader2, Trash2, Edit, ArrowUpDown, CalendarSearch, Filter, X, Sun, Minus, Plus, List, Clock, ArrowLeft } from 'lucide-react';
import { TextEntry, Collection, Slide } from '../types';
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';
import { generateSlides, getTheologicalDefinition } from '../services/aiService';

interface LibraryProps {
  entries: TextEntry[];
  collections: Collection[];
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (entry: TextEntry) => void;
  accentColor?: string;
}

type SortOption = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'favorites';
type ViewMode = 'grid' | 'list';

export const Library: React.FC<LibraryProps> = ({ entries, collections, onToggleFavorite, onDelete, onEdit, accentColor = 'indigo' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [modalEntry, setModalEntry] = useState<TextEntry | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [sepiaMode, setSepiaMode] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showToc, setShowToc] = useState(false);
  const [tocHeadings, setTocHeadings] = useState<{id: string; text: string; level: number}[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    entries.forEach(entry => {
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [entries]);

const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const correctedTitle = entry.correctedTitle || entry.originalTitle || '';
      const correctedBody = entry.correctedBody || entry.originalBody || '';
      const tags = Array.isArray(entry.tags) ? entry.tags : [];

      const matchesTerm = searchTerm === '' || 
        correctedTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        correctedBody.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTag = selectedTag === '' || tags.includes(selectedTag);
      const matchesCollection = selectedCollection === '' || entry.collectionId === selectedCollection;
      const matchesFav = onlyFavorites ? entry.isFavorite : true;
      
      const entryDate = new Date(entry.creationDate);
      const matchesDateFrom = !dateFrom || entryDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || entryDate <= new Date(dateTo);
 
      return matchesTerm && matchesTag && matchesCollection && matchesFav && matchesDateFrom && matchesDateTo;
    }).sort((a, b) => {
      const titleA = a.correctedTitle || a.originalTitle || '';
      const titleB = b.correctedTitle || b.originalTitle || '';
      switch(sortBy) {
        case 'date-desc': return new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime();
        case 'date-asc': return new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime();
        case 'title-asc': return titleA.localeCompare(titleB);
        case 'title-desc': return titleB.localeCompare(titleA);
        case 'favorites': return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
        default: return 0;
      }
    });
  }, [entries, searchTerm, selectedTag, selectedCollection, onlyFavorites, dateFrom, dateTo, sortBy]);

  // Slides State
  const [showSlidesModal, setShowSlidesModal] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loadingSlides, setLoadingSlides] = useState(false);

  // Dictionary State
  const [selectedWord, setSelectedWord] = useState('');
  const [definition, setDefinition] = useState('');
  const [definitionLoading, setDefinitionLoading] = useState(false);
  const [showDefPopup, setShowDefPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({x:0, y:0});

  useEffect(() => {
    const handleSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0 && modalEntry) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setPopupPos({ x: rect.left + window.scrollX, y: rect.top + window.scrollY - 40 });
            setSelectedWord(selection.toString());
            if (!showDefPopup) setShowDefPopup(true);
        } else {
            if(!definitionLoading && !definition) setShowDefPopup(false);
        }
    };
    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [modalEntry, definitionLoading, definition, showDefPopup]);

  const handleDefineTerm = async () => {
      if(!selectedWord) return;
      setDefinitionLoading(true);
      const def = await getTheologicalDefinition(selectedWord, "Contexto bíblico/teológico geral");
      setDefinition(def);
      setDefinitionLoading(false);
  };

  const closeDefinition = () => {
      setShowDefPopup(false);
      setDefinition('');
      setSelectedWord('');
  };

  const exportToPDF = async (entry: TextEntry) => {
    const tempContainer = document.createElement('div');
    tempContainer.className = 'pdf-export-container'; 
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '-10000px';
    tempContainer.style.left = '0';
    
    tempContainer.innerHTML = `
      <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 10px;">${entry.correctedTitle || entry.originalTitle || ''}</h1>
      <p style="color: #666; font-size: 12px; margin-bottom: 20px;">
         Luciano's Scribe • ${new Date(entry.creationDate).toLocaleDateString('pt-BR')}
         ${entry.summary ? '<br>' + entry.summary : ''}
      </p>
      <hr style="border: none; border-top: 1px solid #ddd; margin-bottom: 30px;" />
      <div class="rich-content" style="font-size: 14px; line-height: 1.6; color: #1a1a1a;">
         ${entry.correctedBody || entry.originalBody || ''}
      </div>
    `;
    
    document.body.appendChild(tempContainer);

    try {
        const canvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        const pdfName = (entry.correctedTitle || entry.originalTitle || 'texto').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        pdf.save(`${pdfName}.pdf`);
    } catch (err) {
        console.error("PDF Export Error:", err);
        alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
        document.body.removeChild(tempContainer);
    }
  };

  const handleShare = (entry: TextEntry) => {
    if(confirm(`Gerar link público para "${entry.correctedTitle}"?\n(Simulação: Link copiado)`)) {
        navigator.clipboard.writeText(`${window.location.origin}/share/${entry.id}`);
    }
  };

  const handleDelete = (entry: TextEntry) => {
      if (confirm(`Tem certeza que deseja excluir "${entry.correctedTitle}"? Esta ação não pode ser desfeita.`)) {
          onDelete(entry.id);
          setModalEntry(null);
      }
  };

  const handleGenerateSlides = async (entry: TextEntry) => {
      setLoadingSlides(true);
      setShowSlidesModal(true);
      
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = entry.correctedBody;
      const text = tempDiv.innerText;

      const generated = await generateSlides(text);
      setSlides(generated);
      setLoadingSlides(false);
  };

  const speakText = (textHTML: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = textHTML;
    const text = tempDiv.innerText;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    window.speechSynthesis.speak(utterance);
  };

  const getCollectionName = (id?: string) => collections.find(c => c.id === id)?.name;

  const getRelatedTexts = (currentEntry: TextEntry) => {
      const currentTags = Array.isArray(currentEntry.tags) ? currentEntry.tags : [];
      return entries.filter(e => 
          e.id !== currentEntry.id && 
          Array.isArray(e.tags) &&
          e.tags.some(t => currentTags.includes(t))
      ).slice(0, 3);
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.innerText || '';
  };

  const readingTime = useMemo(() => {
    if (!modalEntry) return 0;
    const text = stripHtml(modalEntry.correctedBody || modalEntry.originalBody || '');
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [modalEntry]);

  const contentHtml = useMemo(() => {
    if (!modalEntry) return '';
    const body = modalEntry.correctedBody || modalEntry.originalBody || '';
    let counter = 0;
    const headingRe = new RegExp('<(' + ['h1','h2','h3','h4'].join('|') + ')(\\b[^>]*)?>(.*?)<' + '/' + '\\1>', 'gi');
    return body.replace(headingRe, (match, tag, attrs, content) => {
      const attrsStr = attrs || '';
      return '<' + tag + attrsStr + ' id="heading-' + counter++ + '">' + content + '<' + '/' + tag + '>';
    });
  }, [modalEntry]);

  useEffect(() => {
    if (!modalEntry) return;
    const body = modalEntry.correctedBody || modalEntry.originalBody || '';
    const div = document.createElement('div');
    div.innerHTML = body;
    const headingElements = div.querySelectorAll('h1, h2, h3, h4');
    const extracted = Array.from(headingElements).map((h, i) => ({
      id: `heading-${i}`,
      text: (h.textContent || '').trim(),
      level: parseInt(h.tagName[1])
    }));
    setTocHeadings(extracted);
    setReadingProgress(0);
  }, [modalEntry]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalEntry) setModalEntry(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [modalEntry]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const scrollable = el.scrollHeight - el.clientHeight;
    if (scrollable <= 0) { setReadingProgress(100); return; }
    setReadingProgress(Math.min(100, Math.round((el.scrollTop / scrollable) * 100)));
  }, []);

  const scrollToHeading = (id: string) => {
    const el = scrollRef.current?.querySelector(`#${CSS.escape(id)}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShowToc(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-[#DEE3EA] dark:border-slate-700 sticky top-4 z-10 transition-colors">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
            <div className="flex items-center gap-3">
                <h3 className="font-display text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200">Biblioteca</h3>
                <span className="text-xs text-slate-400">({filteredEntries.length} textos)</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="bg-[#F0F2F5] dark:bg-slate-700 border-0 text-xs rounded-md px-2 py-1.5 text-slate-600 dark:text-slate-300">
                    <option value="date-desc">Mais Recentes</option>
                    <option value="date-asc">Mais Antigos</option>
                    <option value="title-asc">A-Z</option>
                    <option value="title-desc">Z-A</option>
                    <option value="favorites">Favoritos</option>
                </select>
                
                <div className="flex items-center gap-1 bg-[#F0F2F5] dark:bg-slate-700 p-1 rounded-md">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid className="w-4 h-4"/></button>
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-slate-400'}`}><LayoutList className="w-4 h-4"/></button>
                </div>
                
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${showFilters ? 'bg-[#E8EFFC] text-[#2C5AC7]' : 'bg-[#F0F2F5] dark:bg-slate-700 text-slate-500'}`}
                >
                    <Filter className="w-3 h-3" /> Filtros
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="h-5 w-5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar títulos, conteúdo ou tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-[#F8FAFD] dark:bg-slate-900 border border-[#DEE3EA] dark:border-slate-700 rounded-md text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3B6FE0]"
            />
          </div>
          
          <select value={selectedCollection} onChange={(e) => setSelectedCollection(e.target.value)} className="bg-[#F8FAFD] dark:bg-slate-900 border border-[#DEE3EA] dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-md px-3 py-2 outline-none">
             <option value="">Todos os Estudos</option>
             {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} className="bg-[#F8FAFD] dark:bg-slate-900 border border-[#DEE3EA] dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-md px-3 py-2 outline-none">
              <option value="">Todas as Tags</option>
              {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        </div>
        
        {showFilters && (
            <div className="mt-4 pt-4 border-t border-[#DEE3EA] dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Data Início</label>
                    <div className="relative">
                        <CalendarSearch className="h-4 w-4 text-slate-400 absolute left-2 top-2.5 pointer-events-none" />
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full pl-8 pr-2 py-1.5 text-sm bg-[#F8FAFD] dark:bg-slate-900 border border-[#DEE3EA] dark:border-slate-700 rounded" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Data Fim</label>
                    <div className="relative">
                        <CalendarSearch className="h-4 w-4 text-slate-400 absolute left-2 top-2.5 pointer-events-none" />
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full pl-8 pr-2 py-1.5 text-sm bg-[#F8FAFD] dark:bg-slate-900 border border-[#DEE3EA] dark:border-slate-700 rounded" />
                    </div>
                </div>
                <button 
                    onClick={() => setOnlyFavorites(!onlyFavorites)}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${onlyFavorites ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-[#F0F2F5] dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                >
                    <Star className={`w-4 h-4 ${onlyFavorites ? 'fill-current' : ''}`} />
                    {onlyFavorites ? 'Apenas Favoritos' : 'Favoritos'}
                </button>
                <button 
                    onClick={() => { setSearchTerm(''); setSelectedTag(''); setSelectedCollection(''); setOnlyFavorites(false); setDateFrom(''); setDateTo(''); setSortBy('date-desc'); }}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm text-slate-500 hover:bg-[#F0F2F5] dark:hover:bg-slate-700"
                >
                    <X className="w-4 h-4" /> Limpar Filtros
                </button>
            </div>
        )}
      </div>

      {/* Bento Grid Results */}
      <div className={`grid gap-3 sm:gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
        {filteredEntries.map((entry) => (
          <div key={entry.id} className="bg-white dark:bg-slate-800 rounded-lg border border-[#DEE3EA] dark:border-slate-700/50 overflow-hidden transition-all duration-200 hover:border-[#3B6FE0] hover:shadow-md cursor-pointer"
            onClick={() => setModalEntry(entry)}>
            <div className="p-4 sm:p-5">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3"/> {new Date(entry.creationDate).toLocaleDateString('pt-BR')}
                    </span>
                    {entry.collectionId && (
                      <span className="text-[10px] font-semibold bg-[#E8EFFC] dark:bg-indigo-900 text-[#2C5AC7] dark:text-indigo-300 px-2 py-0.5 rounded flex items-center gap-1">
                        <Folder className="w-3 h-3"/> {getCollectionName(entry.collectionId)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-1 leading-snug">{entry.correctedTitle || entry.originalTitle}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{entry.summary || "Sem resumo disponível."}</p>
                  
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {Array.isArray(entry.tags) && entry.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] font-semibold bg-[#F0F2F5] dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">#{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(entry.id); }}
                    className={`p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600 ${entry.isFavorite ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}>
                    <Star className={`w-5 h-5 ${entry.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredEntries.length === 0 && <div className="text-center py-20 text-slate-400 col-span-full">Nenhum texto encontrado.</div>}
      </div>

      {/* Text Reader Modal */}
      {modalEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setModalEntry(null)}
        >
          <div
            className={`bg-white dark:bg-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col min-h-[70vh] max-h-[calc(100vh-2rem)] animate-scale-in ${sepiaMode ? 'sepia-bg' : ''}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Reading Progress Bar */}
            <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-0 overflow-hidden shrink-0">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-150 ease-out"
                style={{ width: `${readingProgress}%` }}
              />
            </div>

            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#DEE3EA] dark:border-slate-700 flex items-start justify-between gap-4 bg-gradient-to-br from-white via-slate-50/80 to-indigo-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-indigo-950/20 rounded-t-2xl">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(modalEntry.creationDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {modalEntry.collectionId && (
                    <span className="text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Folder className="w-3 h-3"/> {getCollectionName(modalEntry.collectionId)}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2 ml-0.5">
                    <Clock className="w-3 h-3"/> {readingTime} min de leitura
                  </span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                  {modalEntry.correctedTitle || modalEntry.originalTitle}
                </h2>
                {modalEntry.summary && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{modalEntry.summary}</p>
                )}
              </div>
              <button
                onClick={() => setModalEntry(null)}
                className="shrink-0 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all"
                title="Fechar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Actions */}
            <div className="px-5 sm:px-6 py-3 border-b border-[#DEE3EA] dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-wrap gap-2 justify-between items-center shrink-0">
              <div className="flex gap-2 flex-wrap items-center">
                <button
                  onClick={() => speakText(modalEntry.correctedBody || modalEntry.originalBody || '')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 rounded-lg hover:bg-[#3B6FE0] hover:text-white dark:hover:bg-[#3B6FE0] transition-all"
                >
                  <Volume2 className="w-3.5 h-3.5"/> Ouvir
                </button>
                <button
                  onClick={() => handleGenerateSlides(modalEntry)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 rounded-lg hover:bg-[#3B6FE0] hover:text-white dark:hover:bg-[#3B6FE0] transition-all"
                >
                  <Presentation className="w-3.5 h-3.5"/> Slides
                </button>

                {/* Font Size Controls */}
                <div className="flex items-center gap-0.5 bg-white dark:bg-slate-700 rounded-lg border border-[#DEE3EA] dark:border-slate-600 px-1 py-0.5">
                  <button
                    onClick={() => setFontSize(s => Math.max(14, s - 1))}
                    className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-white disabled:opacity-30 transition-all"
                    disabled={fontSize <= 14}
                    title="Diminuir fonte"
                  >
                    <Minus className="w-3 h-3"/>
                  </button>
                  <span className="text-[10px] font-mono text-slate-400 min-w-[18px] text-center select-none">{fontSize}</span>
                  <button
                    onClick={() => setFontSize(s => Math.min(24, s + 1))}
                    className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-white disabled:opacity-30 transition-all"
                    disabled={fontSize >= 24}
                    title="Aumentar fonte"
                  >
                    <Plus className="w-3 h-3"/>
                  </button>
                </div>

                {/* Sepia Toggle */}
                <button
                  onClick={() => setSepiaMode(s => !s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    sepiaMode
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-transparent'
                  }`}
                  title="Modo Sépia"
                >
                  <Sun className="w-3.5 h-3.5"/> Sépia
                </button>

                {/* TOC Toggle */}
                {tocHeadings.length > 0 && (
                  <button
                    onClick={() => setShowToc(s => !s)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      showToc
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-transparent'
                    }`}
                    title="Sumário"
                  >
                    <List className="w-3.5 h-3.5"/> Sumário
                  </button>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => { onEdit(modalEntry); setModalEntry(null); }}
                  className="p-2 text-slate-500 hover:text-[#3B6FE0] hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                  title="Editar"
                >
                  <Edit className="w-4 h-4"/>
                </button>
                <button
                  onClick={() => handleShare(modalEntry)}
                  className="p-2 text-slate-500 hover:text-[#3B6FE0] hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                  title="Compartilhar"
                >
                  <Share2 className="w-4 h-4"/>
                </button>
                <button
                  onClick={() => exportToPDF(modalEntry)}
                  className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                  title="Exportar PDF"
                >
                  <FileText className="w-4 h-4"/>
                </button>
                <button
                  onClick={() => handleDelete(modalEntry)}
                  className="p-2 text-slate-500 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>
            </div>

            {/* Modal Body with TOC */}
            <div className="flex flex-1 overflow-hidden">
              {/* TOC Sidebar - Desktop */}
              {showToc && tocHeadings.length > 0 && (
                <div className="hidden md:block w-56 shrink-0 border-r border-[#DEE3EA] dark:border-slate-700 overflow-y-auto bg-slate-50/80 dark:bg-slate-800/80">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <List className="w-4 h-4 text-[#3B6FE0]" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Sumário</span>
                    </div>
                    <nav className="space-y-0.5">
                      {tocHeadings.map(h => (
                        <button
                          key={h.id}
                          onClick={() => scrollToHeading(h.id)}
                          className={`block w-full text-left py-1 text-xs leading-snug transition-colors hover:text-[#3B6FE0] dark:hover:text-indigo-400 ${
                            h.level === 1
                              ? 'pl-0 font-semibold text-slate-700 dark:text-slate-200'
                              : h.level === 2
                              ? 'pl-3 text-slate-500 dark:text-slate-400'
                              : 'pl-6 text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {h.text}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              )}

              {/* TOC Overlay - Mobile */}
              {showToc && tocHeadings.length > 0 && (
                <div
                  className="fixed inset-0 z-40 bg-black/30 md:hidden"
                  onClick={() => setShowToc(false)}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-800 shadow-xl animate-slide-in-left"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="p-4 border-b border-[#DEE3EA] dark:border-slate-700 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sumário</span>
                      <button
                        onClick={() => setShowToc(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                      >
                        <ArrowLeft className="w-4 h-4"/>
                      </button>
                    </div>
                    <nav className="p-4 space-y-1 overflow-y-auto max-h-[80vh]">
                      {tocHeadings.map(h => (
                        <button
                          key={h.id}
                          onClick={() => scrollToHeading(h.id)}
                          className={`block w-full text-left py-1.5 text-sm leading-snug text-slate-600 dark:text-slate-400 hover:text-[#3B6FE0] dark:hover:text-indigo-400 transition-colors ${
                            h.level === 1 ? 'font-semibold' : h.level === 2 ? 'pl-3' : 'pl-6'
                          }`}
                        >
                          {h.text}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              )}

              {/* Content Area */}
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className={`flex-1 overflow-y-auto transition-colors duration-300 ${
                  sepiaMode ? 'bg-amber-50' : 'bg-white dark:bg-slate-800'
                }`}
              >
                <div className="p-5 sm:p-8">
                  {/* Dictionary Popup */}
                  {showDefPopup && selectedWord && (
                    <div
                      className="absolute z-50 bg-white dark:bg-slate-800 shadow-xl rounded-md border border-[#DEE3EA] dark:border-slate-700 p-3 max-w-xs"
                      style={{ top: popupPos.y, left: popupPos.x }}
                    >
                      {!definition ? (
                        <button onClick={handleDefineTerm} className="flex items-center gap-2 text-[#3B6FE0] dark:text-indigo-400 font-semibold text-sm hover:underline">
                          {definitionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <BookOpen className="w-4 h-4"/>}
                          Definir "{selectedWord.length > 15 ? selectedWord.substring(0,12)+'...' : selectedWord}"?
                        </button>
                      ) : (
                        <div>
                          <h5 className="font-display font-semibold text-slate-800 dark:text-white text-sm mb-1">{selectedWord}</h5>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{definition}</p>
                          <button onClick={closeDefinition} className="mt-2 text-xs text-slate-400 hover:text-slate-600 underline">Fechar</button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div
                    className="serif-font leading-relaxed rich-content"
                    style={{ fontSize: `${fontSize}px` }}
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                  />

                  {/* Tags */}
                  {Array.isArray(modalEntry.tags) && modalEntry.tags.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-[#DEE3EA] dark:border-slate-700">
                      <div className="flex gap-2 flex-wrap">
                        {modalEntry.tags.map(tag => (
                          <span key={tag} className="text-xs font-semibold bg-[#F0F2F5] dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bible Citations */}
                  {Array.isArray(modalEntry.bibleCitations) && modalEntry.bibleCitations.length > 0 && (
                    <div className="mt-8 bg-gradient-to-br from-[#FDEEE3] to-[#FFF8F0] dark:from-slate-900/70 dark:to-slate-900/30 border border-[#F6D4B8] dark:border-slate-700 rounded-xl p-5 sm:p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-[#B8431A]/10 dark:bg-amber-900/30 rounded-lg">
                          <BookMarked className="w-5 h-5 text-[#B8431A] dark:text-amber-500"/>
                        </div>
                        <div>
                          <h4 className="font-display font-semibold text-[#B8431A] dark:text-amber-400">Referências Bíblicas</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-500">{modalEntry.bibleCitations.length} citação{(modalEntry.bibleCitations.length > 1 ? 'ões' : '')}</p>
                        </div>
                      </div>
                      <div className="grid gap-3">
                        {modalEntry.bibleCitations.map((c, idx) => (
                          <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-[#F6D4B8] dark:border-slate-700 flex gap-3">
                            <div className="shrink-0 w-1 bg-[#B8431A] dark:bg-amber-600 rounded-full self-stretch"/>
                            <div>
                              <p className="text-xs font-bold text-[#B8431A] dark:text-amber-400 uppercase tracking-wide mb-1">{c.reference}</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">"{c.text}"</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Related Texts */}
                  {getRelatedTexts(modalEntry).length > 0 && (
                    <div className="mt-6 bg-gradient-to-br from-[#E8EFFC] to-[#F0F4FE] dark:from-slate-900/70 dark:to-slate-900/30 border border-[#C7D9F7] dark:border-slate-700 rounded-xl p-5 sm:p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-[#2C5AC7]/10 dark:bg-indigo-900/30 rounded-lg">
                          <LinkIcon className="w-4 h-4 text-[#2C5AC7] dark:text-indigo-400"/>
                        </div>
                        <h4 className="font-display font-semibold text-[#2C5AC7] dark:text-indigo-400">Textos Relacionados</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {getRelatedTexts(modalEntry).map(rel => (
                          <div key={rel.id} onClick={() => setModalEntry(rel)}
                            className="cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-[#C7D9F7] dark:border-slate-700 hover:shadow-md hover:border-[#3B6FE0] transition-all"
                          >
                            <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{rel.correctedTitle || rel.originalTitle}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(rel.creationDate).toLocaleDateString()} • {
                                (Array.isArray(rel.tags) && Array.isArray(modalEntry.tags))
                                  ? rel.tags.filter(t => modalEntry.tags.includes(t)).join(', ')
                                  : ''
                              }
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-8 pt-4 text-center text-[10px] text-slate-400 dark:text-slate-600 border-t border-[#DEE3EA] dark:border-slate-700/50">
                    <span className="flex items-center justify-center gap-1.5">
                      <BookOpen className="w-3 h-3"/> {readingTime} min de leitura • {new Date(modalEntry.creationDate).toLocaleDateString('pt-BR')}
                      {modalEntry.collectionId && <> • {getCollectionName(modalEntry.collectionId)}</>}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide Modal */}
      {showSlidesModal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-[#DEE3EA] dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-display font-semibold text-lg dark:text-white flex items-center gap-2"><Presentation className="w-5 h-5 text-[#3B6FE0]"/> Gerador de Slides (IA)</h3>
              <button onClick={() => setShowSlidesModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Fechar</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F3F5F8] dark:bg-slate-900">
              {loadingSlides ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-2"/>
                  <p>Criando estrutura de slides...</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {slides.map((slide, idx) => (
                    <div key={idx} className="aspect-video bg-white dark:bg-slate-800 rounded-xl p-6 sm:p-8 flex flex-col justify-center border border-[#DEE3EA] dark:border-slate-700 shadow-sm">
                      <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#3B6FE0] dark:text-indigo-400 mb-4">{slide.title}</h2>
                      <ul className="list-disc pl-6 space-y-2">
                        {slide.points.map((p, i) => (
                          <li key={i} className="text-base sm:text-lg text-slate-700 dark:text-slate-300">{p}</li>
                        ))}
                      </ul>
                      <div className="mt-auto pt-4 text-xs text-slate-400 text-right">Slide {idx + 1}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};