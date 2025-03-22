import { Message } from 'discord.js';
import { storage } from '../storage';

// Max context size (overridden by bot settings)
const DEFAULT_CONTEXT_SIZE = 5;

// Message type for conversation context
interface ContextMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// Get the active conversation context for a user
export async function getContext(userId: string): Promise<ContextMessage[]> {
  // Check if context awareness is enabled
  const botSettings = await storage.getBotSettings();
  if (!botSettings || !botSettings.contextAwareness) {
    return []; // Return empty context if disabled
  }
  
  const contextSize = botSettings.contextSize || DEFAULT_CONTEXT_SIZE;
  
  // Get active conversation or create new one
  let conversation = await storage.getActiveConversationByUserId(userId);
  
  if (!conversation) {
    // Create a new conversation with empty context
    conversation = await storage.createConversation({
      userId,
      context: [],
      active: true
    });
  }
  
  // Return the context messages
  return Array.isArray(conversation.context) 
    ? conversation.context.slice(-contextSize) // Only return up to contextSize messages
    : [];
}

// Add user message to context
export async function addUserMessage(message: Message): Promise<void> {
  const userId = message.author.id;
  const botSettings = await storage.getBotSettings();
  
  // Skip if context awareness is disabled
  if (!botSettings || !botSettings.contextAwareness) {
    return;
  }
  
  // Get the active conversation
  let conversation = await storage.getActiveConversationByUserId(userId);
  
  if (!conversation) {
    // Create a new conversation
    conversation = await storage.createConversation({
      userId,
      context: [],
      active: true
    });
  }
  
  // Create context message
  const contextMessage: ContextMessage = {
    role: 'user',
    content: message.content,
    timestamp: new Date()
  };
  
  // Add to existing context
  let updatedContext: ContextMessage[] = [];
  
  if (Array.isArray(conversation.context)) {
    updatedContext = [...conversation.context, contextMessage];
  } else {
    updatedContext = [contextMessage];
  }
  
  // Limit context size
  const contextSize = botSettings.contextSize || DEFAULT_CONTEXT_SIZE;
  if (updatedContext.length > contextSize * 2) { // Keep twice as many to have pairs of messages
    updatedContext = updatedContext.slice(-contextSize * 2);
  }
  
  // Update the conversation
  await storage.updateConversation(conversation.id, updatedContext);
}

// Add bot message to context
export async function addBotMessage(userId: string, content: string): Promise<void> {
  const botSettings = await storage.getBotSettings();
  
  // Skip if context awareness is disabled
  if (!botSettings || !botSettings.contextAwareness) {
    return;
  }
  
  // Get the active conversation
  const conversation = await storage.getActiveConversationByUserId(userId);
  
  if (!conversation) {
    // This shouldn't happen normally, as user message should be added first
    console.error(`No active conversation found for user ${userId} when adding bot message`);
    return;
  }
  
  // Create context message
  const contextMessage: ContextMessage = {
    role: 'assistant',
    content: content,
    timestamp: new Date()
  };
  
  // Add to existing context
  let updatedContext: ContextMessage[] = [];
  
  if (Array.isArray(conversation.context)) {
    updatedContext = [...conversation.context, contextMessage];
  } else {
    updatedContext = [contextMessage];
  }
  
  // Limit context size
  const contextSize = botSettings.contextSize || DEFAULT_CONTEXT_SIZE;
  if (updatedContext.length > contextSize * 2) { // Keep twice as many to have pairs of messages
    updatedContext = updatedContext.slice(-contextSize * 2);
  }
  
  // Update the conversation
  await storage.updateConversation(conversation.id, updatedContext);
}

// Close a conversation (mark as inactive)
export async function closeConversation(userId: string): Promise<boolean> {
  const conversation = await storage.getActiveConversationByUserId(userId);
  
  if (!conversation) {
    return false;
  }
  
  return storage.closeConversation(conversation.id);
}

// Format context for OpenAI API
export function formatContextForNLP(context: ContextMessage[]): Array<{role: string, content: string}> {
  // Add system message at the beginning
  const formattedContext = [{
    role: 'system',
    content: 'You are a helpful Discord bot assistant. Provide concise, accurate information. If you don\'t know something, say so rather than making up information.'
  }];
  
  // Add the conversation context
  context.forEach(message => {
    formattedContext.push({
      role: message.role,
      content: message.content
    });
  });
  
  return formattedContext;
}

// Update context based on new settings
export async function updateContext(userId: string, newContextSize: number): Promise<void> {
  const conversation = await storage.getActiveConversationByUserId(userId);
  
  if (!conversation || !Array.isArray(conversation.context)) {
    return;
  }
  
  // If new context size is smaller, trim the context
  if (conversation.context.length > newContextSize * 2) {
    const updatedContext = conversation.context.slice(-newContextSize * 2);
    await storage.updateConversation(conversation.id, updatedContext);
  }
}
