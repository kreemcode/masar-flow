import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import { Dashboard } from './components/Dashboard';
import { WorkflowBuilder } from './components/WorkflowBuilder';
import { WorkflowRun } from './components/WorkflowRun';
import { Settings, Home } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const isRunMode = location.pathname.startsWith('/workflow/');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       {/* Lang Switcher - Only visible on Dashboard/Create for simplicity */}
       {!isRunMode && (
         <div className="fixed top-6 right-4 rtl:right-auto rtl:left-4 z-50">
             <button 
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-3 py-1 rounded-full text-xs font-bold hover:bg-white/30 transition"
             >
                {language === 'en' ? 'العربية' : 'English'}
             </button>
         </div>
       )}

       <main className="flex-1">
         {children}
       </main>
       
       {/* Bottom Navigation for Dashboard */}
       {location.pathname === '/' && (
         <div className="fixed bottom-0 w-full bg-white border-t border-gray-100 flex justify-around p-3 z-40 text-xs font-medium text-gray-500">
            <div className="flex flex-col items-center gap-1 text-teal-600">
                <Home size={24} />
                <span>{t('dashboard')}</span>
            </div>
            {/* Placeholder for Settings/Profile */}
            <div className="flex flex-col items-center gap-1 opacity-50">
                <Settings size={24} />
                <span>Settings</span>
            </div>
         </div>
       )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<WorkflowBuilder />} />
            <Route path="/workflow/:id" element={<WorkflowRun />} />
          </Routes>
        </Layout>
      </Router>
    </LanguageProvider>
  );
};

export default App;