import {
  UserProfile, Persona, Goal, Milestone,
  Conversation, Message, Memory, DocumentItem,
  JournalEntry, OllamaStatus, SystemStats, MessageSource
} from '../types';

const API_BASE = 'http://localhost:8000/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMsg = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData.detail) errMsg = errData.detail;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }
  return res.json();
}

export const api = {
  // --- System & Health ---
  async getHealth(): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  async getSystemStatus(): Promise<SystemStats> {
    const res = await fetch(`${API_BASE}/system/status`);
    return handleResponse(res);
  },

  // --- Profile & Onboarding ---
  async getProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/profile`);
    return handleResponse(res);
  },

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async completeOnboarding(data: any): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/profile/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteProfile(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/profile`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // --- Personas ---
  async listPersonas(): Promise<Persona[]> {
    const res = await fetch(`${API_BASE}/personas`);
    return handleResponse(res);
  },

  async createPersona(data: Partial<Persona>): Promise<Persona> {
    const res = await fetch(`${API_BASE}/personas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updatePersona(id: string, data: Partial<Persona>): Promise<Persona> {
    const res = await fetch(`${API_BASE}/personas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async activatePersona(id: string): Promise<Persona> {
    const res = await fetch(`${API_BASE}/personas/${id}/activate`, { method: 'POST' });
    return handleResponse(res);
  },

  async deletePersona(id: string): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/personas/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // --- Goals & Milestones ---
  async listGoals(personaId?: string): Promise<Goal[]> {
    const url = personaId ? `${API_BASE}/goals?persona_id=${personaId}` : `${API_BASE}/goals`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async createGoal(data: any): Promise<Goal> {
    const res = await fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateGoal(id: string, data: Partial<Goal>): Promise<Goal> {
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteGoal(id: string): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/goals/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  async addMilestone(goalId: string, data: { title: string; description?: string }): Promise<Milestone> {
    const res = await fetch(`${API_BASE}/goals/${goalId}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateMilestone(id: string, data: Partial<Milestone>): Promise<Milestone> {
    const res = await fetch(`${API_BASE}/milestones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteMilestone(id: string): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/milestones/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // --- Conversations & Chat Streaming ---
  async listConversations(personaId?: string): Promise<Conversation[]> {
    const url = personaId ? `${API_BASE}/conversations?persona_id=${personaId}` : `${API_BASE}/conversations`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async createConversation(data: { title?: string; persona_id?: string; mode?: string }): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getConversation(id: string): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/conversations/${id}`);
    return handleResponse(res);
  },

  async deleteConversation(id: string): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/conversations/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  async streamChat(
    conversationId: string,
    message: string,
    mode: string,
    onMeta: (sources: MessageSource[]) => void,
    onToken: (token: string) => void,
    onDone: (messageId?: string) => void,
    onError: (err: string) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/conversations/${conversationId}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, mode })
      });

      if (!response.ok) {
        throw new Error(`Chat stream failed: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No readable stream available in response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.type === 'meta') {
                onMeta(data.sources || []);
              } else if (data.type === 'token') {
                onToken(data.content);
              } else if (data.type === 'done') {
                onDone(data.message_id);
              }
            } catch (err) {
              console.warn('Failed to parse SSE event:', trimmed, err);
            }
          }
        }
      }
      onDone();
    } catch (err: any) {
      onError(err.message || 'Stream connection error');
    }
  },

  // --- Documents ---
  async listDocuments(personaId?: string): Promise<DocumentItem[]> {
    const url = personaId ? `${API_BASE}/documents?persona_id=${personaId}` : `${API_BASE}/documents`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async uploadDocument(file: File, personaId?: string): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (personaId) formData.append('persona_id', personaId);

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData
    });
    return handleResponse(res);
  },

  async deleteDocument(id: string): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // --- Memories ---
  async listMemories(category?: string, personaId?: string): Promise<Memory[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (personaId) params.append('persona_id', personaId);
    const res = await fetch(`${API_BASE}/memories?${params.toString()}`);
    return handleResponse(res);
  },

  async createMemory(data: Partial<Memory>): Promise<Memory> {
    const res = await fetch(`${API_BASE}/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateMemory(id: string, data: Partial<Memory>): Promise<Memory> {
    const res = await fetch(`${API_BASE}/memories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteMemory(id: string): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/memories/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // --- Journal ---
  async listJournal(personaId?: string): Promise<JournalEntry[]> {
    const url = personaId ? `${API_BASE}/journal?persona_id=${personaId}` : `${API_BASE}/journal`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async createJournal(data: Partial<JournalEntry>): Promise<JournalEntry> {
    const res = await fetch(`${API_BASE}/journal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteJournal(id: string): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/journal/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // --- Ollama & Config ---
  async getOllamaStatus(): Promise<OllamaStatus> {
    const res = await fetch(`${API_BASE}/ollama/status`);
    return handleResponse(res);
  },

  async updateOllamaConfig(config: { chat_model?: string; embed_model?: string; base_url?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/ollama/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return handleResponse(res);
  },

  async testOllama(): Promise<{ status: string; response?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/ollama/test`, { method: 'POST' });
    return handleResponse(res);
  },

  // --- Privacy & Export ---
  async exportData(): Promise<any> {
    const res = await fetch(`${API_BASE}/privacy/export`);
    return handleResponse(res);
  }
};
