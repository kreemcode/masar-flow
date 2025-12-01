import React from 'react';
import { Step, StepType } from '../types';
import { MapPin, CheckSquare, FileText, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from './LanguageContext';

interface StepViewerProps {
  step: Step;
  onToggleCheck?: (itemId: string, checked: boolean) => void;
}

export const StepViewer: React.FC<StepViewerProps> = ({ step, onToggleCheck }) => {
  const { t } = useLanguage();

  const renderContent = () => {
    switch (step.type) {
      case StepType.GPS:
        return (
          <div className="flex flex-col gap-3">
            <p className="text-gray-600">{step.content}</p>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${step.content}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-blue-100 text-blue-700 p-3 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <MapPin size={20} />
              {t('open_maps')}
            </a>
          </div>
        );
      
      case StepType.CHECKLIST:
        return (
          <div className="flex flex-col gap-2">
            {step.checklistItems?.map((item) => (
              <label key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input 
                  type="checkbox" 
                  checked={item.checked} 
                  onChange={(e) => onToggleCheck && onToggleCheck(item.id, e.target.checked)}
                  className="mt-1 w-5 h-5 text-teal-600 rounded focus:ring-teal-500 border-gray-300"
                />
                <span className={`${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        );

      case StepType.MEDIA:
        return (
          <div className="flex flex-col gap-2">
             {step.content ? (
                <img 
                    src={step.content} 
                    alt={step.title}
                    className="w-full h-auto rounded-lg object-contain bg-gray-100 max-h-[500px] border border-gray-200"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                    }}
                />
             ) : (
                <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                    <ImageIcon size={48} />
                </div>
             )}
          </div>
        );

      case StepType.TEXT:
      default:
        return <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{step.content}</p>;
    }
  };

  const getIcon = () => {
    switch (step.type) {
        case StepType.GPS: return <MapPin className="text-red-500" />;
        case StepType.CHECKLIST: return <CheckSquare className="text-green-500" />;
        case StepType.MEDIA: return <ImageIcon className="text-purple-500" />;
        default: return <FileText className="text-blue-500" />;
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
        {getIcon()}
        <h3 className="font-bold text-lg text-gray-900">{step.title}</h3>
      </div>
      <div className="p-5">
        {renderContent()}
      </div>
    </div>
  );
};