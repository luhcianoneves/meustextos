
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TextEntry, SupabaseConfig, Collection } from '../types';

const STORAGE_KEY_TEXTS = 'luciano-scribe-texts';
const STORAGE_KEY_CONFIG = 'luciano-scribe-config';
const STORAGE_KEY_COLLECTIONS = 'luciano-scribe-collections';

let supabase: SupabaseClient | null = null;

// Initialize Supabase and Attempt Login
export const initStorage = async () => {
  const configStr = localStorage.getItem(STORAGE_KEY_CONFIG);
  if (configStr) {
    const config: SupabaseConfig = JSON.parse(configStr);
    if (config.isEnabled && config.url && config.key) {
      try {
        supabase = createClient(config.url, config.key, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
            }
        });
        
        // Auto-login if credentials provided
        if (config.email && config.password) {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: config.email,
                password: config.password,
            });
            if (error) console.error("Supabase Auth Error:", error.message);
            else console.log("Supabase Authenticated as:", data.session?.user.email);
        }

        console.log("Supabase client initialized.");
      } catch (e) {
        console.error("Failed to init Supabase client", e);
      }
    } else {
      supabase = null;
    }
  }
};

export const saveSupabaseConfig = async (config: SupabaseConfig) => {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  await initStorage();
};

export const getSupabaseConfig = (): SupabaseConfig => {
  const s = localStorage.getItem(STORAGE_KEY_CONFIG);
  return s ? JSON.parse(s) : { url: '', key: '', isEnabled: false };
};

// --- SINGLE ENTRY OPERATIONS (Efficient Sync) ---

export const saveTextEntry = async (entry: TextEntry) => {
  // 1. Save to LocalStorage (Always acts as cache/offline first)
  const currentTexts = await loadTextsLocal();
  const updatedTexts = [entry, ...currentTexts.filter(t => t.id !== entry.id)];
  localStorage.setItem(STORAGE_KEY_TEXTS, JSON.stringify(updatedTexts));

  // 2. Save to Supabase (if connected)
  if (supabase) {
    try {
        // Must check auth state first
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.warn("Supabase: No active session. Cannot save.");
            return;
        }

        // We use the exact column names from the SQL (case-sensitive due to quotes in SQL)
        const { error } = await supabase.from('texts').upsert({
            id: entry.id,
            user_id: session.user.id,
            originalTitle: entry.originalTitle,
            originalBody: entry.originalBody,
            correctedTitle: entry.correctedTitle,
            correctedBody: entry.correctedBody,
            summary: entry.summary,
            tags: entry.tags, // JSONB
            bibleCitations: entry.bibleCitations, // JSONB
            versions: entry.versions, // JSONB
            creationDate: entry.creationDate,
            savedAt: entry.savedAt,
            isFavorite: entry.isFavorite,
            collectionId: entry.collectionId || null
        });

        if (error) {
            console.error("Supabase Save Error:", error.message);
        } else {
            console.log("Saved entry to Supabase:", entry.correctedTitle);
        }
    } catch (err) {
        console.error("Supabase Exception:", err);
    }
  }
};

export const deleteTextEntry = async (id: string) => {
    // 1. Local
    const currentTexts = await loadTextsLocal();
    const updatedTexts = currentTexts.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY_TEXTS, JSON.stringify(updatedTexts));

    // 2. Supabase
    if (supabase) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { error } = await supabase.from('texts').delete().eq('id', id);
                if (error) console.error("Supabase Delete Error:", error.message);
            }
        } catch (err) {
            console.error("Supabase Delete Exception:", err);
        }
    }
};

export const saveCollection = async (collection: Collection) => {
    // 1. Local
    const current = await loadCollectionsLocal();
    const updated = [...current.filter(c => c.id !== collection.id), collection];
    localStorage.setItem(STORAGE_KEY_COLLECTIONS, JSON.stringify(updated));

    // 2. Supabase
    if (supabase) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase.from('collections').upsert({
                id: collection.id,
                user_id: session.user.id,
                name: collection.name,
                description: collection.description,
                color: collection.color
            });
            if(error) console.error("Supabase Collection Error:", error);
        } catch (err) { console.error(err); }
    }
}

// --- BULK / LOAD OPERATIONS ---

// Helper for local load
const loadTextsLocal = async (): Promise<TextEntry[]> => {
    const s = localStorage.getItem(STORAGE_KEY_TEXTS);
    return s ? JSON.parse(s) : [];
};

const loadCollectionsLocal = async (): Promise<Collection[]> => {
    const s = localStorage.getItem(STORAGE_KEY_COLLECTIONS);
    return s ? JSON.parse(s) : [];
};

export const loadTexts = async (): Promise<TextEntry[]> => {
  if (supabase) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data, error } = await supabase.from('texts').select('*').order('savedAt', { ascending: false });
            if (!error && data) {
                // Update local cache with cloud data
                // Need to ensure JSON fields are parsed if Supabase returns them as objects (Supabase JS usually handles jsonb auto-parsing)
                localStorage.setItem(STORAGE_KEY_TEXTS, JSON.stringify(data));
                return data as TextEntry[];
            }
            if (error) console.error("Supabase Load Error:", error);
        }
    } catch (e) {
        console.error("Supabase Load Exception:", e);
    }
  }
  // Fallback to local
  return loadTextsLocal();
};

export const loadCollections = async (): Promise<Collection[]> => {
    if (supabase) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data, error } = await supabase.from('collections').select('*');
                if (!error && data) {
                    localStorage.setItem(STORAGE_KEY_COLLECTIONS, JSON.stringify(data));
                    return data as Collection[];
                }
            }
        } catch (e) { console.error(e); }
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
