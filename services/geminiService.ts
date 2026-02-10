
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
    console.warn("API_KEY não configurada. Auditoria IA desativada.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Mudado para Flash para maior velocidade na auditoria inicial
      contents: `Auditoria estratégica de afiliado:
      Produto: ${productName}
      Nicho: ${niche}
      URL: ${salesUrl}

      Retorne um JSON com análise da página de vendas, keywords fundo de funil e veredito de ROI.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            salesPageScore: { type: Type.NUMBER, description: "Nota 0-10 para a página" },
            aiVerdict: { type: Type.STRING, description: "Análise estratégica curta" },
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

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (e) {
    console.error("Falha na auditoria Gemini:", e);
    return null;
  }
};
