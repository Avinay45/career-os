'use server';

import { authenticateUser } from '@/features/auth/services/server-auth';
import { ConversationService } from '../services/conversation-service';
import { CareerAgent } from '../services/career-agent';
import { ConversationStatus, WorkspaceContext } from '../types';
import { checkRateLimit } from '@/lib/rate-limiter';

/**
 * Validates that the target conversation belongs to the authenticated user.
 */
async function validateConversationOwner(conversationId: string, userId: string) {
  const conversation = await ConversationService.getConversation(conversationId);
  if (!conversation) {
    throw new Error('Conversation not found.');
  }
  if (conversation.user_id !== userId) {
    throw new Error('Unauthorized. Access denied to this resource.');
  }
  return conversation;
}

/**
 * Action: Creates a new AI conversation session.
 */
export async function createConversationAction(title?: string) {
  try {
    const { user } = await authenticateUser();
    const conversation = await ConversationService.createConversation(user.id, title);
    return { success: true, conversation };
  } catch (error: any) {
    console.error('createConversationAction error:', error);
    return { success: false, error: error.message || 'Failed to create conversation.' };
  }
}

/**
 * Action: Fetches active or archived conversations for the current user.
 */
export async function listConversationsAction(status: ConversationStatus = 'active') {
  try {
    const { user } = await authenticateUser();
    const conversations = await ConversationService.listConversations(user.id, status);
    return { success: true, conversations };
  } catch (error: any) {
    console.error('listConversationsAction error:', error);
    return { success: false, error: error.message || 'Failed to retrieve conversations list.' };
  }
}

/**
 * Action: Retrieves messages in a conversation.
 */
export async function getConversationMessagesAction(conversationId: string, limit?: number, offset?: number) {
  try {
    const { user } = await authenticateUser();
    await validateConversationOwner(conversationId, user.id);
    const messages = await ConversationService.getConversationMessages(conversationId, limit, offset);
    return { success: true, messages };
  } catch (error: any) {
    console.error('getConversationMessagesAction error:', error);
    return { success: false, error: error.message || 'Failed to load conversation history.' };
  }
}

/**
 * Action: Appends user query, builds context prompt, triggers Hermes 3, and persists AI response.
 */
export async function sendChatMessageAction(
  conversationId: string,
  content: string,
  workspaceCtx: WorkspaceContext
) {
  try {
    const { user } = await authenticateUser();

    // Enforce rate limiting: 20 requests per 60 seconds per user
    const { limited, retryAfterSeconds } = checkRateLimit(`chat:${user.id}`, {
      limit: 20,
      intervalSeconds: 60,
    });
    if (limited) {
      return {
        success: false,
        error: `Rate limit exceeded. Please try again after ${retryAfterSeconds} seconds.`,
      };
    }

    await validateConversationOwner(conversationId, user.id);
    const reply = await CareerAgent.processUserMessage(user.id, conversationId, content, workspaceCtx);
    return { success: true, reply };
  } catch (error: any) {
    console.error('sendChatMessageAction error:', error);
    return { success: false, error: error.message || 'An error occurred during career agent execution.' };
  }
}

/**
 * Action: Hard deletes a conversation.
 */
export async function deleteConversationAction(conversationId: string) {
  try {
    const { user } = await authenticateUser();
    await validateConversationOwner(conversationId, user.id);
    await ConversationService.deleteConversation(conversationId);
    return { success: true };
  } catch (error: any) {
    console.error('deleteConversationAction error:', error);
    return { success: false, error: error.message || 'Failed to delete conversation.' };
  }
}

/**
 * Action: Soft archives a conversation.
 */
export async function archiveConversationAction(conversationId: string) {
  try {
    const { user } = await authenticateUser();
    await validateConversationOwner(conversationId, user.id);
    const conversation = await ConversationService.archiveConversation(conversationId);
    return { success: true, conversation };
  } catch (error: any) {
    console.error('archiveConversationAction error:', error);
    return { success: false, error: error.message || 'Failed to archive conversation.' };
  }
}

