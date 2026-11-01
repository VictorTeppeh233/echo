import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Cpu, Terminal } from 'lucide-react';

interface WelcomeModalProps {
  onStartOnboarding: () => void;
  ollamaAvailable: boolean;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  onStartOnboarding,
  ollamaAvailable
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#080A0F]/95 backdrop-blur-2xl flex items-center justify-center p-6 terminal-grid">
      <div className="max-w-2xl w-full bg-background-secondary border border-border rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-accent-cyan/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-accent-violet/10 blur-3xl pointer-events-none" />

        {/* Top header badge */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-background-panel border border-border text-[11px] font-mono text-accent-cyan">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NEURAL TEMPORAL COMPANION</span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-mono">
            {ollamaAvailable ? (
              <span className="flex items-center space-x-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                <span>OLLAMA DETECTED</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>LOCAL DAEMON READY</span>
              </span>
            )}
          </div>
        </div>

        {/* Product Identity */}
        <div className="space-y-4 mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold font-heading tracking-widest text-text-primary">
            ECHO
          </h1>
          <h2 className="text-lg md:text-xl font-heading font-medium tracking-wide text-accent-cyan">
            YOUR FUTURE SELF IS WAITING.
          </h2>
          <p className="text-base text-text-secondary leading-relaxed pt-2">
            What if you could have a conversation with the person you are working so hard to become?
          </p>
        </div>

        {/* Architecture Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
          <div className="p-3 rounded-lg bg-background-panel/60 border border-border">
            <Cpu className="w-4 h-4 text-accent-cyan mb-1.5" />
            <h4 className="text-xs font-semibold text-text-primary">Local-First</h4>
            <p className="text-[11px] text-text-secondary mt-0.5">100% private inference on local Ollama runtime.</p>
          </div>
          <div className="p-3 rounded-lg bg-background-panel/60 border border-border">
            <Terminal className="w-4 h-4 text-accent-violet mb-1.5" />
            <h4 className="text-xs font-semibold text-text-primary">RAG Vector Memory</h4>
            <p className="text-[11px] text-text-secondary mt-0.5">Retrieves your roadmap, notes, and progress.</p>
          </div>
          <div className="p-3 rounded-lg bg-background-panel/60 border border-border">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1.5" />
            <h4 className="text-xs font-semibold text-text-primary">No External Cloud</h4>
            <p className="text-[11px] text-text-secondary mt-0.5">Zero telemetry. Your memories never leave your device.</p>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onStartOnboarding}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-accent-cyan text-[#080A0F] font-heading font-bold text-sm tracking-wide flex items-center justify-center space-x-2 hover:bg-[#72e6ea] transition-all duration-200 shadow-[0_0_20px_rgba(93,225,230,0.4)] hover:shadow-[0_0_25px_rgba(93,225,230,0.6)] cursor-pointer"
          >
            <span>Meet Your Future Self</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-text-muted">
            Your ambitions. Your memories. Your future.
          </span>
        </div>
      </div>
    </div>
  );
};
