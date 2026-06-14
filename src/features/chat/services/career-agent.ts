import { queryOpenRouter, ChatMessage } from '@/lib/openrouter';
import { ConversationService } from './conversation-service';
import { ContextBuilder } from './context-builder';
import { WorkspaceContext, MessageRecord } from '../types';

const summaryCache = new Map<string, { lastMessageCount: number; summary: string }>();

export class CareerAgent {
  /**
   * Receives a user question, retrieves enriched context, handles message windows, queries Hermes, and saves messages.
   */
  static async processUserMessage(
    userId: string,
    conversationId: string,
    messageContent: string,
    workspaceCtx: WorkspaceContext
  ): Promise<MessageRecord> {
    // 1. Fetch entire conversation messages list
    const history = await ConversationService.getConversationMessages(conversationId, 100, 0);
    const initialMessageCount = history.length;

    // 2. Append User's Message to Database
    const userMessage = await ConversationService.appendMessage(conversationId, 'user', messageContent);

    // 3. Gather Workspace & Profile Context Package
    const systemContext = await ContextBuilder.buildSystemContext(userId, workspaceCtx);

    // 4. Memory Windowing & Summarization
    let slidingWindow = [...history, userMessage];
    let summaryMessageContext = '';

    if (slidingWindow.length > 12) {
      // Slicing: Keep only the last 8 messages for the active conversation history window
      const olderMessages = slidingWindow.slice(0, slidingWindow.length - 8);
      slidingWindow = slidingWindow.slice(-8);

      const cached = summaryCache.get(conversationId);
      if (cached && cached.lastMessageCount === olderMessages.length) {
        summaryMessageContext = cached.summary;
      } else if (cached && cached.lastMessageCount < olderMessages.length) {
        // Incremental summary
        const newDiscarded = olderMessages.slice(cached.lastMessageCount);
        try {
          summaryMessageContext = await this.summarizeIncremental(cached.summary, newDiscarded);
          summaryCache.set(conversationId, {
            lastMessageCount: olderMessages.length,
            summary: summaryMessageContext,
          });
        } catch (e) {
          console.error('Failed to incrementally summarize:', e);
          summaryMessageContext = cached.summary;
        }
      } else {
        // Full summary of older messages
        try {
          summaryMessageContext = await this.summarizeOlderMessages(olderMessages);
          summaryCache.set(conversationId, {
            lastMessageCount: olderMessages.length,
            summary: summaryMessageContext,
          });
        } catch (e) {
          console.error('Failed to summarize older messages:', e);
          summaryMessageContext = 'Candidate previously discussed general career preparation, resume feedback, and interview setups.';
        }
      }
    }

    // 5. Build AI Prompts
    const coachSystemPrompt = `You are a helpful, professional, and technical career coach named CareerOS Coach.
Your tone is encouraging, objective, and expert. Avoid generic responses and provide direct value.

${systemContext}

${summaryMessageContext ? `Summary of older discussion history:\n"""\n${summaryMessageContext}\n"""\n` : ''}
Provide actionable advice. If requested to write or review experience bullet points, write them in X-Y-Z formula format: 'Accomplished [X] as measured by [Y], by doing [Z]'.`;

    // Map database history records to OpenRouter ChatMessage format
    const promptMessages: ChatMessage[] = [
      { role: 'system', content: coachSystemPrompt },
      ...slidingWindow.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // 6. Query OpenRouter Hermes 3
    const replyText = await queryOpenRouter(promptMessages, {
      temperature: 0.7,
      max_tokens: 1500,
    });

    // 7. Save Coach reply in the database
    const assistantMessage = await ConversationService.appendMessage(conversationId, 'assistant', replyText);

    // 8. Auto-Rename trigger (Asynchronous background process)
    if (initialMessageCount === 0) {
      // Fire and forget auto conversation rename
      this.autoRenameConversation(conversationId, messageContent).catch((e) =>
        console.error('Auto conversation rename failed:', e)
      );
    }

    return assistantMessage;
  }

  /**
   * Summarizes the previous summary plus newly discarded messages.
   */
  private static async summarizeIncremental(previousSummary: string, newMessages: MessageRecord[]): Promise<string> {
    const newText = newMessages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const systemPrompt = `You are an AI summary tool. Update the existing conversation summary by incorporating the new messages. Keep the updated summary under 100 words.`;
    const response = await queryOpenRouter(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Existing Summary: "${previousSummary}"\n\nNew messages:\n${newText}` },
      ],
      { temperature: 0.3, max_tokens: 150 }
    );

    return response.trim();
  }

  /**
   * Compresses older messages into a concise context summary.
   */
  private static async summarizeOlderMessages(messages: MessageRecord[]): Promise<string> {
    const textToSummarize = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const systemPrompt = `You are an AI summary tool. Summarize the following career coaching discussion history in under 100 words. Keep it highly concise.`;
    const response = await queryOpenRouter(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Summarize this segment:\n\n${textToSummarize}` },
      ],
      { temperature: 0.3, max_tokens: 150 }
    );

    return response.trim();
  }

  /**
   * Auto generates a title based on the first message.
   */
  private static async autoRenameConversation(conversationId: string, firstQuery: string): Promise<void> {
    try {
      const prompt = `Summarize this initial user career coaching query into a short, descriptive 3-5 word title. Do NOT include quotation marks, formatting, or extra words.
Query: "${firstQuery}"`;

      const response = await queryOpenRouter(
        [
          { role: 'system', content: 'You are a concise naming assistant.' },
          { role: 'user', content: prompt },
        ],
        { temperature: 0.2, max_tokens: 50 }
      );

      const title = response.replace(/['"]+/g, '').trim() || 'Career Discussion';
      await ConversationService.updateConversation(conversationId, { title });
    } catch (error) {
      console.error('Failed to auto-rename conversation:', error);
    }
  }
}
