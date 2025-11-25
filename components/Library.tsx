
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Calendar, Tag, BookOpen, ChevronDown, ChevronUp, Hash, BookMarked, Download, FileText, File, Star, Volume2, Share2, LayoutGrid, LayoutList, Folder, Presentation, Link as LinkIcon, HelpCircle, Loader2, Trash2, Edit } from 'lucide-react';
import { TextEntry, Collection, Slide } from '../types';
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';
import { generateSlides, getTheologicalDefinition } from '../services/geminiService';

interface LibraryProps {
  entries: TextEntry[];
  collections: Collection[];
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (entry: TextEntry) => void;
}

export const Library: React.FC<LibraryProps> = ({ entries, collections, onToggleFavorite, onDelete, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  
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

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    entries.forEach(entry => entry.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesTerm = searchTerm === '' || 
        entry.correctedTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.correctedBody.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = selectedTag === '' || entry.tags.includes(selectedTag);
      const matchesCollection = selectedCollection === '' || entry.collectionId === selectedCollection;
      const matchesFav = onlyFavorites ? entry.isFavorite : true;

      return matchesTerm && matchesTag && matchesCollection && matchesFav;
    }).sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
  }, [entries, searchTerm, selectedTag, selectedCollection, onlyFavorites]);

  // Handle Text Selection for Dictionary
  useEffect(() => {
    const handleSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0 && expandedId) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setPopupPos({ x: rect.left + window.scrollX, y: rect.top + window.scrollY - 40 });
            setSelectedWord(selection.toString());
            // Only show button if not already showing full definition
            if (!showDefPopup) setShowDefPopup(true);
        } else {
            if(!definitionLoading && !definition) setShowDefPopup(false);
        }
    };
    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [expandedId, definitionLoading, definition, showDefPopup]);

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
    // 1. Create a temporary container for rendering
    const tempContainer = document.createElement('div');
    // Styling to match A4 visual logic
    tempContainer.className = 'pdf-export-container'; 
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '-10000px';
    tempContainer.style.left = '0';
    
    // Add content
    tempContainer.innerHTML = `
      <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 10px;">${entry.correctedTitle}</h1>
      <p style="color: #666; font-size: 12px; margin-bottom: 20px;">
         Luciano's Scribe • ${new Date(entry.creationDate).toLocaleDateString('pt-BR')}
         ${entry.summary ? '<br>' + entry.summary : ''}
      </p>
      <hr style="border: none; border-top: 1px solid #ddd; margin-bottom: 30px;" />
      <div class="rich-content" style="font-size: 14px; line-height: 1.6; color: #1a1a1a;">
         ${entry.correctedBody}
      </div>
    `;
    
    document.body.appendChild(tempContainer);

    try {
        const canvas = await html2canvas(tempContainer, {
            scale: 2, // Improve quality
            useCORS: true // Attempt to load cross-origin images
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;
        
        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        // Multi-page logic if content is long
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save(`${entry.correctedTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    } catch (err) {
        console.error("PDF Export Error:", err);
        alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
        document.body.removeChild(tempContainer);
    }
  };

  const handleShare = (entry: TextEntry) => {
    const shareData = {
        title: entry.correctedTitle,
        text: entry.summary || "Confira este texto no Luciano's Scribe",
        url: window.location.href 
    };
    if(confirm(`Gerar link público para "${entry.correctedTitle}"?\n(Simulação: Link copiado)`)) {
        navigator.clipboard.writeText(`${window.location.origin}/share/${entry.id}`);
    }
  };

  const handleDelete = (entry: TextEntry) => {
      if (confirm(`Tem certeza que deseja excluir "${entry.correctedTitle}"? Esta ação não pode ser desfeita.`)) {
          onDelete(entry.id);
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
      return entries.filter(e => 
          e.id !== currentEntry.id && 
          e.tags.some(t => currentEntry.tags.includes(t))
      ).slice(0, 3);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative">
      {/* Definition Popup */}
      {showDefPopup && selectedWord && (
          <div 
            className="absolute z-50 bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-indigo-100 dark:border-slate-600 p-3 max-w-xs animate-in zoom-in-95 duration-200"
            style={{ top: popupPos.y, left: popupPos.x }}
          >
              {!definition ? (
                  <button onClick={handleDefineTerm} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline">
                    {definitionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <BookOpen className="w-4 h-4"/>}
                    Definir "{selectedWord.length > 15 ? selectedWord.substring(0,12)+'...' : selectedWord}"?
                  </button>
              ) : (
                  <div>
                      <h5 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{selectedWord}</h5>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{definition}</p>
                      <button onClick={closeDefinition} className="mt-2 text-xs text-slate-400 hover:text-slate-600 underline">Fechar</button>
                  </div>
              )}
          </div>
      )}

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 sticky top-4 z-10 transition-colors">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Biblioteca</h3>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                <button onClick={() => setViewMode('card')} className={`p-2 rounded ${viewMode === 'card' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid className="w-4 h-4"/></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-slate-400'}`}><LayoutList className="w-4 h-4"/></button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="h-5 w-5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <select value={selectedCollection} onChange={(e) => setSelectedCollection(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2 outline-none">
             <option value="">Todos os Estudos</option>
             {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2 outline-none">
              <option value="">Todas as Tags</option>
              {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        </div>
        
        <div className="mt-4 flex items-center">
            <button 
                onClick={() => setOnlyFavorites(!onlyFavorites)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${onlyFavorites ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
            >
                <Star className={`w-3 h-3 ${onlyFavorites ? 'fill-current' : ''}`} />
                {onlyFavorites ? 'Exibindo Favoritos' : 'Filtrar Favoritos'}
            </button>
        </div>
      </div>

      {/* Results */}
      <div className={`grid gap-4 ${viewMode === 'card' ? 'grid-cols-1' : 'grid-cols-1'}`}>
        {filteredEntries.map(entry => (
            <div key={entry.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all hover:shadow-md">
                <div 
                    className="p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                >
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3"/> {new Date(entry.creationDate).toLocaleDateString('pt-BR')}
                                </span>
                                {entry.collectionId && (
                                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Folder className="w-3 h-3"/> {getCollectionName(entry.collectionId)}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{entry.correctedTitle}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{entry.summary || "Sem resumo disponível."}</p>
                            
                            <div className="flex gap-2 mt-3">
                                {entry.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">#{tag}</span>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 pl-4">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggleFavorite(entry.id); }}
                                className={`p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600 ${entry.isFavorite ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                            >
                                <Star className={`w-5 h-5 ${entry.isFavorite ? 'fill-current' : ''}`} />
                            </button>
                            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedId === entry.id ? 'rotate-180' : ''}`} />
                        </div>
                    </div>
                </div>

                {/* Expanded Content */}
                {expandedId === entry.id && (
                    <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                        {/* Action Bar */}
                        <div className="flex flex-wrap gap-2 justify-between items-center mb-6 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <div className="flex gap-3">
                                <button onClick={() => speakText(entry.correctedBody)} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600">
                                    <Volume2 className="w-4 h-4"/> Ouvir
                                </button>
                                <button onClick={() => handleGenerateSlides(entry)} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600">
                                    <Presentation className="w-4 h-4"/> Gerar Slides
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onEdit(entry)} className="p-2 text-indigo-600 hover:bg-white rounded" title="Editar Texto"><Edit className="w-4 h-4"/></button>
                                <button onClick={() => handleShare(entry)} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white rounded" title="Compartilhar Link"><Share2 className="w-4 h-4"/></button>
                                <button onClick={() => exportToPDF(entry)} className="p-2 text-indigo-600 hover:bg-white rounded" title="Exportar PDF Organizado"><FileText className="w-4 h-4"/></button>
                                <button onClick={() => handleDelete(entry)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Excluir Texto"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="prose prose-lg dark:prose-invert max-w-none serif-font leading-relaxed rich-content mb-8 text-black dark:text-slate-200" dangerouslySetInnerHTML={{ __html: entry.correctedBody }} />

                        {/* Cross Referencing */}
                        {getRelatedTexts(entry).length > 0 && (
                            <div className="mb-6 bg-indigo-50 dark:bg-slate-900 border border-indigo-100 dark:border-slate-700 rounded-xl p-4">
                                <h4 className="font-bold text-indigo-800 dark:text-indigo-400 flex items-center gap-2 mb-3 text-sm">
                                    <LinkIcon className="w-4 h-4"/> Textos Relacionados (Cruzamento de Tags)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {getRelatedTexts(entry).map(rel => (
                                        <div key={rel.id} onClick={() => setExpandedId(rel.id)} className="cursor-pointer p-3 bg-white dark:bg-slate-800 rounded border border-indigo-100 dark:border-slate-700 hover:shadow-sm">
                                            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{rel.correctedTitle}</p>
                                            <p className="text-xs text-slate-500">{new Date(rel.creationDate).toLocaleDateString()} • {rel.tags.filter(t => entry.tags.includes(t)).join(', ')}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bible Citations */}
                        {entry.bibleCitations?.length > 0 && (
                             <div className="bg-amber-50 dark:bg-slate-900 border border-amber-100 dark:border-slate-700 rounded-xl p-6">
                                <h4 className="font-bold text-amber-800 dark:text-amber-500 flex items-center gap-2 mb-4"><BookMarked className="w-4 h-4"/> Referências Bíblicas</h4>
                                <div className="grid gap-4">
                                    {entry.bibleCitations.map((c, idx) => (
                                        <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded border border-amber-100 dark:border-slate-700">
                                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase">{c.reference}</p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{c.text}"</p>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        )}
                    </div>
                )}
            </div>
        ))}
        {filteredEntries.length === 0 && <div className="text-center py-20 text-slate-400">Nenhum texto encontrado.</div>}
      </div>

      {/* Slide Modal */}
      {showSlidesModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-xl h-[80vh] flex flex-col">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                      <h3 className="font-bold text-lg dark:text-white flex items-center gap-2"><Presentation className="w-5 h-5"/> Gerador de Slides (IA)</h3>
                      <button onClick={() => setShowSlidesModal(false)} className="text-slate-400 hover:text-slate-600">Fechar</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-900">
                      {loadingSlides ? (
                          <div className="flex flex-col items-center justify-center h-full text-slate-500">
                              <Loader2 className="w-8 h-8 animate-spin mb-2"/>
                              <p>Criando estrutura de slides...</p>
                          </div>
                      ) : (
                          <div className="grid gap-6">
                              {slides.map((slide, idx) => (
                                  <div key={idx} className="aspect-video bg-white dark:bg-slate-800 shadow-md rounded-lg p-8 flex flex-col justify-center border border-slate-200 dark:border-slate-700">
                                      <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mb-4">{slide.title}</h2>
                                      <ul className="list-disc pl-6 space-y-2">
                                          {slide.points.map((p, i) => (
                                              <li key={i} className="text-lg text-slate-700 dark:text-slate-300">{p}</li>
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
