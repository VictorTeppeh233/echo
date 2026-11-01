import React, { useState } from 'react';
import { BookOpen, Plus, Trash2, Calendar, X, Sparkles } from 'lucide-react';
import { JournalEntry, Persona } from '../types';
import { api } from '../services/api';

interface JournalViewProps {
  journalEntries: JournalEntry[];
  activePersona: Persona | null;
  onRefresh: () => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  journalEntries,
  activePersona,
  onRefresh
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('Focused');

  const moods = ['Focused', 'Challenged', 'Inspired', 'Reflective', 'Driven', 'Exhausted'];

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      await api.createJournal({
        title: title.trim(),
        content: content.trim(),
        mood,
        persona_id: activePersona?.id
      });
      setTitle('');
      setContent('');
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to create journal entry:', err);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) return;
    try {
      await api.deleteJournal(id);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-[#000000] font-apple">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/[0.06]">
          <div>
            <div className="text-[12px] font-medium tracking-wider uppercase text-[#86868b]">
              Reflections & Breakthroughs
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#f5f5f7] mt-0.5">
              Personal Journal
            </h1>
            <p className="text-sm text-[#86868b] mt-1">
              Your written reflections are embedded locally and directly guide your future self.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#0a84ff] hover:bg-[#0071e3] text-white text-sm font-medium flex items-center space-x-1.5 transition-colors cursor-pointer self-start md:self-auto shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Entry</span>
          </button>
        </div>

        {/* Entries List - Apple Journal Card Style */}
        {journalEntries.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#1c1c1e] border border-white/[0.06] space-y-2">
            <BookOpen className="w-8 h-8 text-[#6e6e73] mx-auto" />
            <h3 className="text-sm font-medium text-[#f5f5f7]">No journal entries yet</h3>
            <p className="text-xs text-[#86868b]">
              Capture your thoughts, progress, or obstacles today.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {journalEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-6 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] hover:bg-[#222224] transition-colors space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-[#86868b]">
                        {entry.mood || 'Reflection'}
                      </span>
                      <span className="text-xs text-[#6e6e73] flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-[#f5f5f7] pt-0.5">
                      {entry.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="p-1.5 rounded-lg text-[#6e6e73] hover:text-[#ff453a] hover:bg-white/[0.06] transition-colors"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-[#f5f5f7] font-sans leading-relaxed whitespace-pre-wrap">
                  {entry.content}
                </p>

                <div className="pt-2 border-t border-white/[0.06] text-[11px] text-[#6e6e73] flex items-center space-x-1.5">
                  <Sparkles className="w-3 h-3 text-[#0a84ff]" />
                  <span>Retained in local vector memory</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Entry Modal - Apple Sheet */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-[#1c1c1e] border border-white/[0.12] rounded-2xl p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-base font-semibold text-[#f5f5f7]">
                    New Journal Entry
                  </h3>
                  <p className="text-xs text-[#86868b] mt-0.5">
                    Reflect on your current focus, mindset, or challenges.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#86868b] hover:text-[#f5f5f7] p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateEntry} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#86868b]">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Overcoming Resistance on Distributed Consensus"
                    className="w-full bg-[#121214] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#86868b]">
                    Mindset / Mood
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {moods.map((m) => {
                      const isSelected = mood === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMood(m)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-white/[0.15] text-white border border-white/[0.2]'
                              : 'bg-white/[0.04] text-[#86868b] hover:text-[#f5f5f7] border border-white/[0.05]'
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#86868b]">
                    Reflection Content *
                  </label>
                  <textarea
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write freely. What went well today? What resistance did you feel? What must be improved tomorrow?..."
                    rows={6}
                    className="w-full bg-[#121214] border border-white/[0.08] rounded-xl p-3.5 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff] resize-none leading-relaxed"
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
                    Save Entry
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
