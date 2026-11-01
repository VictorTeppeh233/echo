import React, { useState } from 'react';
import { Target, Plus, CheckCircle2, Circle, Trash2, X, Check } from 'lucide-react';
import { Goal, Milestone, Persona } from '../types';
import { api } from '../services/api';

interface GoalsViewProps {
  goals: Goal[];
  activePersona: Persona | null;
  onRefresh: () => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  activePersona,
  onRefresh
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Career');
  const [importance, setImportance] = useState('high');
  const [challenges, setChallenges] = useState('');
  const [whyMatters, setWhyMatters] = useState('');

  // Milestone input for specific goal
  const [activeMilestoneInputGoalId, setActiveMilestoneInputGoalId] = useState<string | null>(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  const categories = [
    'All', 'Career', 'Education', 'Business', 'Finance',
    'Health and fitness', 'Personal development', 'Relationships',
    'Creativity', 'Other'
  ];

  const filteredGoals = goals.filter(
    (g) => selectedCategory === 'All' || g.category === selectedCategory
  );

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await api.createGoal({
        title,
        description,
        category,
        importance,
        challenges,
        why_matters: whyMatters,
        persona_id: activePersona?.id,
        progress: 0,
        status: 'active'
      });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setChallenges('');
      setWhyMatters('');
      onRefresh();
    } catch (err) {
      console.error('Failed to create goal:', err);
    }
  };

  const handleProgressChange = async (goalId: string, progress: number) => {
    try {
      await api.updateGoal(goalId, { progress });
      onRefresh();
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  const handleToggleMilestone = async (milestone: Milestone) => {
    try {
      await api.updateMilestone(milestone.id, { completed: !milestone.completed });
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle milestone:', err);
    }
  };

  const handleAddMilestone = async (goalId: string) => {
    if (!newMilestoneTitle.trim()) return;
    try {
      await api.addMilestone(goalId, { title: newMilestoneTitle.trim() });
      setNewMilestoneTitle('');
      setActiveMilestoneInputGoalId(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to add milestone:', err);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      await api.deleteGoal(goalId);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-[#000000] font-apple">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/[0.06]">
          <div>
            <div className="text-[12px] font-medium tracking-wider uppercase text-[#86868b]">
              Roadmap & Milestones
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#f5f5f7] mt-0.5">
              Achieved Futures & Active Ambitions
            </h1>
            <p className="text-sm text-[#86868b] mt-1">
              Your future self references these milestones to guide strategic accountability.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#0a84ff] hover:bg-[#0071e3] text-white text-sm font-medium flex items-center space-x-1.5 transition-colors cursor-pointer self-start md:self-auto shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Goal</span>
          </button>
        </div>

        {/* Categories Segmented Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          {categories.map((c) => {
            const isSelected = selectedCategory === c;
            return (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-white/[0.15] text-white border border-white/[0.2]'
                    : 'bg-white/[0.04] text-[#86868b] hover:text-[#f5f5f7] border border-white/[0.05]'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Goals List */}
        {filteredGoals.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#1c1c1e] border border-white/[0.06] space-y-2">
            <Target className="w-8 h-8 text-[#6e6e73] mx-auto" />
            <h3 className="text-sm font-medium text-[#f5f5f7]">No goals in this category</h3>
            <p className="text-xs text-[#86868b]">
              Create a goal to begin building your future roadmap.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGoals.map((g) => (
              <div
                key={g.id}
                className="p-6 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] hover:bg-[#222224] transition-colors space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-[#86868b]">
                        {g.category}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-[#86868b] capitalize">
                        {g.importance} priority
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-[#f5f5f7]">
                      {g.title}
                    </h3>
                    {g.description && (
                      <p className="text-xs text-[#86868b] leading-relaxed max-w-2xl">
                        {g.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDeleteGoal(g.id)}
                      className="p-1.5 rounded-lg text-[#6e6e73] hover:text-[#ff453a] hover:bg-white/[0.06] transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Control */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#86868b] font-medium">Progress</span>
                    <span className="text-[#f5f5f7] font-semibold">{g.progress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={g.progress}
                    onChange={(e) => handleProgressChange(g.id, parseInt(e.target.value))}
                    className="w-full h-1.5 bg-[#2c2c2e] rounded-full appearance-none cursor-pointer accent-[#0a84ff]"
                  />
                </div>

                {/* Milestones Checklist - Apple Reminders Style */}
                <div className="space-y-2.5 pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[12px] font-medium text-[#86868b]">
                      Checkpoints ({g.milestones?.filter((m) => m.completed).length || 0}/
                      {g.milestones?.length || 0})
                    </span>
                    <button
                      onClick={() =>
                        setActiveMilestoneInputGoalId(
                          activeMilestoneInputGoalId === g.id ? null : g.id
                        )
                      }
                      className="text-xs text-[#0a84ff] hover:underline font-medium"
                    >
                      {activeMilestoneInputGoalId === g.id ? 'Cancel' : '+ Add Checkpoint'}
                    </button>
                  </div>

                  {activeMilestoneInputGoalId === g.id && (
                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="text"
                        value={newMilestoneTitle}
                        onChange={(e) => setNewMilestoneTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddMilestone(g.id);
                          }
                        }}
                        placeholder="Checkpoint title..."
                        className="flex-1 bg-[#121214] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
                      />
                      <button
                        onClick={() => handleAddMilestone(g.id)}
                        className="px-3 py-1.5 rounded-xl bg-[#0a84ff] hover:bg-[#0071e3] text-white text-xs font-medium"
                      >
                        Add
                      </button>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {g.milestones?.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleToggleMilestone(m)}
                        className="flex items-center space-x-2.5 p-2 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-colors"
                      >
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            m.completed
                              ? 'bg-[#30d158] border-[#30d158] text-black'
                              : 'border-white/[0.2] hover:border-white/[0.4]'
                          }`}
                        >
                          {m.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span
                          className={`text-xs ${
                            m.completed ? 'line-through text-[#6e6e73]' : 'text-[#f5f5f7]'
                          }`}
                        >
                          {m.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Goal Modal - Apple Sheet */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-[#1c1c1e] border border-white/[0.12] rounded-2xl p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-base font-semibold text-[#f5f5f7]">
                    Add New Goal
                  </h3>
                  <p className="text-xs text-[#86868b] mt-0.5">
                    Define an objective you aspire to accomplish.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#86868b] hover:text-[#f5f5f7] p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#86868b]">
                    Goal Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Master Distributed Systems Architecture"
                    className="w-full bg-[#121214] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#86868b]">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#121214] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
                    >
                      {categories.filter((c) => c !== 'All').map((c) => (
                        <option key={c} value={c} className="bg-[#1c1c1e] text-[#f5f5f7]">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#86868b]">
                      Importance
                    </label>
                    <select
                      value={importance}
                      onChange={(e) => setImportance(e.target.value)}
                      className="w-full bg-[#121214] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
                    >
                      <option value="high" className="bg-[#1c1c1e] text-[#f5f5f7]">High Priority</option>
                      <option value="medium" className="bg-[#1c1c1e] text-[#f5f5f7]">Medium Priority</option>
                      <option value="low" className="bg-[#1c1c1e] text-[#f5f5f7]">Low Priority</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#86868b]">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Details about what success looks like..."
                    rows={2}
                    className="w-full bg-[#121214] border border-white/[0.08] rounded-xl p-3 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff] resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#86868b]">
                    Why It Matters
                  </label>
                  <input
                    type="text"
                    value={whyMatters}
                    onChange={(e) => setWhyMatters(e.target.value)}
                    placeholder="Why this goal is foundational to your future self..."
                    className="w-full bg-[#121214] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-medium text-[#f5f5f7] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#0a84ff] hover:bg-[#0071e3] text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    Save Goal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
