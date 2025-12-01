import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Using react-router-dom inside HashRouter
import { Plus, Save, Wand2, Trash2, MapPin, List, Type, Image as ImageIcon, Camera, X, Globe, Search } from 'lucide-react';
import { db } from '../services/db';
import { Step, StepType, Workflow } from '../types';
import { generateWorkflowFromPrompt } from '../services/geminiService';
import { useLanguage } from './LanguageContext';

export const WorkflowBuilder: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [steps, setSteps] = useState<Step[]>([]);
  
  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [useSearch, setUseSearch] = useState(true);
  const [includeMedia, setIncludeMedia] = useState(true);

  const handleAddStep = (type: StepType) => {
    const newStep: Step = {
      id: Date.now().toString(),
      title: '',
      type,
      content: '',
      checklistItems: type === StepType.CHECKLIST ? [] : undefined,
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (id: string, field: keyof Step, value: any) => {
    setSteps(steps.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const handleSave = async () => {
    if (!title) return;
    const workflow: Workflow = {
      title,
      description,
      isPrivate,
      createdAt: Date.now(),
      steps
    };
    await db.workflows.add(workflow);
    navigate('/');
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    const result = await generateWorkflowFromPrompt(aiPrompt, language, { useSearch, includeMedia });
    setIsGenerating(false);
    if (result) {
      setTitle(result.title);
      setDescription(result.description);
      setSteps(result.steps);
    }
  };

  // Helper to get GPS location
  const handleGetLocation = (stepId: string) => {
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              (position) => {
                  updateStep(stepId, 'content', `${position.coords.latitude},${position.coords.longitude}`);
              },
              (error) => {
                  alert("Error getting location: " + error.message);
              }
          );
      } else {
          alert("Geolocation is not supported by this browser.");
      }
  }

  // Helper to handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, stepId: string) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              // Store Base64 string in content
              updateStep(stepId, 'content', reader.result);
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 border-b p-4 shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold text-teal-700">{t('create_new')}</h1>
        <button 
          onClick={handleSave} 
          disabled={!title}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 hover:bg-teal-700 transition"
        >
          <Save size={18} />
          <span className="hidden sm:inline">{t('save_workflow')}</span>
        </button>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        
        {/* AI Section */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
          <div className="flex gap-2 items-center mb-3">
             <Wand2 className="text-indigo-600" size={24} />
             <h3 className="font-bold text-indigo-900">{t('ai_generate')}</h3>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
                <input 
                type="text" 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={t('ai_prompt_placeholder')}
                className="flex-1 p-3 rounded-xl border-indigo-200 border focus:ring-2 focus:ring-indigo-300 outline-none"
                />
                <button 
                onClick={handleAiGenerate}
                disabled={isGenerating || !aiPrompt}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center min-w-[60px]"
                >
                {isGenerating ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <Wand2 size={20} />}
                </button>
            </div>
            
            {/* AI Options */}
            <div className="flex flex-wrap gap-4 px-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-indigo-800 bg-white/50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-white transition">
                    <input 
                        type="checkbox" 
                        checked={useSearch} 
                        onChange={(e) => setUseSearch(e.target.checked)} 
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <Globe size={14} />
                    <span>{t('ai_option_search')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-indigo-800 bg-white/50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-white transition">
                    <input 
                        type="checkbox" 
                        checked={includeMedia} 
                        onChange={(e) => setIncludeMedia(e.target.checked)} 
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <ImageIcon size={14} />
                    <span>{t('ai_option_media')}</span>
                </label>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <input 
            className="w-full text-2xl font-bold placeholder-gray-300 border-none focus:ring-0 p-0" 
            placeholder={t('title')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea 
            className="w-full text-gray-600 placeholder-gray-300 border-none focus:ring-0 p-0 resize-none" 
            placeholder={t('description')}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex items-center gap-4 text-sm text-gray-600 border-t pt-4">
            <span className="font-semibold">{t('privacy')}:</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={isPrivate} onChange={() => setIsPrivate(true)} className="text-teal-600" />
              {t('private')}
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={!isPrivate} onChange={() => setIsPrivate(false)} className="text-teal-600" />
              {t('public')}
            </label>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-700 px-1">{t('steps')}</h2>
          
          {steps.map((step, index) => (
            <div key={step.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group transition-all hover:shadow-md">
              <button 
                onClick={() => removeStep(step.id)} 
                className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-gray-300 hover:text-red-500 transition-colors z-10"
              >
                <Trash2 size={18} />
              </button>
              
              <div className="flex items-center gap-2 mb-3 text-teal-600 text-sm font-semibold uppercase tracking-wider">
                 <span className="bg-teal-50 px-2 py-1 rounded">Step {index + 1}</span>
                 <span className="text-gray-400">|</span>
                 <span>{t(`type_${step.type}`)}</span>
              </div>

              <input 
                className="w-full font-bold mb-2 border-b border-gray-100 pb-2 focus:border-teal-500 focus:outline-none"
                placeholder={t('title')}
                value={step.title}
                onChange={(e) => updateStep(step.id, 'title', e.target.value)}
              />

              {step.type === StepType.TEXT && (
                <textarea 
                  className="w-full p-3 bg-gray-50 rounded-lg border-none text-sm"
                  rows={3}
                  placeholder={t('description')}
                  value={step.content}
                  onChange={(e) => updateStep(step.id, 'content', e.target.value)}
                />
              )}

              {step.type === StepType.GPS && (
                <div className="flex gap-2">
                    <input 
                        className="flex-1 p-3 bg-gray-50 rounded-lg border-none text-sm"
                        placeholder={t('coordinates')}
                        value={step.content}
                        onChange={(e) => updateStep(step.id, 'content', e.target.value)}
                    />
                    <button 
                        onClick={() => handleGetLocation(step.id)}
                        className="bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-100"
                    >
                        <MapPin size={16} />
                    </button>
                </div>
              )}

              {step.type === StepType.CHECKLIST && (
                  <div className="space-y-2">
                      <div className="text-sm text-gray-400 italic">Checklist items generated by AI or add manually (Simple text edit for now)</div>
                      <textarea 
                        className="w-full p-3 bg-gray-50 rounded-lg border-none text-sm"
                        rows={3}
                        placeholder="Enter items separated by comma for manual entry..."
                        value={step.checklistItems?.map(i => i.label).join(', ') || ''}
                        onChange={(e) => {
                            const items = e.target.value.split(',').map((label, idx) => ({
                                id: `new-${idx}`, label: label.trim(), checked: false
                            })).filter(i => i.label);
                            updateStep(step.id, 'checklistItems', items);
                        }}
                        />
                  </div>
              )}

               {step.type === StepType.MEDIA && (
                <div className="space-y-3">
                   {step.content ? (
                        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                            <img 
                                src={step.content} 
                                alt="Step Preview" 
                                className="w-full h-48 object-contain" 
                                onError={(e) => (e.currentTarget.style.display = 'none')} 
                            />
                            <button 
                                onClick={() => updateStep(step.id, 'content', '')}
                                className="absolute top-2 right-2 bg-red-600/90 text-white p-1.5 rounded-full shadow-md hover:bg-red-700 transition"
                                title={t('remove_image')}
                            >
                                <X size={16} />
                            </button>
                        </div>
                   ) : (
                       <div className="flex flex-col gap-2">
                            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                                <div className="flex flex-col items-center gap-2 text-gray-500">
                                    <Camera size={32} className="text-teal-500" />
                                    <span className="text-sm font-semibold">{t('upload_image')}</span>
                                </div>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handleImageUpload(e, step.id)}
                                />
                            </label>
                            
                            <div className="text-center text-xs text-gray-400 font-medium">
                                - {t('or_paste_url')} -
                            </div>

                            <input 
                                className="w-full p-3 bg-white rounded-lg border border-gray-200 text-sm"
                                placeholder="https://example.com/image.jpg"
                                value={step.content}
                                onChange={(e) => updateStep(step.id, 'content', e.target.value)}
                            />
                       </div>
                   )}
                </div>
              )}

            </div>
          ))}
        </div>

        {/* Add Step Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
          <button onClick={() => handleAddStep(StepType.TEXT)} className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition border border-gray-100">
            <Type className="text-blue-500" />
            <span className="text-xs font-bold text-gray-600">{t('type_text')}</span>
          </button>
          <button onClick={() => handleAddStep(StepType.MEDIA)} className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition border border-gray-100">
            <ImageIcon className="text-purple-500" />
            <span className="text-xs font-bold text-gray-600">{t('type_media')}</span>
          </button>
          <button onClick={() => handleAddStep(StepType.GPS)} className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition border border-gray-100">
            <MapPin className="text-red-500" />
            <span className="text-xs font-bold text-gray-600">{t('type_gps')}</span>
          </button>
          <button onClick={() => handleAddStep(StepType.CHECKLIST)} className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition border border-gray-100">
            <List className="text-green-500" />
            <span className="text-xs font-bold text-gray-600">{t('type_checklist')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};