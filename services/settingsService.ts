import { AIModel, AppSettings, Language, ImageProvider } from '../types';

const SETTINGS_KEY = 'masar-flow-settings';
const MODELS_KEY = 'masar-flow-ai-models';

// Default AI Models
const DEFAULT_AI_MODELS: AIModel[] = [
  {
    id: 'gemini-default',
    name: 'Google Gemini 2.0 Flash',
    provider: 'gemini',
    modelName: 'gemini-2.0-flash',
    apiKey: '', // Will be filled from env or user input
    isDefault: true,
    imageGeneration: false,
    createdAt: Date.now()
  },
  {
    id: 'openai-default',
    name: 'OpenAI GPT-4o',
    provider: 'openai',
    modelName: 'gpt-4o',
    apiKey: '',
    isDefault: false,
    imageGeneration: true,
    createdAt: Date.now()
  },
  {
    id: 'claude-default',
    name: 'Anthropic Claude 3.5 Sonnet',
    provider: 'anthropic',
    modelName: 'claude-3-5-sonnet-20241022',
    apiKey: '',
    isDefault: false,
    imageGeneration: false,
    createdAt: Date.now()
  },
  {
    id: 'deepseek-default',
    name: 'DeepSeek V3',
    provider: 'deepseek',
    modelName: 'deepseek-chat',
    apiKey: '',
    isDefault: false,
    imageGeneration: false,
    createdAt: Date.now()
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  aiModels: DEFAULT_AI_MODELS,
  defaultAIModel: 'gemini-default',
  imageProvider: 'unsplash',
  imageProviderApiKey: '', // Unsplash has a built-in free key
  language: 'ar',
  theme: 'light',
  updatedAt: Date.now()
};

// Initialize settings from localStorage or with defaults
export const initializeSettings = (): AppSettings => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse settings:', error);
      return DEFAULT_SETTINGS;
    }
  }
  
  // Initialize with defaults
  saveSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
};

// Get all settings
export const getSettings = (): AppSettings => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
};

// Save settings
export const saveSettings = (settings: AppSettings): void => {
  settings.updatedAt = Date.now();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

// Get all AI models
export const getAIModels = (): AIModel[] => {
  const settings = getSettings();
  return settings.aiModels;
};

// Get default AI model
export const getDefaultAIModel = (): AIModel | null => {
  const settings = getSettings();
  return settings.aiModels.find(m => m.id === settings.defaultAIModel) || null;
};

// Get AI model by ID
export const getAIModel = (id: string): AIModel | null => {
  const settings = getSettings();
  return settings.aiModels.find(m => m.id === id) || null;
};

// Add new AI model
export const addAIModel = (model: Omit<AIModel, 'id' | 'createdAt'>): AIModel => {
  const settings = getSettings();
  const newModel: AIModel = {
    ...model,
    id: `${model.provider}-${Date.now()}`,
    createdAt: Date.now()
  };
  
  settings.aiModels.push(newModel);
  saveSettings(settings);
  return newModel;
};

// Update AI model
export const updateAIModel = (id: string, updates: Partial<AIModel>): AIModel | null => {
  const settings = getSettings();
  const modelIndex = settings.aiModels.findIndex(m => m.id === id);
  
  if (modelIndex === -1) return null;
  
  settings.aiModels[modelIndex] = {
    ...settings.aiModels[modelIndex],
    ...updates,
    id: settings.aiModels[modelIndex].id, // Keep original ID
    createdAt: settings.aiModels[modelIndex].createdAt // Keep original timestamp
  };
  
  saveSettings(settings);
  return settings.aiModels[modelIndex];
};

// Delete AI model
export const deleteAIModel = (id: string): boolean => {
  const settings = getSettings();
  const initialLength = settings.aiModels.length;
  
  settings.aiModels = settings.aiModels.filter(m => m.id !== id);
  
  // If deleted model was default, set first model as default
  if (settings.defaultAIModel === id && settings.aiModels.length > 0) {
    settings.defaultAIModel = settings.aiModels[0].id;
  }
  
  saveSettings(settings);
  return settings.aiModels.length < initialLength;
};

// Set default AI model
export const setDefaultAIModel = (id: string): boolean => {
  const settings = getSettings();
  if (!settings.aiModels.find(m => m.id === id)) return false;
  
  settings.defaultAIModel = id;
  saveSettings(settings);
  return true;
};

// Update image provider
export const updateImageProvider = (provider: ImageProvider, apiKey?: string): void => {
  const settings = getSettings();
  settings.imageProvider = provider;
  if (apiKey) settings.imageProviderApiKey = apiKey;
  saveSettings(settings);
};

// Get image provider
export const getImageProvider = (): { provider: ImageProvider; apiKey?: string } => {
  const settings = getSettings();
  return {
    provider: settings.imageProvider,
    apiKey: settings.imageProviderApiKey
  };
};

// Update language
export const setLanguage = (language: Language): void => {
  const settings = getSettings();
  settings.language = language;
  saveSettings(settings);
};

// Reset to defaults
export const resetToDefaults = (): void => {
  localStorage.removeItem(SETTINGS_KEY);
  initializeSettings();
};

// Export default models for initialization
export const getDefaultModels = (): AIModel[] => DEFAULT_AI_MODELS;
