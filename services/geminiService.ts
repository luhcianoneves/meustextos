import { GoogleGenAI, Type } from "@google/genai";
import { ProcessedContent, Slide } from "../types";

// Helper to initialize AI only when needed
const getAIClient = () => {
  let apiKey = '';
  console.log("Luciano's Scribe: Initializing AI Client...");

  // 1. Try standard process.env (Node/Webpack) - Safely
  try {
    if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.VITE_API_KEY || 
               process.env.API_KEY || 
               process.env.REACT_APP_API_KEY || '';
    }
  } catch (e) {
    // Ignore ReferenceError if process is not defined
  }

  // 2. Try import.meta.env (Vite/Modern)
  if (!apiKey) {
    try {
      // @ts-ignore
      if (import.meta && import.meta.env) {
        // @ts-ignore
        apiKey = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY || '';
      }
    } catch (e) {
      // Ignore
    }
  }
  
  if (!apiKey) {
    console.error("API Key NOT found in environment variables.");
    throw new Error("Chave de API não encontrada. No Vercel, vá em Settings > Environment Variables e adicione 'VITE_API_KEY'.");
  } else {
    console.log("API Key found successfully.");
  }
  
  return new GoogleGenAI({ apiKey });
};

// Main Text Processing
export const processTextEntry = async (
  title: string,
  body: string
): Promise<ProcessedContent> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Please analyze the following text entry. The body may contain HTML tags for formatting.
      1. Correct the spelling and grammar of the Title.
      2. Correct the spelling and grammar of the Body Text. IMPORTANT: Preserve all HTML tags (<br>, <b>, <img>, etc.) exactly where they are.
      3. Generate exactly 5 relevant tags.
      4. Generate a concise 2-sentence executive summary of the content.
      5. Identify any Bible verses referenced.
      
      Title: ${title}
      Body: ${body}`,
      config: {
        systemInstruction: "You are Luciano's Scribe assistant. Organize texts, fix grammar in Portuguese, identify bible verses, and generate summaries.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            correctedTitle: { type: Type.STRING },
            correctedBody: { type: Type.STRING },
            summary: { type: Type.STRING, description: "A concise 2-sentence summary of the text" },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            bibleCitations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  reference: { type: Type.STRING },
                  text: { type: Type.STRING }
                }
              }
            }
          },
          required: ["correctedTitle", "correctedBody", "tags", "bibleCitations", "summary"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as ProcessedContent;
  } catch (error) {
    console.error("Error processing text:", error);
    alert("Erro ao processar texto: " + (error instanceof Error ? error.message : "Erro desconhecido"));
    throw error;
  }
};

// Generate Illustration
export const generateIllustration = async (content: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Read the following text and create a short, powerful metaphor or illustration (max 100 words) that clarifies the main point.
      Text: ${content}`,
      config: {
        systemInstruction: "You are a master storyteller and preacher. Create illustrations that touch the heart.",
        responseMimeType: "text/plain"
      }
    });
    return response.text || "Não foi possível gerar uma ilustração.";
  } catch (error) {
    console.error(error);
    return "Erro de configuração da IA (Verifique a API Key).";
  }
};

// Bible Search
export const searchBibleVerse = async (query: string, version: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Quote the bible verse(s) for: "${query}".
      Version Required: ${version} (e.g., ACF, NTLH, A Mensagem, ARA).
      If the specific version is not in your training data verbatim, provide the closest reliable Portuguese translation and mention it.
      Format: "<strong>Reference (Version)</strong><br/>Text"`,
      config: {
        systemInstruction: "You are a bible software assistant. Return only the formatted verse HTML.",
        responseMimeType: "text/plain"
      }
    });
    return response.text || "Versículo não encontrado.";
  } catch (error) {
    console.error(error);
    return "Erro ao buscar versículo. Verifique a API Key.";
  }
};

// Audio Transcription (Upload)
export const transcribeAudioFile = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: "Please transcribe this audio file accurately into Portuguese. Ignore background noise."
          }
        ]
      },
      config: {
        systemInstruction: "You are a professional transcriber.",
      }
    });
    return response.text || "Não foi possível transcrever.";
  } catch (error) {
    console.error("Transcription error", error);
    alert("Erro na transcrição. Verifique o console ou a API Key.");
    throw error;
  }
};

// Generate Slides
export const generateSlides = async (content: string): Promise<Slide[]> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze this text and create a presentation structure. Generate 5 to 7 slides.
      Text: ${content}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              points: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      }
    });
    const text = response.text;
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("Slide generation error", error);
    return [];
  }
};

// Theological Dictionary
export const getTheologicalDefinition = async (term: string, context: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Define the term "${term}" in a theological/biblical context. 
      Context of usage: "${context}".
      Keep it concise (max 3 sentences).`,
      config: {
        systemInstruction: "You are a theology professor.",
        responseMimeType: "text/plain"
      }
    });
    return response.text || "Definição indisponível.";
  } catch (error) {
    return "Erro ao buscar definição.";
  }
};

// Resumir texto selecionado
export const summarizeSelectedText = async (text: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Resuma o seguinte texto de forma clara e concisa (máximo 3 parágrafos):
      ${text}`,
      config: {
        systemInstruction: "Você é um assistente de escrita. Crie resumos claros e objetivos em português.",
        responseMimeType: "text/plain"
      }
    });
    return response.text || "Não foi possível gerar o resumo.";
  } catch (error) {
    console.error(error);
    return "Erro ao resumir texto.";
  }
};

// Reescrever em outro estilo
export const rewriteInStyle = async (text: string, style: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Reescreva o seguinte texto no estilo: ${style}:
      ${text}`,
      config: {
        systemInstruction: "Você é um assistente de escrita criativa. Reescreva textos mantendo o sentido original.",
        responseMimeType: "text/plain"
      }
    });
    return response.text || "Não foi possível reescrever.";
  } catch (error) {
    console.error(error);
    return "Erro ao reescrever texto.";
  }
};

// Traduzir para outros idiomas
export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Traduza o seguinte texto para ${targetLanguage}:
      ${text}`,
      config: {
        systemInstruction: "Você é um tradutor profissional. Preserve a formatação e o sentido original.",
        responseMimeType: "text/plain"
      }
    });
    return response.text || "Não foi possível traduzir.";
  } catch (error) {
    console.error(error);
    return "Erro ao traduzir texto.";
  }
};

// Sugestões de títulos
export const suggestTitles = async (text: string): Promise<string[]> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Com base no seguinte texto, sugira 5 títulos criativos e atrativos:
      ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    const parsed = response.text;
    return parsed ? JSON.parse(parsed) : [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

// Correção gramatical
export const correctGrammar = async (text: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Corrija a gramática e ortografia do seguinte texto, mantendo o sentido original:
      ${text}`,
      config: {
        systemInstruction: "Você é um professor de português. Corrija erros gramaticais e ortográficos em português do Brasil.",
        responseMimeType: "text/plain"
      }
    });
    return response.text || text;
  } catch (error) {
    console.error(error);
    return text;
  }
};
