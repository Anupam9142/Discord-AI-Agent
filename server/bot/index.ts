import { Client, Events, GatewayIntentBits, Message } from 'discord.js';
import { handleCommand } from './commands';
import { processNaturalLanguage } from './nlp';
import { getContext, updateContext } from './context';
import { moderateMessage } from './moderation';
import { storage } from '../storage';

// Initialize Discord client with necessary intents
export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Command prefix
const PREFIX = '!';

let isReady = false;

// Handle incoming messages
client.on(Events.MessageCreate, async (message: Message) => {
  if (!isReady || message.author.bot) return;

  try {
    // Store or update user in our database
    await ensureUserExists(message);

    // Check if message is a command (starts with prefix)
    if (message.content.startsWith(PREFIX)) {
      await handleCommand(message, PREFIX);
      return;
    }

    // Check if moderation is needed
    const botSettings = await storage.getBotSettings();
    if (botSettings?.autoModeration) {
      const moderationResult = await moderateMessage(message);
      if (moderationResult.action) {
        // Message was moderated, no need to process further
        return;
      }
    }

    // Process as natural language if the bot was mentioned or in a DM channel
    const isMentioned = message.mentions.has(client.user!.id);
    const isDM = message.channel.isDMBased();
    
    if (isMentioned || isDM) {
      await processNaturalLanguage(message);
    }
  } catch (error) {
    console.error('Error processing message:', error);
    try {
      await message.reply('Sorry, I encountered an error processing your request. Please try again later.');
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
});

// Bot is ready
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user!.tag}`);
  
  // Initialize bot settings if not exists
  const botSettings = await storage.getBotSettings();
  if (!botSettings) {
    await storage.createBotSettings({
      contextAwareness: true,
      autoModeration: true,
      userTracking: false,
      debugMode: false,
      nlpModel: "gpt",
      temperature: "0.7",
      maxTokens: 150,
      contextSize: 5
    });
  }
  
  isReady = true;
});

// Helper function to ensure user exists in database
async function ensureUserExists(message: Message) {
  const userId = message.author.id;
  const user = await storage.getDiscordUser(userId);
  
  if (!user) {
    await storage.createDiscordUser({
      id: userId,
      username: message.author.username,
      preferences: {}
    });
  }
}

// Start the bot
export function startBot() {
  const token = process.env.DISCORD_BOT_TOKEN;
  
  if (!token) {
    console.warn('Missing DISCORD_BOT_TOKEN environment variable - Discord bot will run in offline mode');
    // Set bot as ready even without token to allow dashboard to function
    isReady = true;
    return;
  }
  
  console.log('Attempting to connect to Discord with provided token...');
  
  client.login(token).then(() => {
    console.log(`Discord bot successfully connected as ${client.user?.tag}`);
  }).catch(error => {
    if (error.code === 'TokenInvalid') {
      console.error('Invalid Discord Bot Token provided. Please check your DISCORD_BOT_TOKEN environment variable.');
      console.error('You can obtain a valid token from the Discord Developer Portal: https://discord.com/developers/applications');
    } else if (error.code === 'DisallowedIntents') {
      console.error('Discord bot failed to start due to insufficient privileged intents.');
      console.error('Please make sure privileged intents are enabled in the Discord Developer Portal for your bot.');
    } else {
      console.error('Failed to start Discord bot:', error);
    }
    
    // Set bot as ready even if login fails to allow dashboard to function
    isReady = true;
  });
}

// Stop the bot
export function stopBot() {
  client.destroy();
  isReady = false;
  console.log('Discord bot stopped');
}

// Get bot status
export function getBotStatus() {
  return {
    ready: isReady,
    username: client.user?.username,
    id: client.user?.id,
    serverCount: client.guilds.cache.size,
    uptime: client.uptime,
  };
}
