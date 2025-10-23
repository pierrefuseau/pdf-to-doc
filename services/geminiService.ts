import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getPrompt = (documentText: string, fileName: string): string => `
Tu es un assistant d’analyse expert.
Ta mission : produire un rapport complet, clair et structuré à partir du contenu du document fourni. Le nom du document est : "${fileName}".

Objectif :
- Synthétiser l’ensemble des informations clés issues de la source sans en omettre.
- Chaque donnée importante doit apparaître, même si elle ne se répète qu’une fois dans la source.

Structure demandée :
1.  **Résumé global** : les grandes tendances et faits majeurs.
2.  **Synthèse détaillée** : faits essentiels, chiffres, idées clés, structurés par thèmes.
3.  **Points à retenir / données critiques** : une liste à puces des informations les plus cruciales.

Contraintes :
- Le rapport doit être exploitable par un système RAG.
- Garde un niveau de détail élevé, mais regroupe les éléments proches pour éviter la redondance.
- Ne supprime aucune donnée utile, mais exprime-les sous forme condensée si nécessaire.
- Référence la source de façon brève à la fin de chaque section majeure : (source : ${fileName}).
- Aucune interprétation ni jugement, uniquement des faits contextualisés.

Finalité :
Le texte doit pouvoir être utilisé par des agents IA pour répondre à des requêtes internes avec contexte complet et traçabilité.

---
CONTENU DU DOCUMENT "${fileName}":
---

${documentText}
`;


export async function generateReport(documentText: string, fileName: string): Promise<string> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  
  try {
    const prompt = getPrompt(documentText, fileName);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate report from Gemini API.");
  }
}
