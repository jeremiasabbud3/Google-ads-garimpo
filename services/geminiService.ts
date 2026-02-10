
import { GoogleGenAI, Type } from "@google/genai";

// Função auxiliar para obter a API KEY de forma segura
const getApiKey = (): string => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
    // Fallback para ambientes onde o process não está definido globalmente
    return (window as any).process?.env?.API_KEY || "";
  } catch {
    return "";
  }
};

export const extractMarketAndPageData = async (productName: string, salesUrl: string, niche: string) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("API_KEY não encontrada no ambiente.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Realize uma auditoria estratégica para o produto: "${productName}" no nicho ${niche}.
      URL da Página de Vendas: ${salesUrl}

      TAREFAS OBRIGATÓRIAS:
      1. Analise profundamente a Página de Vendas (${salesUrl}) e identifique: a promessa principal, gatilhos de urgência e bônus.
      2. Gere 5 Palavras-chave estritamente de FUNDO DE FUNIL (Intenção de compra imediata).
      3. Crie 5 Títulos para anúncios (até 30 caracteres) e 2 Descrições longas (até 90 caracteres) usando o tom de voz da página.
      4. Estime o CPC médio e Volume apenas como referência (o usuário preencherá o oficial).
      5. Dê uma nota de 0 a 10 para a força de conversão da página.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedCPC: { type: Type.NUMBER },
            suggestedVolume: { type: Type.STRING },
            marketInsights: {
              type: Type.OBJECT,
              properties: {
                trendStatus: { type: Type.STRING, enum: ["Crescente", "Estável", "Queda"] },
                competitionLevel: { type: Type.STRING, enum: ["Baixa", "Média", "Alta"] }
              },
              required: ["trendStatus", "competitionLevel"]
            },
            adsAssets: {
              type: Type.OBJECT,
              properties: {
                keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Keywords de Fundo de Funil" },
                titles: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Títulos curtos Ads" },
                descriptions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Descrições persuasivas" }
              },
              required: ["keywords", "titles", "descriptions"]
            },
            salesPageScore: { type: Type.NUMBER },
            aiVerdict: { type: Type.STRING, description: "Veredito estratégico sobre o produto" }
          },
          required: ["adsAssets", "salesPageScore", "aiVerdict"]
        }
      },
    });

    const text = response.text?.trim() || "{}";
    const result = JSON.parse(text);

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const groundingUrls = groundingChunks?.map((chunk: any) => {
      if (chunk.web) return { title: chunk.web.title, uri: chunk.web.uri };
      return null;
    }).filter(Boolean);

    return { ...result, groundingUrls };
  } catch (e) {
    console.error("Erro na auditoria profunda", e);
    return null;
  }
};
