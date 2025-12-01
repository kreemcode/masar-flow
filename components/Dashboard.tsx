import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Plus, Search, Book, Lock, Globe, ChevronRight } from 'lucide-react';
import { db } from '../services/db';
import { useLanguage } from './LanguageContext';

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<'private' | 'public'>('private');
  const [search, setSearch] = useState('');
  
  const workflows = useLiveQuery(
    () => db.workflows
      .filter(w => {
         const matchesFilter = filter === 'private' ? w.isPrivate : !w.isPrivate;
         const matchesSearch = w.title.toLowerCase().includes(search.toLowerCase());
         return matchesFilter && matchesSearch;
      })
      .reverse() // Newest first
      .toArray(),
    [filter, search]
  );

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-teal-700 text-white p-6 pb-12 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="relative z-10 flex justify-between items-start">
           <div>
               <h1 className="text-3xl font-bold mb-1">{t('app_name')}</h1>
               <p className="text-teal-100 opacity-80 text-sm">Your guide to achievement.</p>
           </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative z-10 mt-6">
            <div className="relative">
                <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-teal-200" size={20} />
                <input 
                    type="text" 
                    placeholder={t('search_placeholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-teal-800/50 backdrop-blur-md text-white placeholder-teal-300 rounded-xl py-3 pl-10 rtl:pl-3 rtl:pr-10 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-400 border border-teal-600/30"
                />
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 px-6 -mt-6 relative z-20 mb-6">
        <button 
            onClick={() => setFilter('private')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl shadow-sm transition-all font-semibold ${filter === 'private' ? 'bg-white text-teal-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
            <Lock size={16} />
            {t('my_workflows')}
        </button>
        <button 
             onClick={() => setFilter('public')}
             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl shadow-sm transition-all font-semibold ${filter === 'public' ? 'bg-white text-teal-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
            <Globe size={16} />
            {t('public_workflows')}
        </button>
      </div>

      {/* List */}
      <div className="px-4 space-y-3">
        {workflows?.length === 0 ? (
             <div className="text-center py-12 text-gray-400">
                 <Book size={48} className="mx-auto mb-4 opacity-20" />
                 <p>{t('empty_state')}</p>
             </div>
        ) : (
            workflows?.map(workflow => (
                <Link to={`/workflow/${workflow.id}`} key={workflow.id} className="block bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition active:scale-[0.98]">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg mb-1">{workflow.title}</h3>
                            <p className="text-gray-500 text-sm line-clamp-2">{workflow.description}</p>
                        </div>
                        <ChevronRight className="text-gray-300 mt-1 rtl:rotate-180" size={20} />
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                        <span className="bg-gray-100 px-2 py-1 rounded-md text-gray-600 font-medium">
                            {workflow.steps.length} {t('steps')}
                        </span>
                        <span>•</span>
                        <span>{new Date(workflow.createdAt).toLocaleDateString()}</span>
                    </div>
                </Link>
            ))
        )}
      </div>

      {/* Floating Action Button */}
      <Link 
        to="/create" 
        className="fixed bottom-6 right-6 rtl:right-auto rtl:left-6 w-14 h-14 bg-teal-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-teal-700 hover:scale-110 transition z-50"
      >
        <Plus size={28} />
      </Link>
    </div>
  );
};