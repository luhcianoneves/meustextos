import { ProcessedContent, Slide } from "../types";

interface AIProvider {
  processTextEntry: (title: string, body: string) => Promise<ProcessedContent>;
  generateIllustration: (content: string) => Promise<string>;
  searchBibleVerse: (query: string, version: string) => Promise<string>;
  transcribeAudioFile: (base64Audio: string, mimeType: string) => Promise<string>;
  generateSlides: (content: string) => Promise<Slide[]>;
  getTheologicalDefinition: (term: string, context: string) => Promise<string>;
  summarizeSelectedText: (text: string) => Promise<string>;
  rewriteInStyle: (text: string, style: string) => Promise<string>;
  translateText: (text: string, targetLanguage: string) => Promise<string>;
  suggestTitles: (text: string) => Promise<string[]>;
  correctGrammar: (text: string) => Promise<string>;
}

const getProvider = (): AIProvider => {
  const configStr = localStorage.getItem('luciano-scribe-config');
  if (configStr) {
    const config = JSON.parse(configStr);
    if (config.openrouterApiKey) {
      return createOpenRouterProvider(config.openrouterApiKey, config.openrouterModel || 'anthropic/claude-3.5-sonnet');
    }
  }
  return createGeminiProvider();
};

const createGeminiProvider = (): AIProvider => {
  let apiKey = '';
  try {
    const config = localStorage.getItem('luciano-scribe-config');
    if (config) {
      const parsed = JSON.parse(config);
      if (parsed.geminiApiKey) apiKey = parsed.geminiApiKey;
    }
  } catch (e) { /* ignore */ }

  if (!apiKey) {
    apiKey = 'AIzaSyDDiqW_bT1m2c8hVJyVzG2-kGy7JZh4wIw';
  }

  const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  const postAI = async (contents: any, config?: any) => {
    const contentsArray = Array.isArray(contents) ? contents : [contents];
    const res = await fetch(`${baseUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: contentsArray, ...config })
    });
    const data = await res.json();
    return data;
  };

  return {
    processTextEntry: async (title, body) => {
      try {
        const data = await postAI({
          parts: [{ text: `Analise o texto. 1) Corrija título e corpo (preserve HTML). 2) Gere 5 tags. 3) Resumo em 2 frases. 4) Identifique citações bíblicas. Retorne JSON: {correctedTitle, correctedBody, summary, tags: [], bibleCitations: [{reference, text}]}. Título: ${title}. Corpo: ${body}` }]
        }, {
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4000,
            responseMimeType: "application/json"
          }
        });
        
        if (data.error) {
          throw new Error(data.error.message || 'Erro na API do Gemini');
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const parsed = JSON.parse(text);
        return {
          correctedTitle: parsed.correctedTitle || title,
          correctedBody: parsed.correctedBody || body,
          summary: parsed.summary || (body.replace(/<[^>]*>/g, '').substring(0, 150) + '...'),
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          bibleCitations: Array.isArray(parsed.bibleCitations) ? parsed.bibleCitations : []
        };
      } catch (e) {
        console.error("processTextEntry Gemini error:", e);
        return {
          correctedTitle: title,
          correctedBody: body,
          summary: body.replace(/<[^>]*>/g, '').substring(0, 150) + '...',
          tags: [],
          bibleCitations: []
        };
      }
    },

    generateIllustration: async (content) => {
      const data = await postAI({
        parts: [{ text: `Crie uma ilustração/metalfor (max 100 palavras) para: ${content}` }]
      });
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    },

    searchBibleVerse: async (query, version) => {
      const data = await postAI({
        parts: [{ text: `Quote o versículo: "${query}". Versão: ${version}. Formato: "<strong>Referência (Versão)</strong><br/>Texto"` }]
      });
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    },

    transcribeAudioFile: async (base64Audio, mimeType) => {
      return `Transcrição não disponível com Gemini. Use OpenRouter.`;
    },

    generateSlides: async (content) => {
      const data = await postAI({
        parts: [{ text: `Crie 5-7 slides para: ${content}. JSON: [{title, points: []}]` }]
      }, {
        generationConfig: {
          responseMimeType: "application/json"
        }
      });
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      return JSON.parse(text);
    },

    getTheologicalDefinition: async (term, context) => {
      const data = await postAI({
        parts: [{ text: `Defina "${term}" em contexto bíblico (max 3 frases). Contexto: ${context}` }]
      });
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    },

    summarizeSelectedText: async (text) => {
      const data = await postAI({
        parts: [{ text: `Resuma em 3 parágrafos: ${text}` }]
      });
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    },

    rewriteInStyle: async (text, style) => {
      const data = await postAI({
        parts: [{ text: `Reescreva no estilo ${style}: ${text}` }]
      });
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    },

    translateText: async (text, targetLanguage) => {
      const data = await postAI({
        parts: [{ text: `Traduza para ${targetLanguage}: ${text}` }]
      });
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    },

    suggestTitles: async (text) => {
      const data = await postAI({
        parts: [{ text: `Sugira 5 títulos: ${text}` }]
      }, {
        generationConfig: {
          responseMimeType: "application/json"
        }
      });
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      return JSON.parse(result);
    },

    correctGrammar: async (text) => {
      const data = await postAI({
        parts: [{ text: `Corrija gramática: ${text}` }]
      });
      return data.candidates?.[0]?.content?.parts?.[0]?.text || text;
    }
  };
};

const createOpenRouterProvider = (apiKey: string, model: string): AIProvider => {
  const baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

  const postAI = async (messages: any[], config?: any) => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': "Luciano's Scribe"
      },
      body: JSON.stringify({ model, messages, ...config })
    });
    const data = await res.json();
    if (data.error) {
      throw new Error(data.error.message || 'Erro na API');
    }
    return data;
  };

  const chat = async (system: string, user: string, config?: any) => {
    const data = await postAI([
      { role: 'system', content: system },
      { role: 'user', content: user }
    ], config);
    return data.choices?.[0]?.message?.content || '';
  };

  return {
    processTextEntry: async (title, body) => {
      try {
        const response = await chat(
          'Você é assistente do Luciano\'s Scribe. Organize textos, corrija gramática em português, identifique citações bíblicas.',
          `Analise: Título: ${title}. Corpo: ${body}. Retorne JSON: {correctedTitle, correctedBody, summary, tags: [], bibleCitations: [{reference, text}]}`,
          { response_format: { type: 'json_object' } }
        );
        const parsed = JSON.parse(response);
        return {
          correctedTitle: parsed.correctedTitle || title,
          correctedBody: parsed.correctedBody || body,
          summary: parsed.summary || (body.replace(/<[^>]*>/g, '').substring(0, 150) + '...'),
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          bibleCitations: Array.isArray(parsed.bibleCitations) ? parsed.bibleCitations : []
        };
      } catch (e) {
        console.error("processTextEntry error:", e);
        return {
          correctedTitle: title,
          correctedBody: body,
          summary: body.replace(/<[^>]*>/g, '').substring(0, 150) + '...',
          tags: [],
          bibleCitations: []
        };
      }
    },

    generateIllustration: async (content) => {
      return await chat('Você é contador de histórias. Crie ilustrações tocantes.', `Metalfor para: ${content} (max 100 palavras)`);
    },

    searchBibleVerse: async (query, version) => {
      return await chat('Você é assistente bíblico.', `Cite ${query} na versão ${version}. Formato: "**Referência (Versão)** Texto"`);
    },

    transcribeAudioFile: async () => {
      return 'Transcrição de áudio requer processamento especial.';
    },

    generateSlides: async (content) => {
      try {
        const response = await chat(
          'Você é criador de apresentações.',
          `Crie 5-7 slides para: ${content}. Retorne JSON: [{title, points: []}]`,
          { response_format: { type: 'json_object' } }
        );
        return JSON.parse(response);
      } catch (e) {
        return [];
      }
    },

    getTheologicalDefinition: async (term, context) => {
      return await chat('Você é professor de teologia.', `Defina "${term}" em contexto bíblico (max 3 frases). Uso: ${context}`);
    },

    summarizeSelectedText: async (text) => {
      return await chat('Você é assistente de escrita.', `Resuma em 3 parágrafos: ${text}`);
    },

    rewriteInStyle: async (text, style) => {
      return await chat('Você é escritor criativo.', `Reescreva no estilo ${style}: ${text}`);
    },

    translateText: async (text, targetLanguage) => {
      return await chat('Você é tradutor profissional.', `Traduza para ${targetLanguage}: ${text}`);
    },

    suggestTitles: async (text) => {
      try {
        const response = await chat('Você é copywriter.', `Sugira 5 títulos criativos para: ${text}`, { response_format: { type: 'json_object' } });
        const parsed = JSON.parse(response);
        return Array.isArray(parsed) ? parsed : (parsed.titles || []);
      } catch (e) {
        return [];
      }
    },

    correctGrammar: async (text) => {
      return await chat('Você é professor de português.', `Corrija gramática: ${text}`);
    }
  };
};

export const processTextEntry = async (title: string, body: string) => getProvider().processTextEntry(title, body);
export const generateIllustration = async (content: string) => getProvider().generateIllustration(content);
export const searchBibleVerse = async (query: string, version: string) => getProvider().searchBibleVerse(query, version);
export const transcribeAudioFile = async (base64Audio: string, mimeType: string) => getProvider().transcribeAudioFile(base64Audio, mimeType);
export const generateSlides = async (content: string) => getProvider().generateSlides(content);
export const getTheologicalDefinition = async (term: string, context: string) => getProvider().getTheologicalDefinition(term, context);
export const summarizeSelectedText = async (text: string) => getProvider().summarizeSelectedText(text);
export const rewriteInStyle = async (text: string, style: string) => getProvider().rewriteInStyle(text, style);
export const translateText = async (text: string, targetLanguage: string) => getProvider().translateText(text, targetLanguage);
export const suggestTitles = async (text: string) => getProvider().suggestTitles(text);
export const correctGrammar = async (text: string) => getProvider().correctGrammar(text);
