import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Copy, Check, X } from 'lucide-react';
import {
  getSettings,
  getAIModels,
  getDefaultAIModel,
  addAIModel,
  updateAIModel,
  deleteAIModel,
  setDefaultAIModel,
  updateImageProvider,
  setLanguage,
  resetToDefaults
} from '../services/settingsService';
import { AIModel, ImageProvider, Language } from '../types';

export const SettingsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [defaultModel, setDefaultModel] = useState<string>('');
  const [imageProvider, setImageProviderState] = useState<ImageProvider>('unsplash');
  const [language, setLanguageState] = useState<Language>('ar');
  const [showNewModelForm, setShowNewModelForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newModel, setNewModel] = useState({
    name: '',
    provider: 'custom' as const,
    modelName: '',
    apiKey: '',
    imageGeneration: false
  });

  useEffect(() => {
    const settings = getSettings();
    setModels(settings.aiModels);
    setDefaultModel(settings.defaultAIModel);
    setImageProviderState(settings.imageProvider);
    setLanguageState(settings.language);
  }, []);

  const handleAddModel = () => {
    if (!newModel.name || !newModel.modelName || !newModel.apiKey) {
      alert('يرجى ملء جميع الحقول');
      return;
    }

    const added = addAIModel({
      name: newModel.name,
      provider: newModel.provider,
      modelName: newModel.modelName,
      apiKey: newModel.apiKey,
      isDefault: false,
      imageGeneration: newModel.imageGeneration
    });

    setModels([...models, added]);
    setNewModel({
      name: '',
      provider: 'custom',
      modelName: '',
      apiKey: '',
      imageGeneration: false
    });
    setShowNewModelForm(false);
  };

  const handleDeleteModel = (id: string) => {
    if (window.confirm('هل تريد حذف هذا النموذج؟')) {
      deleteAIModel(id);
      setModels(models.filter(m => m.id !== id));
      if (defaultModel === id) {
        const first = models.find(m => m.id !== id);
        if (first) {
          setDefaultAIModel(first.id);
          setDefaultModel(first.id);
        }
      }
    }
  };

  const handleSetDefault = (id: string) => {
    setDefaultAIModel(id);
    setDefaultModel(id);
  };

  const handleUpdateApiKey = (id: string, newKey: string) => {
    updateAIModel(id, { apiKey: newKey });
    setModels(models.map(m => m.id === id ? { ...m, apiKey: newKey } : m));
    setEditingId(null);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleImageProviderChange = (provider: ImageProvider) => {
    updateImageProvider(provider);
    setImageProviderState(provider);
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setLanguageState(lang);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Settings size={24} />
            <h2 className="text-2xl font-bold">الإعدادات المتقدمة</h2>
          </div>
          <button onClick={onClose} className="hover:bg-blue-800 p-2 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Language Settings */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-3">اللغة</h3>
            <div className="flex gap-4">
              <button
                onClick={() => handleLanguageChange('ar')}
                className={`px-4 py-2 rounded ${
                  language === 'ar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                العربية
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-4 py-2 rounded ${
                  language === 'en'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Image Provider */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-3">مصدر الصور</h3>
            <select
              value={imageProvider}
              onChange={(e) => handleImageProviderChange(e.target.value as ImageProvider)}
              className="w-full p-2 border rounded"
            >
              <option value="unsplash">Unsplash (مجاني)</option>
              <option value="pexels">Pexels (مجاني)</option>
              <option value="dall-e">DALL-E (يحتاج API Key)</option>
              <option value="none">بدون صور</option>
            </select>
          </div>

          {/* AI Models */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">نماذج الذكاء الصناعي</h3>
              <button
                onClick={() => setShowNewModelForm(!showNewModelForm)}
                className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700"
              >
                <Plus size={18} />
                إضافة نموذج جديد
              </button>
            </div>

            {/* New Model Form */}
            {showNewModelForm && (
              <div className="bg-white p-4 rounded mb-4 border-2 border-green-300">
                <h4 className="font-bold mb-3">نموذج جديد</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="اسم النموذج"
                    value={newModel.name}
                    onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                  <select
                    value={newModel.provider}
                    onChange={(e) => setNewModel({ ...newModel, provider: e.target.value as any })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="custom">مخصص</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="gemini">Google Gemini</option>
                  </select>
                  <input
                    type="text"
                    placeholder="اسم النموذج (مثل: gpt-4-turbo)"
                    value={newModel.modelName}
                    onChange={(e) => setNewModel({ ...newModel, modelName: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                  <input
                    type="password"
                    placeholder="مفتاح API"
                    value={newModel.apiKey}
                    onChange={(e) => setNewModel({ ...newModel, apiKey: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newModel.imageGeneration}
                      onChange={(e) => setNewModel({ ...newModel, imageGeneration: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span>يدعم توليد الصور</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddModel}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      إضافة
                    </button>
                    <button
                      onClick={() => setShowNewModelForm(false)}
                      className="flex-1 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Models List */}
            <div className="space-y-2">
              {models.map((model) => (
                <div
                  key={model.id}
                  className={`p-4 rounded border-2 ${
                    model.id === defaultModel
                      ? 'bg-blue-50 border-blue-400'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg">{model.name}</h4>
                      <p className="text-sm text-gray-600">
                        {model.provider} • {model.modelName}
                        {model.imageGeneration && ' • 🖼️ توليد صور'}
                      </p>
                    </div>
                    {model.id === defaultModel && (
                      <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold">
                        الافتراضي
                      </span>
                    )}
                  </div>

                  {/* API Key Display */}
                  <div className="mb-3">
                    {editingId === model.id ? (
                      <div className="flex gap-2">
                        <input
                          type="password"
                          defaultValue={model.apiKey}
                          id={`key-${model.id}`}
                          className="flex-1 p-2 border rounded"
                          placeholder="مفتاح API جديد"
                        />
                        <button
                          onClick={() => {
                            const input = document.getElementById(
                              `key-${model.id}`
                            ) as HTMLInputElement;
                            handleUpdateApiKey(model.id, input.value);
                          }}
                          className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-gray-400 text-white px-3 py-2 rounded hover:bg-gray-500"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis">
                          {model.apiKey.substring(0, 10)}...{model.apiKey.substring(-10)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(model.apiKey, model.id)}
                          className="text-blue-600 hover:text-blue-700"
                          title="نسخ المفتاح"
                        >
                          {copiedId === model.id ? (
                            <Check size={16} className="text-green-600" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => setEditingId(model.id)}
                          className="text-orange-600 hover:text-orange-700"
                          title="تعديل"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {model.id !== defaultModel && (
                      <button
                        onClick={() => handleSetDefault(model.id)}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
                      >
                        اجعله الافتراضي
                      </button>
                    )}
                    {!['gemini-default', 'openai-default', 'claude-default'].includes(
                      model.id
                    ) && (
                      <button
                        onClick={() => handleDeleteModel(model.id)}
                        className="flex-1 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        حذف
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (window.confirm('هل تريد إعادة تعيين جميع الإعدادات؟')) {
                  resetToDefaults();
                  window.location.reload();
                }
              }}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              إعادة تعيين الإعدادات
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              حفظ والإغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
