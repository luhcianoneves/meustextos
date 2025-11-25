import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { TextEditor } from './components/TextEditor';
import { Library } from './components/Library';
import { StatsDashboard } from './components/StatsDashboard';
import { BibleSidebar } from './components/BibleSidebar';
import { TextEntry, ViewState, Collection, SupabaseConfig } from './types';
import { saveTextEntry, loadTexts, saveCollection, loadCollections, saveSupabaseConfig, getSupabaseConfig, initStorage } from './services/storageService';
import { Book, PenTool, LogOut, BarChart2, FolderPlus, Sun, Moon, Settings, X, Save, PlusCircle, Loader2 } from 'lucide-react';

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
  
  // Settings State
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>({ url: '', key: '', isEnabled: false, email: '', password: '' });

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
            setSupabaseConfig(sc);
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

  const handleSaveEntry = (entry: TextEntry) => {
    // 1. Update UI State immediately
    const updated = [entry, ...entries.filter(e => e.id !== entry.id)];
    setEntries(updated);
    // 2. Persist (Local + Cloud)
    saveTextEntry(entry);
    setViewState(ViewState.LIBRARY);
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

  if (isInitializing) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Iniciando Luciano's Scribe...</span>
          </div>
      );
  }

  if (viewState === ViewState.LOGIN) return <LoginScreen onLoginSuccess={() => setViewState(ViewState.EDITOR)} />;

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                    <Book className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold text-slate-800 dark:text-white hidden sm:block">Luciano's Scribe</h1>
            </div>

            <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                {[
                    { id: ViewState.EDITOR, icon: PenTool, label: 'Escrever' },
                    { id: ViewState.LIBRARY, icon: Book, label: 'Biblioteca' },
                    { id: ViewState.STATS, icon: BarChart2, label: 'Estatísticas' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setViewState(tab.id)}
                        className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                            viewState === tab.id 
                            ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm' 
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        <tab.icon className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </nav>

            <div className="flex items-center gap-2">
                <button onClick={() => setShowBible(!showBible)} className={`p-2 rounded-lg transition-colors ${showBible ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`} title="Abrir Bíblia">
                    <Book className="w-5 h-5" />
                </button>
                <button onClick={() => setShowCollectionModal(true)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Nova Série">
                    <FolderPlus className="w-5 h-5" />
                </button>
                <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <Settings className="w-5 h-5" />
                </button>
                <button onClick={() => setViewState(ViewState.LOGIN)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Main Content Area */}
        <main className={`flex-1 p-4 sm:p-6 overflow-y-auto transition-all duration-300 ${showBible ? 'mr-0' : 'mr-0'}`}>
            {viewState === ViewState.EDITOR && <TextEditor onSave={handleSaveEntry} collections={collections} />}
            {viewState === ViewState.LIBRARY && <Library entries={entries} collections={collections} onToggleFavorite={toggleFavorite} />}
            {viewState === ViewState.STATS && <StatsDashboard entries={entries} />}
        </main>

        {/* Bible Sidebar */}
        <aside className={`${showBible ? 'w-80 translate-x-0' : 'w-0 translate-x-full hidden'} transition-all duration-300 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 fixed right-0 top-16 bottom-0 z-20 shadow-xl lg:relative lg:top-0 lg:shadow-none`}>
            <BibleSidebar />
        </aside>
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
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
