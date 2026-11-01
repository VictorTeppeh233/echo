import React from 'react';
import { PanelRightClose, PanelRightOpen, Shield, Sparkles } from 'lucide-react';
import { Persona } from '../types';

interface HeaderProps {
  activePersona: Persona | null;
  mode: string;
  onModeChange: (mode: string) => void;
  isStreaming: boolean;
  rightPanelOpen: boolean;
  onToggleRightPanel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePersona,
  mode,
  onModeChange,
  isStreaming,
  rightPanelOpen,
  onToggleRightPanel
}) => {
  const modes = ['Reflection', 'Strategic Guidance', 'Accountability', 'Decision-Making'];

  return (
    <header className="h-13 border-b border-white/[0.08] bg-[#161618]/80 backdrop-blur-xl px-5 flex items-center justify-between z-10 font-apple">
      {/* Identity & Status */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              isStreaming ? 'bg-[#0a84ff] animate-pulse' : 'bg-[#30d158]'
            }`}
          />
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-[#f5f5f7]">
              {activePersona?.name || 'Future Self'}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-[#86868b] border border-white/[0.05]">
              {isStreaming ? 'Synthesizing' : 'Synchronized'}
            </span>
          </div>
        </div>
      </div>

      {/* Mode Segmented Control & Inspector Toggle */}
      <div className="flex items-center space-x-3">
        {/* Apple Segmented Control */}
        <div className="hidden lg:flex items-center bg-[#1c1c1e] p-0.5 rounded-lg border border-white/[0.08]">
          {modes.map((m) => {
            const isSelected = mode === m;
            return (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  isSelected
                    ? 'bg-[#2c2c2e] text-white shadow-sm'
                    : 'text-[#86868b] hover:text-[#f5f5f7]'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>

        {/* Mobile / Tablet dropdown mode fallback */}
        <div className="flex lg:hidden items-center bg-[#1c1c1e] rounded-lg border border-white/[0.08] px-2 py-1">
          <select
            value={mode}
            onChange={(e) => onModeChange(e.target.value)}
            className="bg-transparent text-xs text-[#f5f5f7] focus:outline-none cursor-pointer"
          >
            {modes.map((m) => (
              <option key={m} value={m} className="bg-[#1c1c1e] text-[#f5f5f7]">
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Local Security Badge */}
        <div className="hidden sm:flex items-center space-x-1.5 text-xs text-[#86868b] px-2.5 py-1 rounded-lg bg-[#1c1c1e] border border-white/[0.06]">
          <Shield className="w-3.5 h-3.5 text-[#30d158]" />
          <span>Local Storage</span>
        </div>

        {/* Context Inspector Toggle */}
        <button
          onClick={onToggleRightPanel}
          className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#86868b] hover:text-[#f5f5f7] transition-colors border border-white/[0.08]"
          title="Toggle Context Inspector"
        >
          {rightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
