import React, { useState, useEffect } from 'react';
import {
  UserProfile, Persona, Goal, JournalEntry,
  DocumentItem, Conversation, OllamaStatus, NavTab, MessageSource
} from './types';
import { api } from './services/api';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { RightContextPanel } from './components/RightContextPanel';
import { OnboardingFlow } from './pages/OnboardingFlow';
import { ChatView } from './pages/ChatView';
import { DashboardView } from './pages/DashboardView';
import { GoalsView } from './pages/GoalsView';
import { MemoriesView } from './pages/MemoriesView';
import { DocumentsView } from './pages/DocumentsView';
import { JournalView } from './pages/JournalView';
import { SettingsView } from './pages/SettingsView';

export function App() {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [activePersona, setActivePersona] = useState<Persona | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);

  // Default landing tab is DASHBOARD
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [mode, setMode] = useState<string>('Reflection');
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(true);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [recentSources, setRecentSources] = useState<MessageSource[]>([]);
  const [openNewConvModalSignal, setOpenNewConvModalSignal] = useState<boolean>(false);

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    try {
      const oStatus = await api.getOllamaStatus();
      setOllamaStatus(oStatus);
    } catch {
      setOllamaStatus({
        available: false,
        base_url: 'http://localhost:11434',
        chat_model: 'gemma4:latest',
        embed_model: 'all-minilm:latest',
        models_available: [],
        error: 'Cannot connect to Ollama'
      });
    }

    try {
      const status = await api.getSystemStatus();
      if (status.is_onboarded) {
        setIsOnboarded(true);
        await loadAllData();
      } else {
        setIsOnboarded(false);
      }
    } catch (err) {
      console.warn('System status check failed on initial run:', err);
      setIsOnboarded(false);
    }
  };

  const loadAllData = async () => {
    try {
      const [profile, personasList, goalsList, journalList, docsList, convsList] = await Promise.all([
        api.getProfile().catch(() => null),
        api.listPersonas().catch(() => []),
        api.listGoals().catch(() => []),
        api.listJournal().catch(() => []),
        api.listDocuments().catch(() => []),
        api.listConversations().catch(() => [])
      ]);

      setUserProfile(profile);
      setPersonas(personasList);
      const active = personasList.find((p) => p.is_active) || personasList[0] || null;
      setActivePersona(active);
      setGoals(goalsList);
      setJournalEntries(journalList);
      setDocuments(docsList);
      setConversations(convsList);
    } catch (err) {
      console.error('Error loading application data:', err);
    }
  };

  const handleSelectPersona = async (personaId: string) => {
    try {
      const updated = await api.activatePersona(personaId);
      setActivePersona(updated);
      await loadAllData();
    } catch (err) {
      console.error('Failed to switch persona:', err);
    }
  };

  const handleOnboardingComplete = async () => {
    setIsOnboarded(true);
    setShowOnboarding(false);
    await loadAllData();
    setCurrentTab('dashboard');
  };

  const handleOpenNewConversationFromDashboard = () => {
    setCurrentTab('chat');
    setOpenNewConvModalSignal(true);
  };

  const handleResetApp = () => {
    setUserProfile(null);
    setPersonas([]);
    setActivePersona(null);
    setGoals([]);
    setJournalEntries([]);
    setDocuments([]);
    setConversations([]);
    setIsOnboarded(false);
    setShowOnboarding(false);
    setCurrentTab('dashboard');
  };

  if (isOnboarded === null) {
    return (
      <div className="h-screen w-screen bg-[#000000] flex flex-col items-center justify-center font-apple text-xs text-[#86868b] space-y-3">
        <span className="w-5 h-5 rounded-full border-2 border-white/[0.15] border-t-[#0a84ff] animate-spin" />
        <span className="tracking-tight text-[13px] text-[#f5f5f7]">Initializing ECHO...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-text-primary">
      {/* Onboarding Flow Modal */}
      {showOnboarding && (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      )}

      {/* Left Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activePersona={activePersona}
        personas={personas}
        onSelectPersona={handleSelectPersona}
        ollamaStatus={ollamaStatus}
      />

      {/* Center Main Stage */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          activePersona={activePersona}
          mode={mode}
          onModeChange={setMode}
          isStreaming={isStreaming}
          rightPanelOpen={rightPanelOpen}
          onToggleRightPanel={() => setRightPanelOpen(!rightPanelOpen)}
        />

        <main className="flex-1 flex overflow-hidden">
          {currentTab === 'dashboard' && (
            <DashboardView
              userProfile={userProfile}
              activePersona={activePersona}
              personas={personas}
              goals={goals}
              journalEntries={journalEntries}
              documents={documents}
              conversations={conversations}
              ollamaStatus={ollamaStatus}
              onNavigateTab={setCurrentTab}
              onRefreshData={loadAllData}
              onStartOnboarding={() => setShowOnboarding(true)}
              onOpenNewConversation={handleOpenNewConversationFromDashboard}
            />
          )}

          {currentTab === 'chat' && (
            <ChatView
              activePersona={activePersona}
              personas={personas}
              mode={mode}
              onSetRecentSources={setRecentSources}
              onSelectPersona={handleSelectPersona}
              isNewConvModalOpenInitial={openNewConvModalSignal}
            />
          )}

          {currentTab === 'goals' && (
            <GoalsView
              goals={goals}
              activePersona={activePersona}
              onRefresh={loadAllData}
            />
          )}

          {currentTab === 'memories' && (
            <MemoriesView
              activePersona={activePersona}
              onRefreshStats={loadAllData}
            />
          )}

          {currentTab === 'documents' && (
            <DocumentsView
              documents={documents}
              activePersona={activePersona}
              onRefresh={loadAllData}
            />
          )}

          {currentTab === 'journal' && (
            <JournalView
              journalEntries={journalEntries}
              activePersona={activePersona}
              onRefresh={loadAllData}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              ollamaStatus={ollamaStatus}
              activePersona={activePersona}
              personas={personas}
              userProfile={userProfile}
              onRefreshAll={loadAllData}
              onResetApp={handleResetApp}
            />
          )}

          {/* Collapsible Right Context Panel */}
          <RightContextPanel
            isOpen={rightPanelOpen}
            activePersona={activePersona}
            goals={goals}
            recentSources={recentSources}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
