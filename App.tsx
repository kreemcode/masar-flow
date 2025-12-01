import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import { Dashboard } from './components/Dashboard';
import { WorkflowBuilder } from './components/WorkflowBuilder';
import { WorkflowRun } from './components/WorkflowRun';
import { SettingsPanel } from './components/SettingsPanel';
import { AuthPage } from './components/AuthPage';
import { Settings, Home, LogOut } from 'lucide-react';
import { getCurrentUser, signOut, onAuthStateChange } from './services/supabaseService';

const Layout: React.FC<{ children: React.ReactNode; user: any; onLogout: () => void }> = ({ children, user, onLogout }) => {
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const isRunMode = location.pathname.startsWith('/workflow/');
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       {/* Header with User Info */}
       {!isRunMode && user && (
         <div className="bg-white border-b border-gray-100 px-6 py-3 flex justify-between items-center">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
               {user.email?.[0].toUpperCase()}
             </div>
             <div>
               <p className="text-sm font-bold text-gray-800">{user.user_metadata?.full_name || user.email}</p>
               <p className="text-xs text-gray-500">{user.email}</p>
             </div>
           </div>
           <button
             onClick={onLogout}
             className="text-red-600 hover:text-red-700 flex items-center gap-2 px-3 py-2 rounded hover:bg-red-50 transition"
           >
             <LogOut size={18} />
             <span className="text-sm font-bold">تسجيل الخروج</span>
           </button>
         </div>
       )}

       {/* Lang Switcher */}
       {!isRunMode && user && (
         <div className="fixed top-6 right-4 rtl:right-auto rtl:left-4 z-50">
             <button 
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="bg-white/20 backdrop-blur-md border border-white/30 text-gray-800 px-3 py-1 rounded-full text-xs font-bold hover:bg-white/30 transition"
             >
                {language === 'en' ? 'العربية' : 'English'}
             </button>
         </div>
       )}

       <main className="flex-1">
         {children}
       </main>
       
       {/* Bottom Navigation for Dashboard */}
       {location.pathname === '/' && user && (
         <div className="fixed bottom-0 w-full bg-white border-t border-gray-100 flex justify-around p-3 z-40 text-xs font-medium text-gray-500">
            <div className="flex flex-col items-center gap-1 text-teal-600">
                <Home size={24} />
                <span>{t('dashboard')}</span>
            </div>
            <button 
              onClick={() => setShowSettings(true)}
              className="flex flex-col items-center gap-1 hover:text-teal-600 transition"
            >
                <Settings size={24} />
                <span>الإعدادات</span>
            </button>
         </div>
       )}

       {/* Settings Modal */}
       {showSettings && user && (
         <SettingsPanel onClose={() => setShowSettings(false)} />
       )}
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { user: currentUser } = await getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    checkUser();

    // Listen for auth state changes
    const { data: authListener } = onAuthStateChange((newUser) => {
      setUser(newUser);
      setLoading(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-white border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-bold">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={() => {}} />;
  }

  return (
    <LanguageProvider>
      <Router>
        <Layout user={user} onLogout={handleLogout}>
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