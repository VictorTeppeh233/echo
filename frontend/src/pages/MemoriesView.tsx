import React, { useState, useEffect } from 'react';
import {
  Brain, Plus, Search, Trash2, Edit2, Check,
  X, Filter
} from 'lucide-react';
import { Memory, Persona } from '../types';
import { api } from '../services/api';

interface MemoriesViewProps {
  activePersona: Persona | null;
  onRefreshStats: () => void;
}

export const MemoriesView: React.FC<MemoriesViewProps> = ({
  activePersona,
  onRefreshStats
}) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // New memory form
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Personal identity');
  const [newImportance, setNewImportance] = useState(3);

  const categories = [
    'All',
    'Personal identity',
    'Career and education',
    'Goals',
    'Experiences',
    'Challenges',
    'Preferences',
    'Milestones',
    'Reflections'
  ];

  useEffect(() => {
    loadMemories();
  }, [activePersona?.id, selectedCategory]);

  const loadMemories = async () => {
    try {
      const data = await api.listMemories(
        selectedCategory === 'All' ? undefined : selectedCategory,
        activePersona?.id
      );
      setMemories(data);
    } catch (err) {
      console.error('Failed to load memories:', err);
    }
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      await api.createMemory({
        content: newContent.trim(),
        category: newCategory,
        importance: newImportance,
        persona_id: activePersona?.id,
        source: 'manual'
      });
      setNewContent('');
      setIsModalOpen(false);
      loadMemories();
      onRefreshStats();
    } catch (err) {
      console.error('Failed to create memory:', err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;
    try {
      await api.deleteMemory(id);
      loadMemories();
      onRefreshStats();
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      await api.updateMemory(id, { content: editContent.trim() });
      setEditingMemoryId(null);
      loadMemories();
    } catch (err) {
      console.error('Failed to update memory:', err);
    }
  };

  const filteredMemories = memories.filter((m) =>
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-[#000000] font-apple">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/[0.06]">
          <div>
            <div className="text-[12px] font-medium tracking-wider uppercase text-[#86868b]">
              Vector Knowledge Base
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#f5f5f7] mt-0.5">
              Personal Memory Archive
            </h1>
            <p className="text-sm text-[#86868b] mt-1">
              Inspect, audit, and curate what ECHO stores in its local ChromaDB vector space.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#0a84ff] hover:bg-[#0071e3] text-white text-sm font-medium flex items-center space-x-1.5 transition-colors cursor-pointer self-start md:self-auto shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Memory</span>
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#6e6e73] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vector index..."
              className="w-full bg-[#1c1c1e] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#f5f5f7] placeholder-[#6e6e73] focus:outline-none focus:border-[#0a84ff] transition-colors"
            />
          </div>

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
        </div>

        {/* Memories Grid */}
        {filteredMemories.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#1c1c1e] border border-white/[0.06] space-y-2">
            <Brain className="w-8 h-8 text-[#6e6e73] mx-auto" />
            <h3 className="text-sm font-medium text-[#f5f5f7]">No memories found</h3>
            <p className="text-xs text-[#86868b]">
              Try adjusting your search query or add a new memory.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMemories.map((m) => {
              const isEditing = editingMemoryId === m.id;

              return (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] hover:bg-[#222224] transition-colors space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-[#86868b]">
                        {m.category}
                      </span>
                      <div className="flex items-center space-x-2 text-[11px] text-[#6e6e73]">
                        <span>Priority {m.importance}/5</span>
                        <span className="capitalize">• {m.source}</span>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="w-full bg-[#121214] border border-white/[0.08] rounded-xl p-3 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff] resize-none"
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingMemoryId(null)}
                            className="px-2.5 py-1 text-xs text-[#86868b] hover:text-[#f5f5f7]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(m.id)}
                            className="px-3 py-1 rounded-lg bg-[#0a84ff] text-white text-xs font-medium"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#f5f5f7] leading-relaxed font-sans">
                        {m.content}
                      </p>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#6e6e73]">
                      <span>{new Date(m.created_at).toLocaleDateString()}</span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setEditingMemoryId(m.id);
                            setEditContent(m.content);
                          }}
                          className="p-1 rounded text-[#6e6e73] hover:text-[#f5f5f7] transition-colors"
                          title="Edit Memory"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMemory(m.id)}
                          className="p-1 rounded text-[#6e6e73] hover:text-[#ff453a] transition-colors"
                          title="Delete Memory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* New Memory Modal - Apple Sheet */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-[#1c1c1e] border border-white/[0.12] rounded-2xl p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-base font-semibold text-[#f5f5f7]">
                    Add New Memory
                  </h3>
                  <p className="text-xs text-[#86868b] mt-0.5">
                    Embed an explicit insight, preference, or fact into your local vector vault.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#86868b] hover:text-[#f5f5f7] p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateMemory} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#86868b]">
                    Memory Content *
                  </label>
                  <textarea
                    required
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="e.g. Victor prefers deep work blocks in the morning and values disciplined execution over rapid multitasking..."
                    rows={4}
                    className="w-full bg-[#121214] border border-white/[0.08] rounded-xl p-3 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#86868b]">
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
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
                      Priority Level (1-5)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={newImportance}
                      onChange={(e) => setNewImportance(parseInt(e.target.value) || 3)}
                      className="w-full bg-[#121214] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
                    />
                  </div>
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
                    Save Memory
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
