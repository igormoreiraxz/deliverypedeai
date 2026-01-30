
import { GoogleGenAI, Type } from "@google/genai";

// Sempre use process.env.API_KEY diretamente conforme as diretrizes
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartMenuSuggestions = async (userPrompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `O usuário está usando um marketplace global de delivery de comida. Ele está com desejo de: "${userPrompt}". 
      Sugira 3 ideias de pratos diversos de QUALQUER culinária que satisfaçam esse desejo. 
      Seja criativo, apetitoso e moderno. Responda em Português-BR.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              priceHint: { type: Type.STRING }
            },
            required: ["name", "description"]
          }
        }
      }
    });
    // A propriedade .text retorna diretamente a string de saída
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Erro Gemini:", error);
    return [];
  }
};

export const generateProductDescription = async (productName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gere uma descrição de 20 palavras, de dar água na boca e impactante para este item de comida: ${productName}. Faça parecer irresistível para um app de delivery. Responda em Português-BR.`,
    });
    return response.text?.trim() || "Um favorito dos clientes, preparado na hora.";
  } catch (error) {
    return "Uma escolha deliciosa para sua próxima refeição.";
  }
};
