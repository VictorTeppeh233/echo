export interface UserProfile {
  id: string;
  name: string;
  current_situation?: string;
  personal_description?: string;
  values?: string;
  created_at: string;
  updated_at: string;
}

export interface Persona {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  personality: string;
  system_configuration?: string;
  is_active: boolean;
  created_at: string;
}

export interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  description?: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  persona_id?: string;
  title: string;
  description?: string;
  category: string;
  target_date?: string;
  status: string;
  progress: number;
  importance: string;
  challenges?: string;
  why_matters?: string;
  created_at: string;
  updated_at: string;
  milestones: Milestone[];
}

export interface MessageSource {
  title?: string;
  source_type?: string;
  filename?: string;
  similarity?: number;
  snippet?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources_json?: string;
  sources?: MessageSource[];
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  persona_id?: string;
  title: string;
  mode: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export interface Memory {
  id: string;
  user_id: string;
  persona_id?: string;
  category: string;
  content: string;
  source: string;
  source_id?: string;
  importance: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentItem {
  id: string;
  user_id: string;
  persona_id?: string;
  filename: string;
  file_type: string;
  file_size: number;
  chunk_count: number;
  processing_status: string;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  persona_id?: string;
  title: string;
  content: string;
  mood?: string;
  created_at: string;
  updated_at: string;
}

export interface OllamaStatus {
  available: boolean;
  base_url: string;
  chat_model: string;
  embed_model: string;
  models_available: string[];
  error?: string | null;
}

export interface SystemStats {
  is_onboarded: boolean;
  user_name?: string;
  stats: {
    personas: number;
    goals: number;
    milestones: number;
    conversations: number;
    messages: number;
    memories: number;
    documents: number;
    journal_entries: number;
  };
  config: {
    chat_model: string;
    embed_model: string;
    ollama_base_url: string;
    local_only: boolean;
  };
}

export type NavTab = 'chat' | 'dashboard' | 'goals' | 'memories' | 'documents' | 'journal' | 'settings';
