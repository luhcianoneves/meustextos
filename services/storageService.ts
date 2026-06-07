

import { TextEntry, ApiConfig, Collection } from '../types';

const STORAGE_KEY_TEXTS = 'luciano-scribe-texts';
const STORAGE_KEY_CONFIG = 'luciano-scribe-config';
const STORAGE_KEY_COLLECTIONS = 'luciano-scribe-collections';
const STORAGE_KEY_TOKEN = 'luciano-scribe-token';

// --- Config ---

export const getApiConfig = (): ApiConfig => {
  const s = localStorage.getItem(STORAGE_KEY_CONFIG);
  return s ? JSON.parse(s) : { url: '', isEnabled: false, geminiApiKey: '', openrouterApiKey: '', openrouterModel: '' };
};

export const saveApiConfig = async (config: ApiConfig) => {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
};

export const getToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEY_TOKEN);
};

export const setToken = (token: string | null) => {
  if (token) localStorage.setItem(STORAGE_KEY_TOKEN, token);
  else localStorage.removeItem(STORAGE_KEY_TOKEN);
};

// --- API Helper ---

const apiFetch = async (path: string, options: RequestInit = {}): Promise<any> => {
  const config = getApiConfig();
  const token = getToken();

  if (!config.isEnabled || !config.url) {
    throw new Error('API não configurada.');
  }

  const url = `${config.url.replace(/\/$/, '')}/api${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    setToken(null);
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }
  return data;
};

// --- Auth ---

export const login = async (email: string, password: string): Promise<{ token: string; user: { id: string; email: string } }> => {
  const config = getApiConfig();
  const url = `${config.url.replace(/\/$/, '')}/api/auth/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao fazer login');
  return data;
};

// --- Single Entry Operations ---

export const saveTextEntry = async (entry: TextEntry) => {
  // 1. LocalStorage (offline-first)
  const currentTexts = await loadTextsLocal();
  const updatedTexts = [entry, ...currentTexts.filter(t => t.id !== entry.id)];
  localStorage.setItem(STORAGE_KEY_TEXTS, JSON.stringify(updatedTexts));

  // 2. API
  if (getToken()) {
    try {
      await apiFetch('/texts', {
        method: 'POST',
        body: JSON.stringify(entry),
      });
    } catch (err) {
      console.warn('API save failed, saved locally:', err);
    }
  }
};

export const deleteTextEntry = async (id: string) => {
  // 1. Local
  const currentTexts = await loadTextsLocal();
  const updatedTexts = currentTexts.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY_TEXTS, JSON.stringify(updatedTexts));

  // 2. API
  if (getToken()) {
    try {
      await apiFetch(`/texts/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API delete failed:', err);
    }
  }
};

export const saveCollection = async (collection: Collection) => {
  // 1. Local
  const current = await loadCollectionsLocal();
  const updated = [...current.filter(c => c.id !== collection.id), collection];
  localStorage.setItem(STORAGE_KEY_COLLECTIONS, JSON.stringify(updated));

  // 2. API
  if (getToken()) {
    try {
      await apiFetch('/collections', {
        method: 'POST',
        body: JSON.stringify(collection),
      });
    } catch (err) {
      console.warn('API collection save failed:', err);
    }
  }
};

// --- Bulk / Load Operations ---

const loadTextsLocal = async (): Promise<TextEntry[]> => {
  const s = localStorage.getItem(STORAGE_KEY_TEXTS);
  return s ? JSON.parse(s) : [];
};

const loadCollectionsLocal = async (): Promise<Collection[]> => {
  const s = localStorage.getItem(STORAGE_KEY_COLLECTIONS);
  return s ? JSON.parse(s) : [];
};

export const loadTexts = async (): Promise<TextEntry[]> => {
  if (getToken()) {
    try {
      const data = await apiFetch('/texts');
      // Update local cache
      localStorage.setItem(STORAGE_KEY_TEXTS, JSON.stringify(data));
      return data as TextEntry[];
    } catch (err) {
      console.warn('API load failed, using local:', err);
    }
  }
  return loadTextsLocal();
};

export const loadCollections = async (): Promise<Collection[]> => {
  if (getToken()) {
    try {
      const data = await apiFetch('/collections');
      localStorage.setItem(STORAGE_KEY_COLLECTIONS, JSON.stringify(data));
      return data as Collection[];
    } catch (err) {
      console.warn('API collections load failed, using local:', err);
    }
  }
  return loadCollectionsLocal();
};

// Legacy support
export const saveTexts = async (texts: TextEntry[]) => {
  localStorage.setItem(STORAGE_KEY_TEXTS, JSON.stringify(texts));
};

export const saveCollectionsList = async (collections: Collection[]) => {
  localStorage.setItem(STORAGE_KEY_COLLECTIONS, JSON.stringify(collections));
};

export const initStorage = async () => {
  // Nothing to initialize for the API
  console.log('Storage initialized.');
};
