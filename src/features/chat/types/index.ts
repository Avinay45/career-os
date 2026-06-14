export type ConversationStatus = 'active' | 'archived';
export type MessageRole = 'user' | 'assistant' | 'system';

export interface ConversationRecord {
  id: string;
  user_id: string;
  title: string;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface WorkspaceContext {
  activeTab: string;
  companyName?: string;
  jobTitle?: string;
  atsScore?: number;
  jobId?: string;
}
