import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Copy, Check,
  Layers, ChevronDown, ChevronUp, AlertCircle,
  Plus, X, UserCheck, Trash2, ArrowUp, Sparkles, MessageCircle
} from 'lucide-react';
import { Conversation, Message, MessageSource, Persona } from '../types';
import { api } from '../services/api';

interface ChatViewProps {
  activePersona: Persona | null;
  personas: Persona[];
  mode: string;
  onSetRecentSources: (sources: MessageSource[]) => void;
  onSelectPersona: (personaId: string) => void;
  isNewConvModalOpenInitial?: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  activePersona,
  personas,
  mode,
  onSetRecentSources,
  onSelectPersona,
  isNewConvModalOpenInitial = false
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [currentTurnSources, setCurrentTurnSources] = useState<MessageSource[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSourcesMsgId, setExpandedSourcesMsgId] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  // New Conversation + Persona Selection Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(isNewConvModalOpenInitial);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(activePersona?.id || (personas[0]?.id || ''));
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>(mode || 'Reflection');

  // Inline Create New Persona toggle
  const [isCreatingInlinePersona, setIsCreatingInlinePersona] = useState(false);
  const [inlinePersonaName, setInlinePersonaName] = useState('');
  const [inlinePersonaDesc, setInlinePersonaDesc] = useState('');
  const [inlinePersonaTraits, setInlinePersonaTraits] = useState('Calm and reflective, Disciplined and direct');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadConversations();
  }, [activePersona?.id]);

  useEffect(() => {
    if (activePersona?.id) {
      setSelectedPersonaId(activePersona.id);
    }
  }, [activePersona?.id]);

  const loadConversations = async () => {
    try {
      const convs = await api.listConversations();
      setConversations(convs);
      if (convs.length > 0) {
        loadConversationDetails(convs[0].id);
      } else {
        setIsNewModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadConversationDetails = async (id: string) => {
    try {
      const fullConv = await api.getConversation(id);
      setActiveConv(fullConv);
      
      if (fullConv.persona_id && fullConv.persona_id !== activePersona?.id) {
        onSelectPersona(fullConv.persona_id);
      }

      const parsedMsgs: Message[] = fullConv.messages.map((m) => {
        let sources: MessageSource[] = [];
        if (m.sources_json) {
          try {
            sources = JSON.parse(m.sources_json);
          } catch {
            // ignore
          }
        }
        return { ...m, sources };
      });
      setMessages(parsedMsgs);

      const lastAssistantMsg = [...parsedMsgs]
        .reverse()
        .find((m) => m.role === 'assistant' && m.sources && m.sources.length > 0);
      if (lastAssistantMsg && lastAssistantMsg.sources) {
        onSetRecentSources(lastAssistantMsg.sources);
      }
    } catch (err) {
      console.error('Failed to get conversation:', err);
    }
  };

  const handleCreateNewSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let chosenPersonaId = selectedPersonaId;

      if (isCreatingInlinePersona && inlinePersonaName.trim()) {
        const createdP = await api.createPersona({
          name: inlinePersonaName.trim(),
          description: inlinePersonaDesc.trim(),
          personality: inlinePersonaTraits.trim(),
          is_active: true
        });
        chosenPersonaId = createdP.id;
        onSelectPersona(createdP.id);
        setIsCreatingInlinePersona(false);
      }

      const newConv = await api.createConversation({
        title: newSessionTitle.trim() || 'Echo Session',
        persona_id: chosenPersonaId || activePersona?.id,
        mode: selectedMode
      });

      setConversations([newConv, ...conversations]);
      setActiveConv(newConv);
      setMessages([]);
      setCurrentTurnSources([]);
      onSetRecentSources([]);
      setIsNewModalOpen(false);
      setNewSessionTitle('');
      if (chosenPersonaId) {
        onSelectPersona(chosenPersonaId);
      }
      inputRef.current?.focus();
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      await api.deleteConversation(convId);
      const remaining = conversations.filter((c) => c.id !== convId);
      setConversations(remaining);
      if (activeConv?.id === convId) {
        if (remaining.length > 0) {
          loadConversationDetails(remaining[0].id);
        } else {
          setActiveConv(null);
          setMessages([]);
          setIsNewModalOpen(true);
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isStreaming) return;

    if (!activeConv) {
      setIsNewModalOpen(true);
      return;
    }

    setInputValue('');
    setStreamError(null);
    setIsStreaming(true);
    setStreamingContent('');
    setCurrentTurnSources([]);

    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConv.id,
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    let accumulatedTokens = '';
    let sourcesReceived: MessageSource[] = [];

    await api.streamChat(
      activeConv.id,
      text,
      selectedMode || mode,
      (sources) => {
        sourcesReceived = sources;
        setCurrentTurnSources(sources);
        onSetRecentSources(sources);
      },
      (token) => {
        accumulatedTokens += token;
        setStreamingContent(accumulatedTokens);
      },
      (messageId) => {
        setIsStreaming(false);
        const finalAssistantMsg: Message = {
          id: messageId || `done-${Date.now()}`,
          conversation_id: activeConv.id,
          role: 'assistant',
          content: accumulatedTokens,
          sources: sourcesReceived,
          created_at: new Date().toISOString()
        };
        setMessages((prev) => [...prev, finalAssistantMsg]);
        setStreamingContent('');
        api.listConversations().then(setConversations);
      },
      (err) => {
        setIsStreaming(false);
        setStreamError(err);
        setStreamingContent('');
      }
    );
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const starterPrompts = [
    "What should we prioritize executing this week to hit our target?",
    "I am procrastinating on difficult work. Challenge me directly.",
    "Based on our active goals, what milestone should we focus on next?",
    "I am encountering resistance today. What perspective did you learn?"
  ];

  const currentPersona = personas.find((p) => p.id === activeConv?.persona_id) || activePersona;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#000000] relative overflow-hidden font-apple">
      {/* Top Session Control Bar */}
      <div className="px-6 py-3 border-b border-white/[0.08] bg-[#121214]/80 backdrop-blur-xl flex items-center justify-between gap-3 z-10">
        <div className="flex items-center space-x-3 truncate">
          <div className="flex items-center space-x-2 truncate">
            <span className="text-sm font-semibold text-[#f5f5f7] truncate">
              {activeConv?.title || 'Echo Session'}
            </span>
            {currentPersona && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/[0.08] text-[#86868b] border border-white/[0.05] shrink-0">
                {currentPersona.name}
              </span>
            )}
          </div>
        </div>

        {/* Sessions switcher & New Session action */}
        <div className="flex items-center space-x-2 shrink-0">
          {conversations.length > 1 && (
            <select
              value={activeConv?.id || ''}
              onChange={(e) => loadConversationDetails(e.target.value)}
              className="bg-[#1c1c1e] hover:bg-[#242426] border border-white/[0.08] text-xs rounded-lg px-2.5 py-1.5 text-[#f5f5f7] focus:outline-none cursor-pointer transition-colors max-w-[180px] truncate"
            >
              {conversations.map((c) => {
                const p = personas.find((item) => item.id === c.persona_id);
                return (
                  <option key={c.id} value={c.id} className="bg-[#1c1c1e] text-[#f5f5f7]">
                    {c.title} {p ? `(${p.name})` : ''}
                  </option>
                );
              })}
            </select>
          )}

          {activeConv && (
            <button
              onClick={(e) => handleDeleteConversation(activeConv.id, e)}
              className="p-1.5 rounded-lg text-[#86868b] hover:text-[#ff453a] hover:bg-white/[0.06] transition-colors border border-white/[0.06]"
              title="Delete Session"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-[#0a84ff] hover:bg-[#0071e3] text-white text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Session</span>
          </button>
        </div>
      </div>

      {/* Messages Stage */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
        {messages.length === 0 && !isStreaming ? (
          /* Empty State / Apple Siri Style Prompts */
          <div className="max-w-xl mx-auto my-auto pt-12 space-y-8 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#1c1c1e] border border-white/[0.08] flex items-center justify-center mx-auto shadow-inner">
                <MessageCircle className="w-6 h-6 text-[#0a84ff]" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-[#f5f5f7]">
                Connect with {currentPersona?.name || 'Your Future Self'}
              </h2>
              <p className="text-xs text-[#86868b] max-w-md mx-auto leading-relaxed">
                Choose an inquiry below or type a message to seek strategic counsel, habit accountability, or perspective.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {starterPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="p-4 rounded-xl bg-[#1c1c1e] border border-white/[0.06] hover:bg-[#242426] hover:border-white/[0.12] text-xs text-[#f5f5f7] leading-relaxed transition-all cursor-pointer group"
                >
                  <span className="text-[#86868b] group-hover:text-[#0a84ff] transition-colors block text-[11px] mb-1 font-medium">
                    Prompt {idx + 1}
                  </span>
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isSourcesExpanded = expandedSourcesMsgId === msg.id;

            return (
              <div
                key={msg.id}
                className={`max-w-3xl mx-auto flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center space-x-2 mb-1.5 px-1">
                  <span className="text-[11px] font-medium text-[#86868b]">
                    {isUser ? 'You' : (currentPersona?.name || 'Future Self')}
                  </span>
                  <span className="text-[11px] text-[#6e6e73]">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] md:max-w-[78%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                    isUser
                      ? 'bg-[#0a84ff] text-white rounded-tr-sm shadow-sm'
                      : 'bg-[#1c1c1e] border border-white/[0.08] text-[#f5f5f7] rounded-tl-sm shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">
                    {msg.content}
                  </div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-white/[0.08]">
                      <button
                        onClick={() =>
                          setExpandedSourcesMsgId(isSourcesExpanded ? null : msg.id)
                        }
                        className="flex items-center space-x-1.5 text-xs text-[#0a84ff] hover:underline font-medium"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>
                          {msg.sources.length} Cited Source{msg.sources.length > 1 ? 's' : ''}
                        </span>
                        {isSourcesExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isSourcesExpanded && (
                        <div className="mt-2 space-y-2 pl-2 border-l border-[#0a84ff]/40">
                          {msg.sources.map((s, sIdx) => (
                            <div key={sIdx} className="text-xs text-[#86868b] space-y-0.5">
                              <span className="text-[#f5f5f7] font-medium block">
                                {s.title || s.filename}
                              </span>
                              <p className="italic text-[#86868b] leading-relaxed">"{s.snippet}"</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {!isUser && (
                    <div className="mt-2 flex items-center justify-end space-x-2 pt-1">
                      <button
                        onClick={() => copyToClipboard(msg.id, msg.content)}
                        className="text-[#6e6e73] hover:text-[#f5f5f7] p-1 rounded transition-colors"
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-[#30d158]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isStreaming && (
          <div className="max-w-3xl mx-auto flex flex-col items-start">
            <div className="flex items-center space-x-2 mb-1.5 px-1">
              <span className="w-2 h-2 rounded-full bg-[#0a84ff] animate-pulse" />
              <span className="text-[11px] font-medium text-[#86868b]">
                {currentPersona?.name || 'Future Self'}
              </span>
            </div>

            <div className="max-w-[85%] md:max-w-[78%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed bg-[#1c1c1e] border border-white/[0.1] text-[#f5f5f7] rounded-tl-sm shadow-sm">
              <div className="whitespace-pre-wrap font-sans">
                {streamingContent}
                <span className="inline-block w-1.5 h-4 ml-1 bg-[#0a84ff] animate-pulse align-middle" />
              </div>

              {currentTurnSources.length > 0 && (
                <div className="mt-3 pt-2 border-t border-white/[0.08] text-xs text-[#0a84ff] flex items-center space-x-1.5 font-medium">
                  <Layers className="w-3 h-3" />
                  <span>Synthesizing from {currentTurnSources.length} retrieved memories...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {streamError && (
          <div className="max-w-3xl mx-auto p-4 rounded-xl bg-[#241214] border border-[#ff453a]/30 text-[#ff453a] text-xs flex items-start space-x-3">
            <AlertCircle className="w-4 h-4 text-[#ff453a] mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold mb-1">Transmission Notice</div>
              <p className="leading-relaxed text-[#f5f5f7]">{streamError}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Apple Messages Input Capsule */}
      <div className="p-4 bg-gradient-to-t from-[#000000] via-[#000000]/90 to-transparent">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="max-w-3xl mx-auto relative bg-[#1c1c1e] border border-white/[0.1] rounded-2xl p-2 shadow-xl flex items-end gap-2 focus-within:border-[#0a84ff] transition-all"
        >
          <div className="flex-1 flex flex-col">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Message ${currentPersona?.name || 'your Future Self'}...`}
              rows={2}
              className="w-full bg-transparent text-sm text-[#f5f5f7] focus:outline-none resize-none px-2 py-1 placeholder-[#6e6e73]"
            />
            <div className="flex items-center justify-between px-2 pt-0.5 text-[11px] text-[#6e6e73]">
              <span>Return to send, Shift + Return for new line</span>
              <span className="text-[#86868b]">{activeConv?.mode || selectedMode}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!inputValue.trim() || isStreaming}
            className="w-8 h-8 rounded-full bg-[#0a84ff] hover:bg-[#0071e3] text-white flex items-center justify-center disabled:opacity-30 disabled:hover:bg-[#0a84ff] transition-all cursor-pointer shrink-0 mb-1"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* NEW CONVERSATION & PERSONA SELECTION MODAL - Apple Sheet */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[#1c1c1e] border border-white/[0.12] rounded-2xl p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-semibold text-[#f5f5f7]">
                  New Conversation
                </h3>
                <p className="text-xs text-[#86868b] mt-0.5">
                  Select a calibrated persona and conversation mode.
                </p>
              </div>

              {conversations.length > 0 && (
                <button
                  onClick={() => setIsNewModalOpen(false)}
                  className="text-[#86868b] hover:text-[#f5f5f7] p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <form onSubmit={handleCreateNewSession} className="space-y-5">
              {/* 1. SELECT FUTURE SELF PERSONA */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#86868b] uppercase tracking-wider">
                    Future Self Persona
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingInlinePersona(!isCreatingInlinePersona)}
                    className="text-[#0a84ff] text-xs hover:underline font-medium"
                  >
                    {isCreatingInlinePersona ? '← Back to Personas' : '+ Create Persona'}
                  </button>
                </div>

                {isCreatingInlinePersona ? (
                  <div className="p-4 rounded-xl bg-[#121214] border border-white/[0.1] space-y-3">
                    <div>
                      <label className="block text-[11px] text-[#86868b] mb-1">
                        Persona Title
                      </label>
                      <input
                        type="text"
                        required
                        value={inlinePersonaName}
                        onChange={(e) => setInlinePersonaName(e.target.value)}
                        placeholder="e.g. The Strategic Founder, The Senior Fellow"
                        className="w-full bg-[#1c1c1e] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#86868b] mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={inlinePersonaDesc}
                        onChange={(e) => setInlinePersonaDesc(e.target.value)}
                        placeholder="Who this persona represents..."
                        className="w-full bg-[#1c1c1e] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#86868b] mb-1">
                        Personality & Tone
                      </label>
                      <input
                        type="text"
                        value={inlinePersonaTraits}
                        onChange={(e) => setInlinePersonaTraits(e.target.value)}
                        className="w-full bg-[#1c1c1e] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {personas.length === 0 ? (
                      <div className="p-4 rounded-xl bg-[#121214] text-center text-xs text-[#6e6e73]">
                        No personas created yet. Click "+ Create Persona" above.
                      </div>
                    ) : (
                      personas.map((p) => {
                        const isSelected = selectedPersonaId === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPersonaId(p.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[#242426] border-[#0a84ff] text-[#f5f5f7]'
                                : 'bg-[#121214] border-white/[0.06] text-[#86868b] hover:bg-[#1a1a1c]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-xs text-[#f5f5f7]">
                                {p.name}
                              </span>
                              {isSelected && <UserCheck className="w-3.5 h-3.5 text-[#0a84ff]" />}
                            </div>
                            {p.description && (
                              <p className="text-[11px] text-[#86868b] mb-1">
                                {p.description}
                              </p>
                            )}
                            <div className="text-[10px] text-[#6e6e73]">
                              {p.personality}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* 2. SESSION TITLE */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#86868b] uppercase tracking-wider">
                  Session Title (Optional)
                </label>
                <input
                  type="text"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  placeholder="e.g. Overcoming Resistance, Weekly Strategy"
                  className="w-full bg-[#121214] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
                />
              </div>

              {/* 3. CONVERSATION MODE */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#86868b] uppercase tracking-wider">
                  Interaction Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Reflection', 'Strategic Guidance', 'Accountability', 'Decision-Making'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMode(m)}
                      className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                        selectedMode === m
                          ? 'bg-[#242426] border-[#0a84ff] text-[#f5f5f7]'
                          : 'bg-[#121214] border-white/[0.06] text-[#86868b] hover:bg-[#1a1a1c]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-white/[0.08]">
                {conversations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-medium text-[#f5f5f7] transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!isCreatingInlinePersona && personas.length === 0}
                  className="px-5 py-2 rounded-xl bg-[#0a84ff] hover:bg-[#0071e3] text-white text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <span>Start Conversation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
