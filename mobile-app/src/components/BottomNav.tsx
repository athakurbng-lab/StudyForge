import React from 'react';
import { Clock, BookOpen, Users, PenTool, BarChart2, Settings as SettingsIcon } from 'lucide-react';

export type NavTab = 'timer' | 'syllabus' | 'groups' | 'studio' | 'analytics' | 'settings';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'timer' as NavTab, label: 'Timer', icon: Clock },
    { id: 'syllabus' as NavTab, label: 'Syllabus', icon: BookOpen },
    { id: 'groups' as NavTab, label: 'Groups', icon: Users },
    { id: 'studio' as NavTab, label: 'Studio', icon: PenTool },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart2 },
    { id: 'settings' as NavTab, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe-nav transition-colors">
      <div className="grid grid-cols-6 h-14 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors select-none ${
                isActive
                  ? 'text-rose-600 dark:text-rose-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
