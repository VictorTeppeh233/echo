import React from 'react';
import { Target, Layers, CheckCircle2, FileText, User } from 'lucide-react';
import { Persona, Goal, MessageSource } from '../types';

interface RightContextPanelProps {
  isOpen: boolean;
  activePersona: Persona | null;
  goals: Goal[];
  recentSources: MessageSource[];
}

export const RightContextPanel: React.FC<RightContextPanelProps> = ({
  isOpen,
  activePersona,
  goals,
  recentSources
}) => {
  if (!isOpen) return null;

  return (
    <aside className="w-72 border-l border-white/[0.08] bg-[#161618] flex flex-col h-full overflow-y-auto select-none p-4 space-y-5 font-apple">
      {/* Identity Summary Card */}
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wider text-[#6e6e73] mb-2 px-0.5">
          Active Persona
        </div>
        <div className="p-3.5 rounded-xl bg-[#1c1c1e] border border-white/[0.06] space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-[#2c2c2e] border border-white/[0.08] flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-[#86868b]" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#f5f5f7]">
                {activePersona?.name || 'Future Self'}
              </h4>
            </div>
          </div>
          <p className="text-xs text-[#86868b] leading-relaxed">
            {activePersona?.description || 'Your accomplished future self.'}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {activePersona?.personality.split(',').map((trait, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.05] text-[#86868b]"
              >
                {trait.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* RAG Retrieved Sources */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-[#6e6e73] mb-2 px-0.5">
          <span>Cited Context</span>
          <span>{recentSources.length}</span>
        </div>
        {recentSources.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#1c1c1e]/50 border border-white/[0.04] text-xs text-[#6e6e73] text-center">
            No document citations in latest response.
          </div>
        ) : (
          <div className="space-y-2">
            {recentSources.map((src, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-[#1c1c1e] border border-white/[0.06] text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 truncate max-w-[160px]">
                    <FileText className="w-3 h-3 text-[#0a84ff] shrink-0" />
                    <span className="truncate text-[#f5f5f7] font-medium text-[12px]">
                      {src.title || src.filename || 'Memory Note'}
                    </span>
                  </div>
                  {src.similarity && (
                    <span className="text-[10px] font-medium text-[#30d158] bg-[#30d158]/10 px-1.5 py-0.5 rounded">
                      {Math.round(src.similarity * 100)}%
                    </span>
                  )}
                </div>
                {src.snippet && (
                  <p className="text-[11px] text-[#86868b] line-clamp-3 leading-relaxed">
                    "{src.snippet}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Roadmap & Goals */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-[#6e6e73] mb-2 px-0.5">
          <span>Active Goals</span>
          <span>{goals.length}</span>
        </div>
        {goals.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#1c1c1e]/50 border border-white/[0.04] text-xs text-[#6e6e73] text-center">
            No active goals recorded.
          </div>
        ) : (
          <div className="space-y-2">
            {goals.slice(0, 4).map((goal) => (
              <div key={goal.id} className="p-3 rounded-xl bg-[#1c1c1e] border border-white/[0.06] text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#f5f5f7] truncate max-w-[170px] text-[12px]">
                    {goal.title}
                  </span>
                  <span className="text-[11px] font-medium text-[#86868b]">{goal.progress}%</span>
                </div>
                <div className="w-full h-1 bg-[#2c2c2e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0a84ff] rounded-full transition-all duration-300"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                {goal.milestones && goal.milestones.length > 0 && (
                  <div className="text-[11px] text-[#6e6e73] flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-[#30d158]" />
                    <span>
                      {goal.milestones.filter((m) => m.completed).length} of {goal.milestones.length} milestones completed
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
