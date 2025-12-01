import { GoogleGenAI } from "@google/genai";
import { StepType, Step } from '../types';
import { getDefaultAIModel, getSettings } from './settingsService';

// Get API key from settings or environment
const getApiKey = (): string => {
  const defaultModel = getDefaultAIModel();
  if (defaultModel?.provider === 'gemini' && defaultModel.apiKey) {
    return defaultModel.apiKey;
  }
  return process.env.GEMINI_API_KEY || '';
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

// Helper function to get image URL from Unsplash
const getImageUrl = async (query: string): Promise<string | null> => {
  try {
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&client_id=8eSqmXvVzFoQy5r3cGWpW1qB_-4OFPhHrQvf6s0cFfE`);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }
  } catch (error) {
    console.warn(`Failed to fetch image for "${query}":`, error);
  }
  return null;
};

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
    console.error("API Key missing - Please configure AI model in Settings");
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
    2. **MEDIA**: ${options.includeMedia ? "For steps that could benefit from visual reference, use 'media' type. In the 'content' field, provide a SHORT keyword or phrase describing what image would be helpful (e.g., 'chocolate cake decoration', 'engine oil check', 'solar panel installation'). This keyword will be used to fetch a real image." : "Do not use 'media' type."}
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
    const mappedSteps: Step[] = await Promise.all(
      data.steps.map(async (s: any, index: number) => {
        let content = s.content;
        
        // For media type steps, try to get a real image URL
        if (s.type === 'media' && options.includeMedia) {
          const imageUrl = await getImageUrl(s.content || s.title);
          if (imageUrl) {
            content = imageUrl;
          }
        }
        
        return {
          id: Date.now().toString() + index,
          title: s.title,
          type: s.type as StepType,
          content: content,
          checklistItems: s.checklistItems?.map((item: any, i: number) => ({
            id: `chk-${Date.now()}-${i}`,
            label: item.label,
            checked: false
          })) || [],
          completed: false
        };
      })
    );

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