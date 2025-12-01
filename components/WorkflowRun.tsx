import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { db } from '../services/db';
import { StepViewer } from './StepViewer';
import { useLanguage } from './LanguageContext';
import { Step } from '../types';

export const WorkflowRun: React.FC = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const workflow = useLiveQuery(
    () => db.workflows.get(Number(id)),
    [id]
  );

  if (!workflow) return <div className="p-8 text-center">{t('generating')}</div>;

  const currentStep = workflow.steps[currentStepIndex];
  const progress = ((currentStepIndex) / workflow.steps.length) * 100;

  const handleNext = () => {
    if (currentStepIndex < workflow.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      // Completed logic could go here
    }
  };
  
  const handleChecklistToggle = async (itemId: string, checked: boolean) => {
      // Create a deep copy of steps to mutate
      const newSteps = [...workflow.steps];
      const stepIndex = newSteps.findIndex(s => s.id === currentStep.id);
      if(stepIndex === -1) return;

      const step = { ...newSteps[stepIndex] };
      if (step.checklistItems) {
          step.checklistItems = step.checklistItems.map(i => i.id === itemId ? { ...i, checked } : i);
          newSteps[stepIndex] = step;
          
          // Update DB
          await db.workflows.update(Number(id), { steps: newSteps });
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Navbar */}
      <div className="bg-white px-4 py-3 shadow-sm flex items-center gap-4 sticky top-0 z-20">
        <Link to="/" className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
            <ArrowLeft className="rtl:rotate-180" />
        </Link>
        <div className="flex-1">
            <h1 className="font-bold text-gray-800 line-clamp-1">{workflow.title}</h1>
            <div className="text-xs text-gray-500">{t('step')} {currentStepIndex + 1} / {workflow.steps.length}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-200 w-full">
        <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto space-y-6 mt-4">
        <StepViewer step={currentStep} onToggleCheck={handleChecklistToggle} />
      </div>

      {/* Footer Controls */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 flex justify-between items-center max-w-2xl mx-auto right-0 z-20">
        <button 
          onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
          disabled={currentStepIndex === 0}
          className="text-gray-500 font-semibold px-4 py-2 disabled:opacity-30"
        >
          Back
        </button>

        {currentStepIndex < workflow.steps.length - 1 ? (
             <button 
                onClick={handleNext}
                className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 shadow-lg shadow-teal-200 transition-transform active:scale-95 flex items-center gap-2"
            >
                {t('continue')}
                <ArrowLeft className="rotate-180 rtl:rotate-0" size={20} />
            </button>
        ) : (
            <button 
                className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 flex items-center gap-2"
            >
                <CheckCircle2 size={20} />
                {t('completed')}
            </button>
        )}
      </div>
    </div>
  );
};