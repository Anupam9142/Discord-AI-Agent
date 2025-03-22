import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from 'ws';
import { z } from "zod";
import { storage } from "./storage";
import { startBot, stopBot, getBotStatus, client } from "./bot/index";
import { GatewayIntentBits } from "discord.js";
import { getAllCommands } from "./bot/commands";
import { generateResponse, getOpenAIStatus } from "./bot/nlp";
import { moderateUser } from "./bot/moderation";
import { insertApiIntegrationSchema, insertBotSettingsSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Root endpoint for health check
  app.get('/', (req: Request, res: Response) => {
    res.json({ 
      status: 'ok', 
      message: 'Discord AI Agent is running. Access the dashboard to start using the bot.',
      timestamp: new Date().toISOString()
    });
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Initialize WebSocket server for real-time updates with specific path to avoid conflicts
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/api/ws',
    // Disable per-message deflate to avoid issues in Replit environment
    perMessageDeflate: false 
  });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({ type: 'connection', status: 'connected' }));
    
    ws.on('message', (message) => {
      console.log('Received message:', message.toString());
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  // Broadcast updates to all connected clients
  const broadcastUpdate = (type: string, data: any) => {
    const message = JSON.stringify({ type, data });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(message);
      }
    });
  };
  
  // Get bot status
  app.get('/api/status', async (req: Request, res: Response) => {
    const botStatus = getBotStatus();
    const openaiStatus = getOpenAIStatus();
    
    // Check if the bot is running with full or limited permissions
    const hasFullFunctionality = client.options.intents.has(GatewayIntentBits.MessageContent);
    
    // Enhanced bot status with functionality level
    const enhancedBotStatus = {
      ...botStatus,
      functionality: hasFullFunctionality ? 'full' : 'limited',
      limitations: hasFullFunctionality ? [] : [
        'Cannot read message content',
        'Cannot process commands automatically',
        'Limited moderation capabilities'
      ]
    };
    
    res.json({
      bot: enhancedBotStatus,
      nlp: {
        status: openaiStatus.status,
        message: openaiStatus.message,
        active: openaiStatus.useOpenAI
      },
      systemInfo: {
        cpuUsage: 28, // Mock value, would need actual system monitoring
        memoryUsage: 25, // Mock value, would need actual system monitoring
        apiRateLimit: 47, // Mock value, would need actual API rate limit tracking
      }
    });
  });
  
  // Start bot
  app.post('/api/bot/start', async (req: Request, res: Response) => {
    try {
      startBot();
      res.json({ success: true, message: 'Bot started successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  
  // Stop bot
  app.post('/api/bot/stop', async (req: Request, res: Response) => {
    try {
      stopBot();
      res.json({ success: true, message: 'Bot stopped successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  
  // Get dashboard stats
  app.get('/api/stats', async (req: Request, res: Response) => {
    try {
      const totalCommands = await storage.getTotalCommandsCount();
      const activeConversations = await storage.getActiveConversationsCount();
      const apiIntegrationsCount = await storage.getApiIntegrationsCount();
      const moderationActionsCount = await storage.getModerationActionsCount();
      
      res.json({
        totalCommands,
        activeConversations,
        apiIntegrations: apiIntegrationsCount,
        moderationActions: moderationActionsCount
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get recent conversations
  app.get('/api/conversations/recent', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const conversations = await storage.getRecentConversations(limit);
      
      // For each conversation, get the username
      const conversationsWithUsernames = await Promise.all(
        conversations.map(async (conversation) => {
          const user = await storage.getDiscordUser(conversation.userId);
          return {
            ...conversation,
            username: user?.username || 'Unknown User'
          };
        })
      );
      
      res.json(conversationsWithUsernames);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get conversation by id
  app.get('/api/conversations/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await storage.getConversation(id);
      
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      const user = await storage.getDiscordUser(conversation.userId);
      
      res.json({
        ...conversation,
        username: user?.username || 'Unknown User'
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get all commands
  app.get('/api/commands', async (req: Request, res: Response) => {
    try {
      const commands = await storage.getCommands();
      res.json(commands);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get command statistics
  app.get('/api/commands/stats', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const commandStats = await storage.getCommandStats(limit);
      
      // Calculate percentages
      const totalUsage = commandStats.reduce((sum, cmd) => sum + cmd.usage, 0);
      const commandsWithPercentage = commandStats.map(cmd => ({
        ...cmd,
        percentage: totalUsage > 0 ? Math.round((cmd.usage / totalUsage) * 100) : 0
      }));
      
      res.json(commandsWithPercentage);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get API integrations
  app.get('/api/integrations', async (req: Request, res: Response) => {
    try {
      const integrations = await storage.getApiIntegrations();
      res.json(integrations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get API integration by id
  app.get('/api/integrations/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const integration = await storage.getApiIntegration(id);
      
      if (!integration) {
        return res.status(404).json({ message: 'Integration not found' });
      }
      
      res.json(integration);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Create new API integration
  app.post('/api/integrations', async (req: Request, res: Response) => {
    try {
      const validatedData = insertApiIntegrationSchema.parse(req.body);
      const integration = await storage.createApiIntegration(validatedData);
      
      broadcastUpdate('integration_added', integration);
      
      res.status(201).json(integration);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid integration data', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update API integration
  app.patch('/api/integrations/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const integration = await storage.getApiIntegration(id);
      
      if (!integration) {
        return res.status(404).json({ message: 'Integration not found' });
      }
      
      const updatedIntegration = await storage.updateApiIntegration(id, req.body);
      
      broadcastUpdate('integration_updated', updatedIntegration);
      
      res.json(updatedIntegration);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Toggle API integration status
  app.post('/api/integrations/:id/toggle', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const integration = await storage.getApiIntegration(id);
      
      if (!integration) {
        return res.status(404).json({ message: 'Integration not found' });
      }
      
      const active = req.body.active === undefined ? !integration.active : !!req.body.active;
      const updatedIntegration = await storage.toggleApiIntegration(id, active);
      
      broadcastUpdate('integration_updated', updatedIntegration);
      
      res.json(updatedIntegration);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get bot settings
  app.get('/api/settings', async (req: Request, res: Response) => {
    try {
      const settings = await storage.getBotSettings();
      
      if (!settings) {
        return res.status(404).json({ message: 'Settings not found' });
      }
      
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update bot settings
  app.patch('/api/settings', async (req: Request, res: Response) => {
    try {
      const settings = await storage.getBotSettings();
      
      if (!settings) {
        // Create settings if they don't exist
        const validatedData = insertBotSettingsSchema.parse(req.body);
        const newSettings = await storage.createBotSettings(validatedData);
        return res.json(newSettings);
      }
      
      const updatedSettings = await storage.updateBotSettings(req.body);
      
      broadcastUpdate('settings_updated', updatedSettings);
      
      res.json(updatedSettings);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid settings data', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  // Toggle a specific setting
  app.post('/api/settings/toggle', async (req: Request, res: Response) => {
    try {
      const { setting, value } = req.body;
      
      if (!setting) {
        return res.status(400).json({ message: 'Setting name is required' });
      }
      
      const settings = await storage.getBotSettings();
      
      if (!settings) {
        return res.status(404).json({ message: 'Settings not found' });
      }
      
      // Make sure the setting exists
      if (!(setting in settings)) {
        return res.status(400).json({ message: `Invalid setting: ${setting}` });
      }
      
      // Update the setting
      const updateData: any = {};
      updateData[setting] = value === undefined ? !settings[setting as keyof typeof settings] : value;
      
      const updatedSettings = await storage.updateBotSettings(updateData);
      
      broadcastUpdate('settings_updated', updatedSettings);
      
      res.json(updatedSettings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get moderation actions
  app.get('/api/moderation', async (req: Request, res: Response) => {
    try {
      const actions = await storage.getModerationActions();
      res.json(actions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Create moderation action
  app.post('/api/moderation', async (req: Request, res: Response) => {
    try {
      const { userId, type, reason } = req.body;
      
      if (!userId || !type || !reason) {
        return res.status(400).json({ message: 'userId, type, and reason are required' });
      }
      
      // Validate action type
      const validTypes = ['warn', 'mute', 'kick', 'ban'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ message: `Invalid action type. Must be one of: ${validTypes.join(', ')}` });
      }
      
      // Create the moderation action
      const action = await storage.createModerationAction({ userId, type, reason });
      
      // Execute the moderation in Discord
      await moderateUser(userId, type, reason);
      
      broadcastUpdate('moderation_action_added', action);
      
      res.status(201).json(action);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Test interface - generate response
  app.post('/api/test/generate', async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
      }
      
      const response = await generateResponse(prompt);
      
      res.json({ response });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  return httpServer;
}
