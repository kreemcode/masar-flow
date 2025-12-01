import React from 'react';
import { getAIModels, getDefaultAIModel } from '../services/settingsService';
import { AIModel } from '../types';

interface ModelSelectorProps {
  selectedModel: AIModel | null;
  onModelChange: (model: AIModel) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelChange }) => {
  const models = getAIModels().filter(m => m.apiKey); // Only show models with API keys configured
  const defaultModel = getDefaultAIModel();

  if (models.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        <p className="font-bold mb-1">⚠️ لا توجد نماذج مُعدّة</p>
        <p>الرجاء إضافة مفتاح API لنموذج في الإعدادات أولاً</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-gray-700">اختر نموذج الذكاء الصناعي</label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {models.map(model => (
          <button
            key={model.id}
            onClick={() => onModelChange(model)}
            className={`p-4 rounded-lg border-2 transition text-left ${
              selectedModel?.id === model.id
                ? 'bg-blue-50 border-blue-500 shadow-md'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="font-bold text-sm">{model.name}</div>
              {model.id === defaultModel?.id && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">الافتراضي</span>
              )}
            </div>
            <p className="text-xs text-gray-600 mb-2">
              {model.provider} • {model.modelName}
            </p>
            {model.imageGeneration && (
              <div className="text-xs text-green-600 flex items-center gap-1">
                ✅ يدعم توليد الصور
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
