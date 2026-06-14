import { createSupabaseServerClient } from '@/lib/supabase-server';
import { ConversationRecord, MessageRecord, ConversationStatus, MessageRole } from '../types';

export class ConversationService {
  /**
   * Creates a new conversation record.
   */
  static async createConversation(userId: string, title: string = 'New Conversation'): Promise<ConversationRecord> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        title,
        status: 'active' as ConversationStatus,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Failed to create conversation:', error);
      throw error || new Error('Failed to create conversation.');
    }

    return data as ConversationRecord;
  }

  /**
   * Fetches a conversation by ID.
   */
  static async getConversation(id: string): Promise<ConversationRecord | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`Failed to fetch conversation ${id}:`, error);
      throw error;
    }

    return data as ConversationRecord | null;
  }

  /**
   * Lists active or archived conversations for a user.
   */
  static async listConversations(
    userId: string,
    status: ConversationStatus = 'active',
    limit: number = 30,
    offset: number = 0
  ): Promise<ConversationRecord[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error(`Failed to list conversations for user ${userId}:`, error);
      throw error;
    }

    return (data || []) as ConversationRecord[];
  }

  /**
   * Updates fields in a conversation (e.g. title or status).
   */
  static async updateConversation(id: string, updates: Partial<Pick<ConversationRecord, 'title' | 'status'>>): Promise<ConversationRecord> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('ai_conversations')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      console.error(`Failed to update conversation ${id}:`, error);
      throw error || new Error('Failed to update conversation.');
    }

    return data as ConversationRecord;
  }

  /**
   * Hard deletes a conversation.
   */
  static async deleteConversation(id: string): Promise<boolean> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Failed to delete conversation ${id}:`, error);
      throw error;
    }

    return true;
  }

  /**
   * Archives a conversation.
   */
  static async archiveConversation(id: string): Promise<ConversationRecord> {
    return this.updateConversation(id, { status: 'archived' });
  }

  /**
   * Appends a new message in the conversation.
   * This automatically updates conversation's updated_at via database triggers.
   */
  static async appendMessage(conversationId: string, role: MessageRole, content: string): Promise<MessageRecord> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error(`Failed to append message to conversation ${conversationId}:`, error);
      throw error || new Error('Failed to append message.');
    }

    return data as MessageRecord;
  }

  /**
   * Fetches conversation messages with pagination.
   */
  static async getConversationMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<MessageRecord[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error(`Failed to fetch messages for conversation ${conversationId}:`, error);
      throw error;
    }

    return (data || []) as MessageRecord[];
  }
}
