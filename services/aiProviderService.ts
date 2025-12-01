import { GoogleGenAI } from "@google/genai";
import { StepType, Step, AIModel } from '../types';
import { getDefaultAIModel } from './settingsService';

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

// Helper to clean JSON string from Markdown code blocks
const cleanJsonString = (text: string): string => {
  return text.replace(/```json\n?|\n?```/g, '').trim();
};

// ==================== GEMINI PROVIDER ====================

export const generateWithGemini = async (
  prompt: string,
  language: string,
  options: { useSearch: boolean; includeMedia: boolean } = { useSearch: true, includeMedia: true }
): Promise<{ title: string; description: string; steps: Step[] } | null> => {
  const model = getDefaultAIModel();
  
  if (!model || model.provider !== 'gemini' || !model.apiKey) {
    console.error("Gemini API Key missing - Configure in Settings");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: model.apiKey });

    const langInstruction = language === 'ar' ? 'Output values MUST be in Arabic.' : 'Output values MUST be in English.';
    
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

    const tools = [];
    if (options.useSearch) {
      tools.push({ googleSearch: {} });
    }

    const response = await ai.models.generateContent({
      model: model.modelName,
      contents: promptText,
      config: {
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

// ==================== OPENAI / GPT-4 PROVIDER ====================

export const generateWithOpenAI = async (
  prompt: string,
  language: string,
  model: AIModel,
  options: { useSearch: boolean; includeMedia: boolean } = { useSearch: true, includeMedia: true }
): Promise<{ title: string; description: string; steps: Step[] } | null> => {
  if (!model.apiKey) {
    console.error("OpenAI API Key missing");
    return null;
  }

  try {
    const langInstruction = language === 'ar' ? 'الإخراج يجب أن يكون بالعربية' : 'Output must be in English';
    
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`
      },
      body: JSON.stringify({
        model: model.modelName,
        messages: [
          {
            role: 'system',
            content: 'You are an expert workflow architect. You create detailed step-by-step guides.'
          },
          {
            role: 'user',
            content: `Create a workflow for: "${prompt}"\n${langInstruction}\nReturn ONLY valid JSON matching this structure:\n${jsonStructure}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('OpenAI Error:', data.error);
      return null;
    }

    const responseText = data.choices[0].message.content;
    const cleanJson = cleanJsonString(responseText);
    const parsedData = JSON.parse(cleanJson);

    // Map response to our internal Step structure
    const mappedSteps: Step[] = await Promise.all(
      parsedData.steps.map(async (s: any, index: number) => {
        let content = s.content;
        
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
      title: parsedData.title,
      description: parsedData.description,
      steps: mappedSteps
    };

  } catch (error) {
    console.error("OpenAI Generation Error:", error);
    return null;
  }
};

// ==================== ANTHROPIC / CLAUDE PROVIDER ====================

export const generateWithClaude = async (
  prompt: string,
  language: string,
  model: AIModel,
  options: { useSearch: boolean; includeMedia: boolean } = { useSearch: true, includeMedia: true }
): Promise<{ title: string; description: string; steps: Step[] } | null> => {
  if (!model.apiKey) {
    console.error("Claude API Key missing");
    return null;
  }

  try {
    const langInstruction = language === 'ar' ? 'الإخراج يجب أن يكون بالعربية' : 'Output must be in English';
    
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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': model.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model.modelName,
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `Create a detailed workflow for: "${prompt}"\n${langInstruction}\nReturn ONLY valid JSON matching this structure:\n${jsonStructure}`
          }
        ]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Claude Error:', data.error);
      return null;
    }

    const responseText = data.content[0].text;
    const cleanJson = cleanJsonString(responseText);
    const parsedData = JSON.parse(cleanJson);

    // Map response to our internal Step structure
    const mappedSteps: Step[] = await Promise.all(
      parsedData.steps.map(async (s: any, index: number) => {
        let content = s.content;
        
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
      title: parsedData.title,
      description: parsedData.description,
      steps: mappedSteps
    };

  } catch (error) {
    console.error("Claude Generation Error:", error);
    return null;
  }
};

// ==================== DEEPSEEK PROVIDER ====================

export const generateWithDeepSeek = async (
  prompt: string,
  language: string,
  model: AIModel,
  options: { useSearch: boolean; includeMedia: boolean } = { useSearch: true, includeMedia: true }
): Promise<{ title: string; description: string; steps: Step[] } | null> => {
  if (!model.apiKey) {
    console.error("DeepSeek API Key missing");
    return null;
  }

  try {
    const langInstruction = language === 'ar' ? 'الإخراج يجب أن يكون بالعربية' : 'Output must be in English';
    
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

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`
      },
      body: JSON.stringify({
        model: model.modelName,
        messages: [
          {
            role: 'system',
            content: 'You are an expert workflow architect specializing in creating clear, actionable steps.'
          },
          {
            role: 'user',
            content: `Create a workflow for: "${prompt}"\n${langInstruction}\nReturn ONLY valid JSON:\n${jsonStructure}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('DeepSeek Error:', data.error);
      return null;
    }

    const responseText = data.choices[0].message.content;
    const cleanJson = cleanJsonString(responseText);
    const parsedData = JSON.parse(cleanJson);

    // Map response to our internal Step structure
    const mappedSteps: Step[] = await Promise.all(
      parsedData.steps.map(async (s: any, index: number) => {
        let content = s.content;
        
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
      title: parsedData.title,
      description: parsedData.description,
      steps: mappedSteps
    };

  } catch (error) {
    console.error("DeepSeek Generation Error:", error);
    return null;
  }
};

// ==================== MAIN GENERATOR - DYNAMIC PROVIDER ====================

export const generateWorkflowFromPrompt = async (
  prompt: string,
  language: string,
  selectedModel?: AIModel,
  options: { useSearch: boolean; includeMedia: boolean } = { useSearch: true, includeMedia: true }
): Promise<{ title: string; description: string; steps: Step[] } | null> => {
  // Use selected model or default
  const model = selectedModel || getDefaultAIModel();
  
  if (!model) {
    console.error("No AI model configured - Please add one in Settings");
    return null;
  }

  console.log(`Using AI Provider: ${model.provider} (${model.name})`);

  switch (model.provider) {
    case 'gemini':
      return generateWithGemini(prompt, language, options);
    case 'openai':
      return generateWithOpenAI(prompt, language, model, options);
    case 'anthropic':
      return generateWithClaude(prompt, language, model, options);
    case 'deepseek':
      return generateWithDeepSeek(prompt, language, model, options);
    default:
      console.error(`Unsupported AI provider: ${model.provider}`);
      return null;
  }
};
