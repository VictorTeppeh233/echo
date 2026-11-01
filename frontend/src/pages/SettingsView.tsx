import React, { useState } from 'react';
import {
  Settings, Shield, Cpu, Download, Trash2,
  CheckCircle2, AlertTriangle, RefreshCw, Plus, User, X
} from 'lucide-react';
import { OllamaStatus, Persona, UserProfile } from '../types';
import { api } from '../services/api';

interface SettingsViewProps {
  ollamaStatus: OllamaStatus | null;
  activePersona: Persona | null;
  personas: Persona[];
  userProfile: UserProfile | null;
  onRefreshAll: () => void;
  onResetApp: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  ollamaStatus,
  activePersona,
  personas,
  userProfile,
  onRefreshAll,
  onResetApp
}) => {
  const [chatModel, setChatModel] = useState(ollamaStatus?.chat_model || 'gemma4:latest');
  const [embedModel, setEmbedModel] = useState(ollamaStatus?.embed_model || 'all-minilm:latest');
  const [baseUrl, setBaseUrl] = useState(ollamaStatus?.base_url || 'http://localhost:11434');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // New Persona modal
  const [isNewPersonaOpen, setIsNewPersonaOpen] = useState(false);
  const [newPersonaName, setNewPersonaName] = useState('');
  const [newPersonaDesc, setNewPersonaDesc] = useState('');
  const [newPersonaTraits, setNewPersonaTraits] = useState('Disciplined and direct, Strategic');

  const handleSaveOllama = async () => {
    setIsSavingConfig(true);
    try {
      await api.updateOllamaConfig({
        chat_model: chatModel,
        embed_model: embedModel,
        base_url: baseUrl
      });
      alert('Ollama configuration updated successfully.');
      onRefreshAll();
    } catch (err: any) {
      alert(`Failed to update config: ${err.message}`);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleTestOllama = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testOllama();
      if (res.status === 'ok') {
        setTestResult(`Success: Ollama responded: "${res.response}"`);
      } else {
        setTestResult(`Notice: ${res.error}`);
      }
    } catch (err: any) {
      setTestResult(`Connection failed: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `echo_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const handleCreatePersona = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonaName.trim()) return;

    try {
      await api.createPersona({
        name: newPersonaName.trim(),
        description: newPersonaDesc.trim(),
        personality: newPersonaTraits.trim(),
        is_active: false
      });
      setIsNewPersonaOpen(false);
      setNewPersonaName('');
      setNewPersonaDesc('');
      onRefreshAll();
    } catch (err: any) {
      alert(`Failed to create persona: ${err.message}`);
    }
  };

  const handleWipeData = async () => {
    const confirmation = prompt(
      'WARNING: This will permanently delete your local user profile, goals, chat history, and ChromaDB vector embeddings. Type "DELETE" to confirm:'
    );
    if (confirmation === 'DELETE') {
      try {
        await api.deleteProfile();
        alert('All local profile and vector data has been wiped.');
        onResetApp();
      } catch (err: any) {
        alert(`Wipe failed: ${err.message}`);
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-[#000000] font-apple">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="pb-2 border-b border-white/[0.06]">
          <div className="text-[12px] font-medium tracking-wider uppercase text-[#86868b]">
            Preferences & Configuration
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#f5f5f7] mt-0.5">
            Settings
          </h1>
          <p className="text-sm text-[#86868b] mt-1">
            ECHO runs strictly on your machine with zero telemetry and air-gapped data storage.
          </p>
        </div>

        {/* Local Privacy Inset Card */}
        <div className="p-6 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] space-y-4">
          <div className="flex items-center space-x-2 text-xs font-medium text-[#30d158]">
            <Shield className="w-4 h-4" />
            <span>Local-First Architecture</span>
          </div>
          <p className="text-xs text-[#86868b] leading-relaxed">
            All language inference, embedding operations, ChromaDB vector indexing, and chat history remain strictly on your local hardware.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-[#121214] border border-white/[0.06] space-y-1">
              <span className="text-xs font-semibold text-[#f5f5f7] block">Local Storage</span>
              <p className="text-[11px] text-[#6e6e73]">Local SQLite & ChromaDB files</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#121214] border border-white/[0.06] space-y-1">
              <span className="text-xs font-semibold text-[#f5f5f7] block">Local Inference</span>
              <p className="text-[11px] text-[#6e6e73]">Ollama runtime localhost:11434</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#121214] border border-white/[0.06] space-y-1">
              <span className="text-xs font-semibold text-[#f5f5f7] block">No Cloud Telemetry</span>
              <p className="text-[11px] text-[#6e6e73]">Zero tracking, metrics, or telemetry</p>
            </div>
          </div>
        </div>

        {/* Ollama Runtime Configuration - macOS System Settings Inset */}
        <div className="p-6 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-medium text-[#0a84ff]">
              <Cpu className="w-4 h-4" />
              <span>Ollama Runtime Settings</span>
            </div>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                ollamaStatus?.available
                  ? 'bg-[#30d158]/10 text-[#30d158]'
                  : 'bg-[#ff453a]/10 text-[#ff453a]'
              }`}
            >
              {ollamaStatus?.available ? 'Engine Connected' : 'Engine Offline'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#86868b]">
                Base URL
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full bg-[#121214] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#86868b]">
                Chat Model
              </label>
              <input
                type="text"
                value={chatModel}
                onChange={(e) => setChatModel(e.target.value)}
                className="w-full bg-[#121214] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#86868b]">
                Embeddings Model
              </label>
              <input
                type="text"
                value={embedModel}
                onChange={(e) => setEmbedModel(e.target.value)}
                className="w-full bg-[#121214] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
              />
            </div>
          </div>

          {testResult && (
            <div className="p-3 rounded-xl bg-[#121214] border border-white/[0.06] text-xs text-[#f5f5f7]">
              {testResult}
            </div>
          )}

          <div className="flex items-center space-x-2 pt-2">
            <button
              onClick={handleTestOllama}
              disabled={isTesting}
              className="px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-medium text-[#f5f5f7] transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              onClick={handleSaveOllama}
              disabled={isSavingConfig}
              className="px-4 py-2 rounded-xl bg-[#0a84ff] hover:bg-[#0071e3] text-xs font-medium text-white transition-colors cursor-pointer"
            >
              {isSavingConfig ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>

        {/* Personas Management */}
        <div className="p-6 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-medium text-[#86868b]">
              <User className="w-4 h-4" />
              <span>Future Self Personas ({personas.length})</span>
            </div>
            <button
              onClick={() => setIsNewPersonaOpen(true)}
              className="text-xs text-[#0a84ff] hover:underline font-medium flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Persona</span>
            </button>
          </div>

          <div className="space-y-2">
            {personas.map((p) => {
              const isActive = activePersona?.id === p.id;
              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-[#121214] border border-white/[0.06] flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-[#f5f5f7]">{p.name}</span>
                      {isActive && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#0a84ff]/10 text-[#0a84ff]">
                          Active
                        </span>
                      )}
                    </div>
                    {p.description && (
                      <p className="text-[11px] text-[#86868b]">{p.description}</p>
                    )}
                    <p className="text-[10px] text-[#6e6e73]">{p.personality}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Data Management & Wipe */}
        <div className="p-6 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] space-y-4">
          <h3 className="text-xs font-medium text-[#86868b] uppercase tracking-wider">
            Data Management
          </h3>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#121214] border border-white/[0.06]">
            <div>
              <h4 className="text-xs font-semibold text-[#f5f5f7]">Export Full JSON Archive</h4>
              <p className="text-[11px] text-[#86868b] mt-0.5">
                Download a local JSON backup of your user profile, goals, journal, and chat logs.
              </p>
            </div>
            <button
              onClick={handleExportData}
              className="px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-medium text-[#f5f5f7] flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Archive</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#241214] border border-[#ff453a]/20">
            <div>
              <h4 className="text-xs font-semibold text-[#ff453a]">Reset All Application Data</h4>
              <p className="text-[11px] text-[#86868b] mt-0.5">
                Permanently wipes your local database and ChromaDB embeddings.
              </p>
            </div>
            <button
              onClick={handleWipeData}
              className="px-3.5 py-2 rounded-xl bg-[#ff453a] hover:bg-[#e03b30] text-xs font-medium text-white flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Wipe Local Data</span>
            </button>
          </div>
        </div>

        {/* New Persona Modal - Apple Sheet */}
        {isNewPersonaOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#1c1c1e] border border-white/[0.12] rounded-2xl p-6 shadow-2xl relative space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <h3 className="text-base font-semibold text-[#f5f5f7]">
                  Create Future Self Persona
                </h3>
                <button
                  onClick={() => setIsNewPersonaOpen(false)}
                  className="text-[#86868b] hover:text-[#f5f5f7] p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreatePersona} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#86868b]">
                    Persona Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPersonaName}
                    onChange={(e) => setNewPersonaName(e.target.value)}
                    placeholder="e.g. The Strategic Founder"
                    className="w-full bg-[#121214] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#86868b]">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newPersonaDesc}
                    onChange={(e) => setNewPersonaDesc(e.target.value)}
                    placeholder="e.g. Calm, focused, and experienced builder."
                    className="w-full bg-[#121214] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#86868b]">
                    Personality & Tone
                  </label>
                  <input
                    type="text"
                    value={newPersonaTraits}
                    onChange={(e) => setNewPersonaTraits(e.target.value)}
                    placeholder="e.g. Disciplined and direct, Strategic"
                    className="w-full bg-[#121214] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setIsNewPersonaOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-medium text-[#f5f5f7]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#0a84ff] hover:bg-[#0071e3] text-white text-xs font-medium"
                  >
                    Save Persona
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
