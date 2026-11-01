import React from 'react';
import {
  MessageSquare, LayoutDashboard, Target,
  Brain, FileText, BookOpen, Settings,
  Cpu, Sparkles, ChevronDown
} from 'lucide-react';
import { NavTab, Persona, OllamaStatus } from '../types';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activePersona: Persona | null;
  personas: Persona[];
  onSelectPersona: (personaId: string) => void;
  ollamaStatus: OllamaStatus | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activePersona,
  personas,
  onSelectPersona,
  ollamaStatus
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'chat', label: 'Echo Chat', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'goals', label: 'Goals & Milestones', icon: <Target className="w-4 h-4" /> },
    { id: 'memories', label: 'Memory Archive', icon: <Brain className="w-4 h-4" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
    { id: 'journal', label: 'Journal', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-60 bg-[#111113] border-r border-white/[0.08] flex flex-col h-screen select-none font-apple">
      {/* Brand Header - Apple Mac style */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-[#2c2c2e] to-[#1c1c1e] border border-white/[0.12] flex items-center justify-center shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-white/90" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-sm tracking-tight text-[#f5f5f7]">ECHO</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/[0.08] text-[#86868b]">
                Local
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Persona Selection */}
      <div className="px-3.5 py-3 border-b border-white/[0.06]">
        <div className="text-[11px] font-medium text-[#6e6e73] px-2 mb-1.5 tracking-wider uppercase">
          Future Identity
        </div>
        {personas.length > 0 ? (
          <div className="relative">
            <select
              value={activePersona?.id || ''}
              onChange={(e) => onSelectPersona(e.target.value)}
              className="w-full appearance-none bg-[#1c1c1e] hover:bg-[#242426] border border-white/[0.08] text-xs rounded-lg px-2.5 py-2 text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff] cursor-pointer transition-colors pr-7"
            >
              {personas.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#1c1c1e] text-[#f5f5f7]">
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#86868b] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        ) : (
          <div className="px-2 py-1 text-xs text-[#86868b] italic">Unassigned Persona</div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        <div className="text-[11px] font-medium text-[#6e6e73] px-2.5 py-1 tracking-wider uppercase">
          Views
        </div>
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
                isActive
                  ? 'bg-white/[0.1] text-white shadow-sm'
                  : 'text-[#86868b] hover:text-[#f5f5f7] hover:bg-white/[0.04]'
              }`}
            >
              <span className={isActive ? 'text-[#0a84ff]' : 'text-[#86868b]'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom System Status */}
      <div className="p-3 border-t border-white/[0.06] bg-[#111113]">
        <div className="flex items-center justify-between text-xs px-2.5 py-2 rounded-lg bg-[#1c1c1e] border border-white/[0.06]">
          <div className="flex items-center space-x-2">
            <Cpu className="w-3.5 h-3.5 text-[#86868b]" />
            <span className="text-[12px] text-[#86868b]">Ollama Engine</span>
          </div>
          <div className="flex items-center space-x-1.5">
            {ollamaStatus?.available ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#30d158]" />
                <span className="text-[11px] text-[#30d158] font-medium">Ready</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#ff453a]" />
                <span className="text-[11px] text-[#ff453a] font-medium">Offline</span>
              </>
            )}
          </div>
        </div>
        {ollamaStatus?.chat_model && (
          <div className="mt-1 px-2.5 text-[11px] text-[#6e6e73] truncate">
            {ollamaStatus.chat_model}
          </div>
        )}
      </div>
    </aside>
  );
};
