export type Language = 'en' | 'ar';

export enum StepType {
  TEXT = 'text',
  MEDIA = 'media',
  GPS = 'gps',
  CHECKLIST = 'checklist'
}

// AI Model Types
export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'deepseek' | 'custom';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  apiKey: string;
  modelName: string; // e.g., 'gemini-2.0-flash', 'gpt-4', 'claude-3-opus'
  isDefault: boolean;
  imageGeneration: boolean; // Can this model generate images?
  createdAt: number;
}

// Image Provider Types
export type ImageProvider = 'unsplash' | 'pexels' | 'dall-e' | 'none';

export interface AppSettings {
  aiModels: AIModel[];
  defaultAIModel: string; // ID of default model
  imageProvider: ImageProvider;
  imageProviderApiKey?: string;
  language: Language;
  theme?: 'light' | 'dark';
  updatedAt: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface Step {
  id: string;
  title: string;
  type: StepType;
  content: string; // For text: content, For media: url/description, For GPS: 'lat,lng'
  checklistItems?: ChecklistItem[]; // Only for checklist type
  completed?: boolean;
}

export interface Workflow {
  id?: number; // Auto-incremented by Dexie
  title: string;
  description: string;
  isPrivate: boolean;
  createdAt: number;
  steps: Step[];
}

export interface Translation {
  [key: string]: {
    en: string;
    ar: string;
  };
}