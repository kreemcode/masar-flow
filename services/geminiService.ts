import { GoogleGenAI } from "@google/genai";
import { StepType, Step } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

interface GenerateOptions {
  useSearch: boolean;
  includeMedia: boolean;
}

// Helper to clean JSON string from Markdown code blocks
const cleanJsonString = (text: string): string => {
  return text.replace(/```json\n?|\n?```/g, '').trim();
};

export const generateWorkflowFromPrompt = async (
  prompt: string, 
  language: string,
  options: GenerateOptions = { useSearch: true, includeMedia: true }
): Promise<{ title: string, description: string, steps: Step[] } | null> => {
  
  if (!apiKey) {
    console.error("API Key missing");
    return null;
  }

  try {
    const model = 'gemini-2.5-flash';
    const langInstruction = language === 'ar' ? 'Output values MUST be in Arabic.' : 'Output values MUST be in English.';
    
    // Constructing a strict JSON schema prompt because we cannot use responseSchema with googleSearch tool
    const jsonStructure = `
    {
      "title": "string",
      "description": "string",
      "steps": [
        {
          "title": "string",
          "type": "text" | "media" | "gps" | "checklist",
          "content": "string", 
          "checklistItems": [{"label": "string", "checked": false}]
        }
      ]
    }`;

    const promptText = `
    Task: Create a detailed step-by-step workflow guide for: "${prompt}".
    
    ${langInstruction}
    
    RULES FOR STEP TYPES:
    1. **GPS**: ONLY use 'gps' type if the user explicitly asks for a location-specific guide (e.g., "Tour of Cairo Tower", "Directions to Central Park"). If it is a generic task (e.g., "How to bake a cake", "Car maintenance"), DO NOT use 'gps'. Use '0,0' for coordinates if exact location is unknown but required.
    2. **MEDIA**: ${options.includeMedia ? "If a step implies a visual aid, use 'media' type. Try to find a valid public image URL from the search results and put it in 'content'. If no URL is found, put a detailed text description of the image needed in 'content'." : "Do not use 'media' type."}
    3. **CHECKLIST**: Use 'checklist' for steps that require verifying multiple items.
    4. **TEXT**: Use 'text' for general instructions.

    OUTPUT FORMAT:
    You MUST return a valid JSON object matching this structure exactly. Do not include markdown formatting or extra text.
    ${jsonStructure}
    `;

    // Configure tools
    const tools = [];
    if (options.useSearch) {
      tools.push({ googleSearch: {} });
    }

    const response = await ai.models.generateContent({
      model,
      contents: promptText,
      config: {
        // We cannot use responseMimeType: 'application/json' with googleSearch, 
        // so we rely on the prompt to enforce JSON.
        tools: tools.length > 0 ? tools : undefined,
        systemInstruction: "You are an expert workflow architect. You prioritize accuracy and real-world applicability.",
      }
    });

    const text = response.text;
    if (!text) return null;

    console.log("Raw Gemini Response:", text);

    const cleanJson = cleanJsonString(text);
    const data = JSON.parse(cleanJson);
    
    // Map response to our internal Step structure with IDs
    const mappedSteps: Step[] = data.steps.map((s: any, index: number) => ({
      id: Date.now().toString() + index,
      title: s.title,
      type: s.type as StepType,
      content: s.content,
      checklistItems: s.checklistItems?.map((item: any, i: number) => ({
        id: `chk-${Date.now()}-${i}`,
        label: item.label,
        checked: false
      })) || [],
      completed: false
    }));

    return {
      title: data.title,
      description: data.description,
      steps: mappedSteps
    };

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return null;
  }
};