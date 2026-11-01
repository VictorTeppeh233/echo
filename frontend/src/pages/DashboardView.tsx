import React, { useState, useEffect, useMemo } from 'react';
import {
  Target, Sparkles, BookOpen, FileText, CheckCircle2,
  Clock, ArrowRight, Brain, Zap, MessageSquare, Shield,
  Cpu, Terminal, Plus, Layers, Activity, TrendingUp,
  BarChart2, HardDrive, Check
} from 'lucide-react';
import {
  UserProfile, Persona, Goal, JournalEntry,
  DocumentItem, Conversation, OllamaStatus, SystemStats
} from '../types';
import { api } from '../services/api';

interface DashboardViewProps {
  userProfile: UserProfile | null;
  activePersona: Persona | null;
  personas: Persona[];
  goals: Goal[];
  journalEntries: JournalEntry[];
  documents: DocumentItem[];
  conversations: Conversation[];
  ollamaStatus?: OllamaStatus | null;
  onNavigateTab: (tab: any) => void;
  onRefreshData: () => void;
  onStartOnboarding: () => void;
  onOpenNewConversation: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userProfile,
  activePersona,
  personas,
  goals,
  journalEntries,
  documents,
  conversations,
  ollamaStatus,
  onNavigateTab,
  onRefreshData,
  onStartOnboarding,
  onOpenNewConversation
}) => {
  const [reflectionInput, setReflectionInput] = useState('');
  const [isSubmittingReflection, setIsSubmittingReflection] = useState(false);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    api.getSystemStatus().then(setSystemStats).catch(() => null);
  }, [goals, journalEntries, documents, conversations]);

  // Goal & Milestone Metrics
  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.status === 'completed' || g.progress === 100).length;
  const activeGoals = totalGoals - completedGoals;
  const avgGoalProgress = totalGoals > 0 ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / totalGoals) : 0;

  const totalMilestones = goals.reduce((acc, g) => acc + (g.milestones?.length || 0), 0);
  const completedMilestones = goals.reduce(
    (acc, g) => acc + (g.milestones?.filter((m) => m.completed).length || 0),
    0
  );
  const milestoneVelocity = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  // Knowledge & Memory Metrics
  const totalChunks = documents.reduce((acc, d) => acc + (d.chunk_count || 0), 0);
  const totalDocSize = documents.reduce((acc, d) => acc + (d.file_size || 0), 0);
  const totalMemories = systemStats?.stats.memories ?? 0;
  const totalMessages = systemStats?.stats.messages ?? 0;

  // Temporal Alignment Score (0-100)
  const journalScore = Math.min(100, journalEntries.length * 25);
  const knowledgeScore = Math.min(100, (documents.length * 30) + (totalMemories * 10));
  const temporalAlignmentScore = Math.min(
    100,
    Math.round(
      (avgGoalProgress * 0.4) +
      (milestoneVelocity * 0.25) +
      (journalScore * 0.2) +
      (knowledgeScore * 0.15)
    )
  );

  // Group goals by category
  const categoryStats = useMemo(() => {
    const map: Record<string, { count: number; totalProgress: number }> = {};
    goals.forEach((g) => {
      const cat = g.category || 'General';
      if (!map[cat]) map[cat] = { count: 0, totalProgress: 0 };
      map[cat].count += 1;
      map[cat].totalProgress += g.progress;
    });
    return Object.entries(map).map(([category, data]) => ({
      category,
      count: data.count,
      avgProgress: Math.round(data.totalProgress / data.count)
    }));
  }, [goals]);

  const handleQuickReflection = async (promptQuestion: string) => {
    if (!reflectionInput.trim()) return;
    setIsSubmittingReflection(true);
    try {
      await api.createJournal({
        title: `Reflection: ${promptQuestion.slice(0, 45)}...`,
        content: `Prompt: ${promptQuestion}\n\nReflection: ${reflectionInput.trim()}`,
        persona_id: activePersona?.id,
        mood: 'Focused'
      });
      setReflectionInput('');
      onRefreshData();
      alert('Reflection committed to vector memory.');
    } catch (err) {
      console.error('Failed to save reflection:', err);
    } finally {
      setIsSubmittingReflection(false);
    }
  };

  const reflectionPrompts = [
    "What did you do today that moved you closer to your future?",
    "Which obstacle or difficult task are you currently avoiding?",
    "What would your future self want you to prioritize this week?"
  ];
  const [selectedPrompt, setSelectedPrompt] = useState(reflectionPrompts[0]);

  // If user is not yet onboarded, show the futuristic Welcome Launchpad with Live System Telemetry
  if (!userProfile) {
    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 bg-background terminal-grid">
        {/* Hero Welcome Card */}
        <div className="relative max-w-4xl mx-auto p-8 md:p-12 rounded-3xl bg-background-secondary border border-border overflow-hidden shadow-2xl">
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-accent-cyan/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-accent-violet/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-background-panel border border-border text-[11px] font-mono text-accent-cyan w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TEMPORAL INTELLIGENCE PLATFORM</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl md:text-6xl font-extrabold font-heading tracking-widest text-text-primary">
                ECHO
              </h1>
              <h2 className="text-lg md:text-2xl font-heading font-medium tracking-wide text-accent-cyan">
                YOUR FUTURE SELF IS WAITING.
              </h2>
              <p className="text-sm md:text-base text-text-secondary leading-relaxed max-w-2xl pt-2">
                What if you could have an ongoing conversation with the person you are working so hard to become?
                ECHO simulates an accomplished, experienced version of your future identity powered entirely by local AI and personal RAG memory.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                onClick={onStartOnboarding}
                className="px-8 py-3.5 rounded-xl bg-accent-cyan text-[#080A0F] font-heading font-bold text-sm tracking-wider flex items-center space-x-2 hover:bg-[#72e6ea] shadow-[0_0_20px_rgba(93,225,230,0.4)] transition-all cursor-pointer"
              >
                <span>Initialize Your Future Self</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-text-muted">
                100% Local-First • No Cloud APIs • Zero Telemetry
              </span>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-background-panel border border-border space-y-2">
            <Cpu className="w-5 h-5 text-accent-cyan" />
            <h3 className="text-sm font-semibold text-text-primary">Local Ollama Runtime</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Inference runs strictly on your machine. Compatible with any open-weights model installed in Ollama.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-background-panel border border-border space-y-2">
            <Terminal className="w-5 h-5 text-accent-violet" />
            <h3 className="text-sm font-semibold text-text-primary">ChromaDB Vector Vault</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Your roadmaps, study notes, and journal entries are embedded and retrieved in real-time during conversations.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-background-panel border border-border space-y-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-text-primary">Multiple Future Selves</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Create and switch between distinct personas (researcher, founder, athlete, leader) for tailored guidance.
            </p>
          </div>
        </div>

        {/* Live System Telemetry & Vault Metrics */}
        <div className="max-w-4xl mx-auto p-6 rounded-2xl bg-background-secondary border border-border space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center space-x-2 text-xs font-mono text-accent-cyan uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>LIVE SYSTEM TELEMETRY & VAULT METRICS</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              100% AIR-GAPPED LOCALHOST
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-background-panel border border-border space-y-1">
              <span className="text-[11px] font-mono text-text-muted uppercase">Inference Engine</span>
              <div className="text-sm font-semibold text-text-primary flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{ollamaStatus?.chat_model || 'gemma4:latest'}</span>
              </div>
              <p className="text-[10px] font-mono text-text-muted">localhost:11434</p>
            </div>

            <div className="p-3.5 rounded-xl bg-background-panel border border-border space-y-1">
              <span className="text-[11px] font-mono text-text-muted uppercase">Vector Embedder</span>
              <div className="text-sm font-semibold text-text-primary">
                {ollamaStatus?.embed_model || 'all-minilm:latest'}
              </div>
              <p className="text-[10px] font-mono text-accent-cyan">384-dimensional dense</p>
            </div>

            <div className="p-3.5 rounded-xl bg-background-panel border border-border space-y-1">
              <span className="text-[11px] font-mono text-text-muted uppercase">Vector Vault</span>
              <div className="text-sm font-semibold text-text-primary">ChromaDB Local</div>
              <p className="text-[10px] font-mono text-text-muted">0 Cloud Telemetry</p>
            </div>

            <div className="p-3.5 rounded-xl bg-background-panel border border-border space-y-1">
              <span className="text-[11px] font-mono text-text-muted uppercase">Security Layer</span>
              <div className="text-sm font-semibold text-emerald-400">Zero Cloud Egress</div>
              <p className="text-[10px] font-mono text-text-muted">Private SQLite Store</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // When User is Onboarded - Apple Inspired Modern Metrics Command Center
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-[#000000] font-apple">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Apple Large Title Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/[0.06]">
          <div className="space-y-1">
            <div className="text-[12px] font-medium tracking-wider uppercase text-[#86868b]">
              Overview & Performance Metrics
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#f5f5f7]">
              Welcome back, {userProfile.name}.
            </h1>
            <p className="text-sm text-[#86868b]">
              Calibrated persona:{' '}
              <span className="text-[#f5f5f7] font-medium">
                {activePersona?.name || 'Future Self'}
              </span>
              {' '}• All RAG memory and neural telemetry updated locally.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenNewConversation}
              className="px-4 py-2 rounded-xl bg-[#0a84ff] hover:bg-[#0071e3] text-white text-sm font-medium flex items-center space-x-2 transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Session</span>
            </button>
          </div>
        </div>

        {/* PRIMARY METRICS RIBBON - Apple Inset Cards with Progress Tracks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Goal Velocity */}
          <div className="p-4 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] hover:bg-[#242426] transition-colors space-y-3">
            <div className="flex items-center justify-between text-xs font-medium text-[#86868b]">
              <span>Goal Roadmap</span>
              <Target className="w-4 h-4 text-[#0a84ff]" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-[#f5f5f7] tracking-tight">
                {avgGoalProgress}% <span className="text-xs text-[#86868b] font-normal">avg progress</span>
              </div>
              <p className="text-[11px] text-[#6e6e73] mt-0.5">
                {activeGoals} active • {completedGoals} achieved
              </p>
            </div>
            <div className="w-full h-1.5 bg-[#2c2c2e] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0a84ff] rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, avgGoalProgress)}%` }}
              />
            </div>
          </div>

          {/* Card 2: Milestone Execution */}
          <div className="p-4 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] hover:bg-[#242426] transition-colors space-y-3">
            <div className="flex items-center justify-between text-xs font-medium text-[#86868b]">
              <span>Checkpoints</span>
              <CheckCircle2 className="w-4 h-4 text-[#30d158]" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-[#f5f5f7] tracking-tight">
                {completedMilestones} <span className="text-xs text-[#86868b] font-normal">/ {totalMilestones} done</span>
              </div>
              <p className="text-[11px] text-[#6e6e73] mt-0.5">
                {milestoneVelocity}% checkpoint velocity
              </p>
            </div>
            <div className="w-full h-1.5 bg-[#2c2c2e] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#30d158] rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, milestoneVelocity)}%` }}
              />
            </div>
          </div>

          {/* Card 3: Vector Knowledge Vault */}
          <div className="p-4 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] hover:bg-[#242426] transition-colors space-y-3">
            <div className="flex items-center justify-between text-xs font-medium text-[#86868b]">
              <span>Knowledge Vault</span>
              <Layers className="w-4 h-4 text-[#ff9f0a]" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-[#f5f5f7] tracking-tight">
                {totalChunks} <span className="text-xs text-[#86868b] font-normal">chunks</span>
              </div>
              <p className="text-[11px] text-[#6e6e73] mt-0.5">
                {documents.length} docs • {totalMemories} memories
              </p>
            </div>
            <div className="w-full h-1.5 bg-[#2c2c2e] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ff9f0a] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, totalChunks * 8))}%` }}
              />
            </div>
          </div>

          {/* Card 4: Reflection & Dialogue */}
          <div className="p-4 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] hover:bg-[#242426] transition-colors space-y-3">
            <div className="flex items-center justify-between text-xs font-medium text-[#86868b]">
              <span>Reflections & Dialogue</span>
              <BookOpen className="w-4 h-4 text-[#5e5ce6]" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-[#f5f5f7] tracking-tight">
                {journalEntries.length} <span className="text-xs text-[#86868b] font-normal">reflections</span>
              </div>
              <p className="text-[11px] text-[#6e6e73] mt-0.5">
                {conversations.length} sessions • {totalMessages} messages
              </p>
            </div>
            <div className="w-full h-1.5 bg-[#2c2c2e] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5e5ce6] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, journalEntries.length * 20))}%` }}
              />
            </div>
          </div>
        </div>

        {/* METRICS DEEP DIVE: Temporal Alignment & Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alignment Index Card */}
          <div className="p-6 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#f5f5f7] flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-[#0a84ff]" />
                  <span>Temporal Alignment Index</span>
                </h3>
                <p className="text-xs text-[#86868b] mt-0.5">
                  Composite score of goals, checkpoints, reflections, and RAG memory
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#0a84ff]/10 text-[#0a84ff] border border-[#0a84ff]/20">
                {temporalAlignmentScore >= 70 ? 'High Momentum' : temporalAlignmentScore >= 30 ? 'Calibrating' : 'Starting Out'}
              </span>
            </div>

            <div className="flex items-center space-x-6 py-2">
              <div className="text-4xl font-bold tracking-tight text-[#f5f5f7]">
                {temporalAlignmentScore}<span className="text-lg text-[#6e6e73] font-normal">/100</span>
              </div>
              <div className="flex-1 space-y-2">
                <div className="w-full h-2.5 bg-[#121214] rounded-full overflow-hidden p-0.5 border border-white/[0.04]">
                  <div
                    className="h-full bg-gradient-to-r from-[#0a84ff] via-[#5e5ce6] to-[#30d158] rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(4, temporalAlignmentScore)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#6e6e73]">
                  <span>Roadmap: {avgGoalProgress}%</span>
                  <span>Checkpoints: {milestoneVelocity}%</span>
                  <span>Reflections: {journalEntries.length}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/[0.06]">
              <div className="p-2.5 rounded-xl bg-[#121214] border border-white/[0.04] text-center">
                <span className="text-[10px] text-[#6e6e73] block uppercase font-medium">Roadmap</span>
                <span className="text-xs font-semibold text-[#f5f5f7]">{avgGoalProgress}%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#121214] border border-white/[0.04] text-center">
                <span className="text-[10px] text-[#6e6e73] block uppercase font-medium">Velocity</span>
                <span className="text-xs font-semibold text-[#30d158]">{milestoneVelocity}%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#121214] border border-white/[0.04] text-center">
                <span className="text-[10px] text-[#6e6e73] block uppercase font-medium">Reflections</span>
                <span className="text-xs font-semibold text-[#5e5ce6]">{journalEntries.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#121214] border border-white/[0.04] text-center">
                <span className="text-[10px] text-[#6e6e73] block uppercase font-medium">Vectors</span>
                <span className="text-xs font-semibold text-[#ff9f0a]">{totalChunks}</span>
              </div>
            </div>
          </div>

          {/* Goal Category Distribution Card */}
          <div className="p-6 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#f5f5f7] flex items-center space-x-2">
                  <BarChart2 className="w-4 h-4 text-[#30d158]" />
                  <span>Goal Category Distribution</span>
                </h3>
                <p className="text-xs text-[#86868b] mt-0.5">
                  Execution breakdown across focus areas
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('goals')}
                className="text-xs font-medium text-[#0a84ff] hover:underline"
              >
                View Goals
              </button>
            </div>

            {categoryStats.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6e6e73] bg-[#121214] rounded-xl border border-white/[0.04]">
                No goals created yet. Visit Goals & Milestones to define your first target.
              </div>
            ) : (
              <div className="space-y-3">
                {categoryStats.map((cat) => (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#f5f5f7]">{cat.category}</span>
                      <span className="text-[11px] text-[#86868b]">
                        {cat.count} {cat.count === 1 ? 'goal' : 'goals'} • {cat.avgProgress}% avg
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#121214] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0a84ff] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, cat.avgProgress)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SYSTEM PERFORMANCE & TELEMETRY STRIP */}
        <div className="p-4 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-[#242426] border border-white/[0.08] flex items-center justify-center">
              <Cpu className="w-4 h-4 text-[#30d158]" />
            </div>
            <div>
              <div className="font-semibold text-[#f5f5f7] flex items-center space-x-1.5">
                <span>Local AI Runtime</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#30d158]" />
              </div>
              <p className="text-[11px] text-[#6e6e73]">
                {ollamaStatus?.chat_model || 'gemma4:latest'} • {ollamaStatus?.embed_model || 'all-minilm:latest'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-[11px] text-[#86868b]">
            <div className="flex items-center space-x-1.5">
              <HardDrive className="w-3.5 h-3.5 text-[#ff9f0a]" />
              <span>ChromaDB Vector Store</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-[#30d158]" />
              <span>100% Air-Gapped Local</span>
            </div>
          </div>
        </div>

        {/* Reflection Prompts Section - Apple Journal Style Card */}
        <div className="p-6 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#f5f5f7]">Daily Reflection</h3>
              <p className="text-xs text-[#86868b] mt-0.5">
                Thoughtful inputs directly calibrate the conversational tone of your future self.
              </p>
            </div>
          </div>

          {/* Prompt Pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            {reflectionPrompts.map((p, idx) => {
              const isSelected = selectedPrompt === p;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedPrompt(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-white/[0.15] text-white border border-white/[0.2]'
                      : 'bg-white/[0.04] text-[#86868b] hover:text-[#f5f5f7] border border-white/[0.05]'
                  }`}
                >
                  "{p}"
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            <textarea
              value={reflectionInput}
              onChange={(e) => setReflectionInput(e.target.value)}
              placeholder="Record your reflection here..."
              rows={3}
              className="w-full bg-[#121214] border border-white/[0.08] rounded-xl p-3.5 text-sm text-[#f5f5f7] placeholder-[#6e6e73] focus:outline-none focus:border-[#0a84ff] transition-colors resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={() => handleQuickReflection(selectedPrompt)}
                disabled={!reflectionInput.trim() || isSubmittingReflection}
                className="px-4 py-2 rounded-xl bg-[#0a84ff] hover:bg-[#0071e3] text-white text-xs font-medium disabled:opacity-40 transition-colors cursor-pointer"
              >
                {isSubmittingReflection ? 'Saving to Memory...' : 'Commit to Vector Memory'}
              </button>
            </div>
          </div>
        </div>

        {/* Roadmap Milestones & Recent Sessions Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Roadmap Goals */}
          <div className="p-6 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#f5f5f7]">Active Goals</h3>
                <p className="text-xs text-[#86868b]">Current milestones in progress</p>
              </div>
              <button
                onClick={() => onNavigateTab('goals')}
                className="text-xs font-medium text-[#0a84ff] hover:underline"
              >
                View All
              </button>
            </div>

            {goals.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6e6e73] bg-[#121214] rounded-xl border border-white/[0.04]">
                No goals created yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {goals.slice(0, 3).map((g) => (
                  <div key={g.id} className="p-3.5 rounded-xl bg-[#121214] border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#f5f5f7]">{g.title}</span>
                      <span className="text-xs font-medium text-[#86868b]">{g.progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-[#2c2c2e] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0a84ff] rounded-full transition-all"
                        style={{ width: `${g.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#6e6e73]">
                      <span>{g.category}</span>
                      <span className="capitalize">{g.importance} priority</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Conversations */}
          <div className="p-6 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#f5f5f7]">Recent Sessions</h3>
                <p className="text-xs text-[#86868b]">Conversations with your future identity</p>
              </div>
              <button
                onClick={onOpenNewConversation}
                className="text-xs font-medium text-[#0a84ff] hover:underline flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            {conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6e6e73] bg-[#121214] rounded-xl border border-white/[0.04]">
                No past sessions recorded.
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.slice(0, 4).map((c) => {
                  const persona = personas.find((p) => p.id === c.persona_id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => onNavigateTab('chat')}
                      className="p-3.5 rounded-xl bg-[#121214] border border-white/[0.06] hover:bg-[#1a1a1c] transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h5 className="text-xs font-medium text-[#f5f5f7]">{c.title}</h5>
                          {persona && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-[#86868b]">
                              {persona.name}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#6e6e73]">
                          {c.mode} • {new Date(c.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#6e6e73]" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
