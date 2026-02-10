
import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = (): string => {
  try {
    const env = (window as any).process?.env || (typeof process !== 'undefined' ? process.env : {});
    return env.API_KEY || "";
  } catch {
    return "";
  }
};

export const extractMarketAndPageData = async (productName: string, salesUrl: string, niche: string) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("API_KEY ausente. Funcionalidade de IA desativada.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise este produto de afiliado: ${productName}, Nicho: ${niche}, URL: ${salesUrl}. Retorne um JSON com salesPageScore (0-10), aiVerdict (string) e adsAssets (objeto com keywords, titles, descriptions).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            salesPageScore: { type: Type.NUMBER },
            aiVerdict: { type: Type.STRING },
            adsAssets: {
              type: Type.OBJECT,
              properties: {
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                titles: { type: Type.ARRAY, items: { type: Type.STRING } },
                descriptions: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["keywords", "titles", "descriptions"]
            }
          },
          required: ["salesPageScore", "aiVerdict", "adsAssets"]
        }
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Erro Gemini:", e);
    return null;
  }
};
