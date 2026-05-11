
import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { TextEditor } from './components/TextEditor';
import { Library } from './components/Library';
import { StatsDashboard } from './components/StatsDashboard';
import { BibleSidebar } from './components/BibleSidebar';
import { ImportTexts } from './components/ImportTexts';
import { TextEntry, ViewState, Collection, SupabaseConfig } from './types';
import { saveTextEntry, loadTexts, saveCollection, loadCollections, saveSupabaseConfig, getSupabaseConfig, initStorage, deleteTextEntry } from './services/storageService';
import { Book, PenTool, LogOut, BarChart2, FolderPlus, Sun, Moon, Settings, X, Save, PlusCircle, Loader2, HardDriveDownload, Wifi, WifiOff, Palette, Bell, Upload, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.LOGIN);
  const [entries, setEntries] = useState<TextEntry[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  // Default to Light Mode (false)
  const [darkMode, setDarkMode] = useState(false);
  const [showBible, setShowBible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Theme/Color
  const [accentColor, setAccentColor] = useState(localStorage.getItem('accent-color') || 'indigo');
  const [isOffline, setIsOffline] = useState(false);
  
  // Edit State
  const [entryToEdit, setEntryToEdit] = useState<TextEntry | null>(null);
  
// Settings State
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>({ 
    url: 'https://dptncbgdrjrvxchmrqcy.supabase.co', 
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdG5jYmdkcmpydnhjaG1ycWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODk1MTUsImV4cCI6MjA5MzY2NTUxNX0.lImTZdyQ_1jWogffjj084aZxq9BTSwIE4DyI7weB3_E', 
    isEnabled: true, 
    email: 'luhcianoneves@gmail.com',
    password: '',
    geminiApiKey: 'AIzaSyDDiqW_bT1m2c8hVJyVzG2-kGy7JZh4wIw',
    openrouterApiKey: '',
    openrouterModel: ''
  });

  useEffect(() => {
    // Initial Load
    const init = async () => {
        try {
            await initStorage();
            const loadedTexts = await loadTexts();
            const loadedCollections = await loadCollections();
            setEntries(loadedTexts);
            setCollections(loadedCollections);
            
            const sc = getSupabaseConfig();
            if (!sc.url) {
              const defaultConfig = { 
                url: 'https://dptncbgdrjrvxchmrqcy.supabase.co', 
                key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdG5jYmdkcmpydnhjaG1ycWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODk1MTUsImV4cCI6MjA5MzY2NTUxNX0.lImTZdyQ_1jWogffjj084aZxq9BTSwIE4DyI7weB3_E', 
                isEnabled: true, 
                email: 'luhcianoneves@gmail.com', 
                password: '' 
              };
              setSupabaseConfig(defaultConfig);
              await saveSupabaseConfig(defaultConfig);
            } else {
              setSupabaseConfig(sc);
            }
        } catch (e) {
            console.error("Initialization error:", e);
        } finally {
            setIsInitializing(false);
        }
    };
    init();

    // Removed auto-dark mode detection to enforce light mode default
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save accent color
  useEffect(() => {
    localStorage.setItem('accent-color', accentColor);
  }, [accentColor]);

  // Register push notifications
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('Service Worker registered');
          if (Notification.permission === 'granted') {
            reg.pushManager.subscribe({ userVisibleOnly: true });
          }
        })
        .catch(console.error);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        alert('Notificações ativadas!');
      }
    }
  };

  // Backup functions
  const exportAllToJSON = () => {
    const data = { entries, collections, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lucianos-scribe-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveEntry = (entry: TextEntry) => {
    // 1. Update UI State immediately
    const updated = [entry, ...entries.filter(e => e.id !== entry.id)];
    setEntries(updated);
    // 2. Persist (Local + Cloud)
    saveTextEntry(entry);
    setEntryToEdit(null); // Clear edit state
    setViewState(ViewState.LIBRARY);
  };

  const handleDeleteEntry = async (id: string) => {
      // 1. Update UI
      const updated = entries.filter(e => e.id !== id);
      setEntries(updated);
      // 2. Persist deletion
      await deleteTextEntry(id);
  };

  const handleEditEntry = (entry: TextEntry) => {
      setEntryToEdit(entry);
      setViewState(ViewState.EDITOR);
  };

  const toggleFavorite = (id: string) => {
    const entryToUpdate = entries.find(e => e.id === id);
    if (entryToUpdate) {
        const updatedEntry = { ...entryToUpdate, isFavorite: !entryToUpdate.isFavorite };
        // 1. Update UI
        setEntries(entries.map(e => e.id === id ? updatedEntry : e));
        // 2. Persist individual change
        saveTextEntry(updatedEntry);
    }
  };

  const handleCreateCollection = () => {
      if (!newCollectionName.trim()) return;
      
      const newCol: Collection = { id: crypto.randomUUID(), name: newCollectionName, color: 'indigo' };
      
      // 1. Update UI
      setCollections([...collections, newCol]);
      // 2. Persist
      saveCollection(newCol);
      
      setNewCollectionName('');
      setShowCollectionModal(false);
  };

  const handleSaveSettings = async () => {
      await saveSupabaseConfig(supabaseConfig);
      alert("Configurações salvas. Se as credenciais estiverem corretas, seus dados serão sincronizados.");
      // Re-load data to verify connection and sync
      const loadedTexts = await loadTexts();
      setEntries(loadedTexts);
      setShowSettings(false);
  };

  const handleNavClick = (view: ViewState) => {
      setViewState(view);
      if (view === ViewState.EDITOR) {
          setEntryToEdit(null); // Reset edit mode when clicking "Escrever" manually
      }
  };

  if (isInitializing) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Iniciando Luciano's Scribe...</span>
          </div>
      );
  }

  if (viewState === ViewState.LOGIN) return <LoginScreen onLoginSuccess={() => setViewState(ViewState.EDITOR)} />;

  const accentColorMap: Record<string, string> = {
    indigo: 'indigo',
    violet: 'violet',
    blue: 'blue',
    emerald: 'emerald',
    rose: 'rose',
    orange: 'orange'
  };
  const accent = accentColorMap[accentColor] || 'indigo';
  const accentBg = `bg-${accent}-600`;
  const accentHover = `hover:bg-${accent}-700`;
  const accentText = `text-${accent}-600`;
  const accentRing = `ring-${accent}-500`;
  const accentLight = `bg-${accent}-100`;
  const accentDarkBg = `bg-${accent}-900`;
  const accentDarkText = `text-${accent}-300`;

  const getAccentClasses = (dark = false) => {
    if (dark) {
      return {
        bg: `bg-${accent}-600`,
        hover: `hover:bg-${accent}-700`,
        text: `text-${accent}-400`,
        light: `bg-${accent}-900/50`,
        ring: `ring-${accent}-500`,
        border: `border-${accent}-500`
      };
    }
    return {
      bg: `bg-${accent}-600`,
      hover: `hover:bg-${accent}-700`,
      text: `text-${accent}-600`,
      light: `bg-${accent}-100`,
      ring: `ring-${accent}-500`,
      border: `border-${accent}-500`
    };
  };

  const accentClasses = getAccentClasses();

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
      {/* Glassmorphism Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-white/20 dark:border-slate-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 h-auto sm:h-16 py-2 sm:py-0 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
                <div className={`${accentBg} p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-lg shadow-${accent}-500/20`}>
                    <Book className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent hidden xs:block sm:block">Luciano's Scribe</h1>
            </div>

            <nav className="flex items-center gap-1 p-1 rounded-xl bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 order-3 sm:order-2">
                {[
                    { id: ViewState.EDITOR, icon: PenTool, label: 'Escrever' },
                    { id: ViewState.LIBRARY, icon: Book, label: 'Biblioteca' },
                    { id: ViewState.IMPORT, icon: Upload, label: 'Importar' },
                    { id: ViewState.STATS, icon: BarChart2, label: 'Estatísticas' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleNavClick(tab.id as ViewState)}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95 ${
                            viewState === tab.id 
                            ? `bg-white dark:bg-slate-700 ${accentText} dark:${accentDarkText} shadow-md shadow-${accent}-500/10` 
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                        }`}
                    >
                        <tab.icon className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </nav>

            <div className="flex items-center gap-0.5 order-2 sm:order-3">
                {/* Offline indicator */}
                {isOffline && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                        <WifiOff className="w-3 h-3" /> Offline
                    </div>
                )}
                <div className="flex items-center gap-0.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                    <button onClick={() => setShowBible(!showBible)} className={`p-1.5 sm:p-2 rounded-md transition-all duration-200 active:scale-90 ${showBible ? `${accentLight} dark:${accentDarkBg} ${accentText} dark:${accentDarkText}` : 'text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`} title="Abrir Bíblia">
                        <Book className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <div className="w-px h-4 sm:h-5 bg-slate-300/50 dark:bg-slate-600/50 mx-0.5 hidden xs:inline"></div>
                    <button onClick={() => setShowCollectionModal(true)} className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all duration-200 active:scale-90" title="Nova Série">
                        <FolderPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button onClick={exportAllToJSON} className="p-1.5 sm:p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all duration-200 active:scale-90 hidden xs:inline" title="Backup">
                        <HardDriveDownload className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <div className="w-px h-4 sm:h-5 bg-slate-300/50 dark:bg-slate-600/50 mx-0.5 hidden xs:inline"></div>
                    <button onClick={() => setDarkMode(!darkMode)} className="p-1.5 sm:p-2 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all duration-200 active:scale-90">
                        {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                    <button onClick={() => setShowSettings(true)} className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all duration-200 active:scale-90">
                        <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <div className="w-px h-4 sm:h-5 bg-slate-300/50 dark:bg-slate-600/50 mx-0.5 hidden xs:inline"></div>
                    <button onClick={() => setViewState(ViewState.LOGIN)} className="p-1.5 sm:p-2 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all duration-200 active:scale-90">
                        <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>
            </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Main Content Area with Page Transition */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
            <div className={`transition-all duration-300 ease-out ${viewState === ViewState.EDITOR ? 'opacity-100 translate-y-0' : viewState === ViewState.LIBRARY ? 'opacity-100 translate-y-0' : 'opacity-100 translate-y-0'}`}>
                {viewState === ViewState.EDITOR && <TextEditor onSave={handleSaveEntry} collections={collections} initialEntry={entryToEdit} />}
                {viewState === ViewState.LIBRARY && <Library entries={entries} collections={collections} onToggleFavorite={toggleFavorite} onDelete={handleDeleteEntry} onEdit={handleEditEntry} accentColor={accentColor} />}
                {viewState === ViewState.STATS && <StatsDashboard entries={entries} />}
                {viewState === ViewState.IMPORT && <ImportTexts onImportComplete={(count) => { alert(`${count} textos importados com sucesso!`); setViewState(ViewState.LIBRARY); }} />}
            </div>
        </main>

        {/* Bible Sidebar - Fixed Overlay */}
        {showBible && (
          <aside className="fixed sm:relative right-0 top-14 sm:top-16 bottom-0 w-full sm:w-80 z-40 sm:z-auto bg-white sm:bg-transparent border-l border-slate-200 dark:border-slate-700 shadow-2xl sm:shadow-none">
            <BibleSidebar />
          </aside>
        )}
      </div>

      {/* New Collection Modal */}
      {showCollectionModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><FolderPlus className="w-5 h-5"/> Nova Série / Estudo</h3>
                        <button onClick={() => setShowCollectionModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Crie um agrupamento para organizar seus textos por tema.</p>
                    <input 
                        type="text"
                        placeholder="Nome da Série (ex: Salmos)"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg mb-4 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        autoFocus
                    />
                    <button onClick={handleCreateCollection} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium flex justify-center items-center gap-2">
                        <PlusCircle className="w-4 h-4"/> Criar
                    </button>
               </div>
          </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><Settings className="w-5 h-5"/> Configurações</h3>
                      <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                  </div>
                  
                  <div className="space-y-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                          <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-2">Conexão Supabase (Nuvem)</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Conecte seu banco de dados para backup e sincronização. <br/>É necessário criar um usuário no painel do Supabase.</p>
                          
                       <div className="space-y-3">
                               <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                   <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-2">API OpenRouter (Opcional)</h4>
                                   <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Use um provider de IA diferente. Deixa vazio para usar Gemini.</p>
                                   <input
                                     type="password"
                                     placeholder="sk-or-v1-..."
                                     value={supabaseConfig.openrouterApiKey || ''}
                                     onChange={(e) => setSupabaseConfig({...supabaseConfig, openrouterApiKey: e.target.value})}
                                     className="w-full p-2 text-sm border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white mb-2"
                                   />
                                   <input
                                     type="text"
                                     placeholder="inclusionai/ring-2.6-1t:free"
                                     value={supabaseConfig.openrouterModel || ''}
                                     onChange={(e) => setSupabaseConfig({...supabaseConfig, openrouterModel: e.target.value})}
                                     className="w-full p-2 text-sm border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                   />
                                   <p className="text-xs text-slate-400 mt-1 mb-2">Código do modelo (ex: anthropic/claude-3.5-sonnet)</p>
                                   <button 
                                     onClick={async () => {
                                       if (!supabaseConfig.openrouterApiKey || !supabaseConfig.openrouterModel) {
                                         alert('Preencha API Key e Modelo primeiro.');
                                         return;
                                       }
                                       try {
                                         const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                                           method: 'POST',
                                           headers: {
                                             'Content-Type': 'application/json',
                                             'Authorization': `Bearer ${supabaseConfig.openrouterApiKey}`
                                           },
                                           body: JSON.stringify({
                                             model: supabaseConfig.openrouterModel,
                                             messages: [{ role: 'user', content: 'Responda apenas: OK' }],
                                             max_tokens: 5
                                           })
                                         });
                                         const data = await res.json();
                                         if (res.ok && data.choices?.[0]?.message?.content) {
                                           alert('✅ Modelo funcionando: ' + data.choices[0].message.content);
                                         } else {
                                           alert('❌ Erro: ' + (data.error?.message || 'Verifique o modelo'));
                                         }
                                       } catch (e: any) {
                                         alert('❌ Erro: ' + e.message);
                                       }
                                     }}
                                     className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium flex justify-center items-center gap-2"
                                   >
                                     <Sparkles className="w-4 h-4" /> Validar OpenRouter
                                   </button>
                               </div>
                               <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                   <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-2">API Gemini (IA)</h4>
                                   <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Chave da API do Google Gemini para recursos de IA.</p>
                                   <input 
                                     type="password" 
                                     placeholder="AIzaSy..." 
                                     value={supabaseConfig.geminiApiKey || ''}
                                     onChange={(e) => setSupabaseConfig({...supabaseConfig, geminiApiKey: e.target.value})}
                                     className="w-full p-2 text-sm border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                   />
                               </div>
                               <label className="flex items-center gap-2 cursor-pointer">
                                   <input type="checkbox" checked={supabaseConfig.isEnabled} onChange={(e) => setSupabaseConfig({...supabaseConfig, isEnabled: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500"/>
                                   <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Ativar Integração</span>
                               </label>
                              <input 
                                type="text" 
                                placeholder="Supabase URL (https://xyz.supabase.co)" 
                                value={supabaseConfig.url}
                                onChange={(e) => setSupabaseConfig({...supabaseConfig, url: e.target.value})}
                                className="w-full p-2 text-sm border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                              />
                              <input 
                                type="password" 
                                placeholder="Supabase Anon Key" 
                                value={supabaseConfig.key}
                                onChange={(e) => setSupabaseConfig({...supabaseConfig, key: e.target.value})}
                                className="w-full p-2 text-sm border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                              />
                              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                  <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Autenticação (Obrigatório)</p>
                                  <input 
                                    type="email" 
                                    placeholder="Email do Usuário" 
                                    value={supabaseConfig.email || ''}
                                    onChange={(e) => setSupabaseConfig({...supabaseConfig, email: e.target.value})}
                                    className="w-full p-2 text-sm border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white mb-2"
                                  />
                                  <input 
                                    type="password" 
                                    placeholder="Senha do Usuário" 
                                    value={supabaseConfig.password || ''}
                                    onChange={(e) => setSupabaseConfig({...supabaseConfig, password: e.target.value})}
                                    className="w-full p-2 text-sm border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                  />
                              </div>
                          </div>
                      </div>
                      
<button onClick={handleSaveSettings} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium flex justify-center items-center gap-2">
                            <Save className="w-4 h-4" /> Salvar Alterações
                        </button>
                        
                        {/* Notifications */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                            <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                                <Wifi className="w-4 h-4" /> Notificações Push
                            </h4>
                            <button onClick={requestNotificationPermission} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium">
                                Ativar Notificações
                            </button>
                            <p className="text-xs text-slate-500 mt-2">Receba alertas quando você criar novos textos.</p>
                        </div>
                        
                        {/* Theme Settings */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                            <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                                <Palette className="w-4 h-4" /> Tema e Cores
                            </h4>
                            <div className="flex gap-2 flex-wrap">
                                {['indigo', 'violet', 'blue', 'emerald', 'rose', 'orange'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setAccentColor(color)}
                                        className={`w-8 h-8 rounded-full bg-${color}-500 ${accentColor === color ? 'ring-2 ring-offset-2 ring-' + color + '-500' : ''}`}
                                        title={color.charAt(0).toUpperCase() + color.slice(1)}
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Cor de destaque: {accentColor}</p>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default App;
