import { Message } from 'discord.js';
import OpenAI from 'openai';
import { storage } from '../storage';

// Initialize OpenAI client if API key exists, otherwise use a mock client
let openai: OpenAI;

try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'mock-key'
  });
} catch (error) {
  console.warn('OpenAI client initialization failed in moderation module, using fallback implementation');
  // This is just for development without API keys
  openai = {
    moderations: {
      create: async () => ({
        results: [{ 
          flagged: false,
          categories: {},
          category_scores: {}
        }]
      })
    }
  } as any;
}

interface ModerationResult {
  action: 'none' | 'warn' | 'mute' | 'kick' | 'ban';
  reason?: string;
}

// Moderate a message
export async function moderateMessage(message: Message): Promise<ModerationResult> {
  try {
    // Check if moderation is enabled
    const botSettings = await storage.getBotSettings();
    if (!botSettings?.autoModeration) {
      return { action: 'none' };
    }
    
    // Skip empty messages
    if (!message.content.trim()) {
      return { action: 'none' };
    }
    
    // Check message using OpenAI Moderation API
    const moderationResponse = await openai.moderations.create({
      input: message.content,
    });
    
    const results = moderationResponse.results[0];
    
    // If flagged, determine action based on severity
    if (results.flagged) {
      // Get categories that were flagged
      const flaggedCategories = Object.entries(results.categories)
        .filter(([_, value]) => value === true)
        .map(([key, _]) => key);
      
      // Determine severity by number of flagged categories and scores
      const scores = results.category_scores;
      const maxScore = Math.max(...Object.values(scores));
      let action: ModerationResult['action'] = 'none';
      
      // High severity categories that should result in stronger actions
      const highSeverityCategories = [
        'sexual/minors',
        'violence/graphic',
        'hate/threatening',
        'self-harm/intent'
      ];
      
      const hasHighSeverity = flaggedCategories.some(category => 
        highSeverityCategories.includes(category)
      );
      
      // Determine action based on severity
      if (hasHighSeverity || maxScore > 0.9) {
        action = 'mute'; // Higher severity
      } else if (maxScore > 0.7) {
        action = 'warn'; // Medium severity
      } else {
        // Low severity, just monitor
        return { action: 'none' };
      }
      
      // Create reason message
      const reason = `Message contained inappropriate content: ${flaggedCategories.join(', ')}`;
      
      // Log moderation action
      await storage.createModerationAction({
        userId: message.author.id,
        type: action,
        reason
      });
      
      // Execute moderation action
      await executeModerationAction(message, action, reason);
      
      return { action, reason };
    }
    
    return { action: 'none' };
  } catch (error) {
    console.error('Error in message moderation:', error);
    return { action: 'none' };
  }
}

// Execute moderation action
async function executeModerationAction(message: Message, action: ModerationResult['action'], reason: string): Promise<void> {
  if (action === 'none') return;
  
  try {
    // Delete message for all moderation actions
    await message.delete();
  } catch (error) {
    console.error('Failed to delete message:', error);
  }
  
  try {
    switch (action) {
      case 'warn':
        // Send warning message to user
        await message.author.send(`⚠️ Warning: Your message was removed. ${reason}`);
        break;
        
      case 'mute':
        // Time out user (if in a guild)
        if (message.guild && message.member) {
          await message.member.timeout(10 * 60 * 1000, reason); // 10 minutes timeout
          await message.author.send(`🔇 You have been temporarily muted. ${reason}`);
        }
        break;
        
      case 'kick':
        // Kick user (if in a guild)
        if (message.guild && message.member) {
          await message.member.kick(reason);
        }
        break;
        
      case 'ban':
        // Ban user (if in a guild)
        if (message.guild && message.member) {
          await message.guild.members.ban(message.author.id, { reason });
        }
        break;
    }
  } catch (error) {
    console.error(`Failed to execute moderation action (${action}):`, error);
  }
}

// Export function to manually moderate a user
export async function moderateUser(userId: string, action: ModerationResult['action'], reason: string): Promise<boolean> {
  try {
    // Log moderation action
    await storage.createModerationAction({
      userId,
      type: action,
      reason
    });
    
    return true;
  } catch (error) {
    console.error('Error in manual moderation:', error);
    return false;
  }
}
