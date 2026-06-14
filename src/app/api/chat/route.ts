import { NextResponse } from 'next/server';
import { authenticateUser } from '@/features/auth/services/server-auth';
import { ConversationService } from '@/features/chat/services/conversation-service';
import { ContextBuilder } from '@/features/chat/services/context-builder';
import { queryOpenRouterStream, ChatMessage } from '@/lib/openrouter';

const summaryCache = new Map<string, { lastMessageCount: number; summary: string }>();

function getGeneralSummary() {
  return 'Candidate previously discussed general career preparation, resume feedback, and interview setups.';
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const { user } = await authenticateUser();

    const body = await request.json();
    const { conversationId, content, workspaceCtx } = body;

    if (!conversationId || !content) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    // 2. Verify conversation ownership
    const conversation = await ConversationService.getConversation(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    }
    if (conversation.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    // 3. Fetch history before appending user message
    const history = await ConversationService.getConversationMessages(conversationId, 100, 0);

    // 4. Append User Message to DB
    const userMessage = await ConversationService.appendMessage(conversationId, 'user', content);

    // 5. Setup sliding window
    let slidingWindow = [...history, userMessage];
    let summaryMessageContext = '';

    if (slidingWindow.length > 12) {
      // Keep only the last 8 messages for the active conversation history window
      const olderMessages = slidingWindow.slice(0, slidingWindow.length - 8);
      slidingWindow = slidingWindow.slice(-8);

      const cached = summaryCache.get(conversationId);
      if (cached && cached.lastMessageCount === olderMessages.length) {
        summaryMessageContext = cached.summary;
      } else {
        summaryMessageContext = getGeneralSummary();
        summaryCache.set(conversationId, {
          lastMessageCount: olderMessages.length,
          summary: summaryMessageContext,
        });
      }
    }

    // 6. Gather Workspace & Profile Context Package
    const systemContext = await ContextBuilder.buildSystemContext(user.id, workspaceCtx);

    // 7. Build AI Prompts
    const coachSystemPrompt = `You are a helpful, professional, and technical career coach named CareerOS Coach.
Your tone is encouraging, objective, and expert. Avoid generic responses and provide direct value.

${systemContext}

${summaryMessageContext ? `Summary of older discussion history:\n"""\n${summaryMessageContext}\n"""\n` : ''}
Provide actionable advice. If requested to write or review experience bullet points, write them in X-Y-Z formula format: 'Accomplished [X] as measured by [Y], by doing [Z]'.`;

    // Map database history records to OpenRouter ChatMessage format
    const promptMessages: ChatMessage[] = [
      { role: 'system', content: coachSystemPrompt },
      ...slidingWindow.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      })),
    ];

    // 8. Query OpenRouter Hermes 3 Stream
    const stream = queryOpenRouterStream(promptMessages, {
      temperature: 0.7,
      max_tokens: 1500,
    });

    const encoder = new TextEncoder();
    let fullReply = '';

    const customStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            fullReply += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

          // Save Coach reply in the database statefully
          await ConversationService.appendMessage(conversationId, 'assistant', fullReply);
        } catch (err: any) {
          console.error('Streaming response error:', err);
          controller.error(err);
        }
      }
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error: any) {
    console.error('Chat API route error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while calling the career coach AI.' },
      { status: 500 }
    );
  }
}
