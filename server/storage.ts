import {
  users, type User, type InsertUser,
  discordUsers, type DiscordUser, type InsertDiscordUser,
  conversations, type Conversation, type InsertConversation,
  commands, type Command, type InsertCommand,
  apiIntegrations, type ApiIntegration, type InsertApiIntegration,
  botSettings, type BotSettings, type InsertBotSettings,
  moderationActions, type ModerationAction, type InsertModerationAction
} from "@shared/schema";

// Storage interface with all CRUD operations
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Discord Users
  getDiscordUser(id: string): Promise<DiscordUser | undefined>;
  getDiscordUsers(): Promise<DiscordUser[]>;
  createDiscordUser(user: InsertDiscordUser): Promise<DiscordUser>;
  updateDiscordUserPreferences(id: string, preferences: any): Promise<DiscordUser | undefined>;

  // Conversations
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationsByUserId(userId: string): Promise<Conversation[]>;
  getActiveConversationByUserId(userId: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, context: any): Promise<Conversation | undefined>;
  closeConversation(id: number): Promise<boolean>;
  getRecentConversations(limit: number): Promise<Conversation[]>;
  getActiveConversationsCount(): Promise<number>;

  // Commands
  getCommand(id: number): Promise<Command | undefined>;
  getCommandByName(name: string): Promise<Command | undefined>;
  getCommands(): Promise<Command[]>;
  createCommand(command: InsertCommand): Promise<Command>;
  updateCommandUsage(name: string): Promise<Command | undefined>;
  getCommandStats(limit: number): Promise<Command[]>;
  getTotalCommandsCount(): Promise<number>;

  // API Integrations
  getApiIntegration(id: number): Promise<ApiIntegration | undefined>;
  getApiIntegrationByName(name: string): Promise<ApiIntegration | undefined>;
  getApiIntegrations(): Promise<ApiIntegration[]>;
  createApiIntegration(integration: InsertApiIntegration): Promise<ApiIntegration>;
  updateApiIntegration(id: number, integration: Partial<ApiIntegration>): Promise<ApiIntegration | undefined>;
  updateApiIntegrationUsage(id: number): Promise<ApiIntegration | undefined>;
  toggleApiIntegration(id: number, active: boolean): Promise<ApiIntegration | undefined>;
  getApiIntegrationsCount(): Promise<number>;

  // Bot Settings
  getBotSettings(): Promise<BotSettings | undefined>;
  createBotSettings(settings: InsertBotSettings): Promise<BotSettings>;
  updateBotSettings(settings: Partial<BotSettings>): Promise<BotSettings | undefined>;

  // Moderation Actions
  getModerationAction(id: number): Promise<ModerationAction | undefined>;
  getModerationActions(): Promise<ModerationAction[]>;
  getModerationActionsByUserId(userId: string): Promise<ModerationAction[]>;
  createModerationAction(action: InsertModerationAction): Promise<ModerationAction>;
  getModerationActionsCount(): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private discordUsers: Map<string, DiscordUser>;
  private conversations: Map<number, Conversation>;
  private commands: Map<number, Command>;
  private apiIntegrations: Map<number, ApiIntegration>;
  private botSettings: BotSettings | undefined;
  private moderationActions: Map<number, ModerationAction>;
  
  currentUserId: number;
  currentConversationId: number;
  currentCommandId: number;
  currentApiIntegrationId: number;
  currentModerationActionId: number;

  constructor() {
    this.users = new Map();
    this.discordUsers = new Map();
    this.conversations = new Map();
    this.commands = new Map();
    this.apiIntegrations = new Map();
    this.moderationActions = new Map();
    
    this.currentUserId = 1;
    this.currentConversationId = 1;
    this.currentCommandId = 1;
    this.currentApiIntegrationId = 1;
    this.currentModerationActionId = 1;
    
    // Initialize with default commands
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Add default commands
    const defaultCommands: InsertCommand[] = [
      { name: "weather", description: "Get weather for a location", usage: 324 },
      { name: "translate", description: "Translate text to another language", usage: 157 },
      { name: "news", description: "Get latest news headlines", usage: 103 },
      { name: "help", description: "Show help information", usage: 98 },
      { name: "remind", description: "Set a reminder", usage: 45 }
    ];

    defaultCommands.forEach(cmd => this.createCommand(cmd));

    // Add default API integrations
    const defaultIntegrations: InsertApiIntegration[] = [
      {
        name: "Weather API",
        type: "weather",
        endpoint: "https://api.openweathermap.org/data/2.5/weather",
        authMethod: "api-key",
        apiKey: "",
        active: true,
        monthlyLimit: 1000
      },
      {
        name: "Translation API",
        type: "translation",
        endpoint: "https://translation.googleapis.com/language/translate/v2",
        authMethod: "api-key",
        apiKey: "",
        active: true,
        monthlyLimit: 500
      },
      {
        name: "News API",
        type: "news",
        endpoint: "https://newsapi.org/v2/top-headlines",
        authMethod: "api-key",
        apiKey: "",
        active: true,
        monthlyLimit: 500
      }
    ];

    defaultIntegrations.forEach(integration => this.createApiIntegration(integration));

    // Create default bot settings
    this.createBotSettings({
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

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Discord User methods
  async getDiscordUser(id: string): Promise<DiscordUser | undefined> {
    return this.discordUsers.get(id);
  }

  async getDiscordUsers(): Promise<DiscordUser[]> {
    return Array.from(this.discordUsers.values());
  }

  async createDiscordUser(user: InsertDiscordUser): Promise<DiscordUser> {
    const now = new Date();
    const discordUser: DiscordUser = { 
      ...user, 
      createdAt: now
    };
    this.discordUsers.set(user.id, discordUser);
    return discordUser;
  }

  async updateDiscordUserPreferences(id: string, preferences: any): Promise<DiscordUser | undefined> {
    const user = await this.getDiscordUser(id);
    if (!user) return undefined;
    
    const updatedUser: DiscordUser = {
      ...user,
      preferences
    };
    
    this.discordUsers.set(id, updatedUser);
    return updatedUser;
  }

  // Conversation methods
  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(conversation => conversation.userId === userId)
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }

  async getActiveConversationByUserId(userId: string): Promise<Conversation | undefined> {
    return Array.from(this.conversations.values())
      .find(conversation => conversation.userId === userId && conversation.active);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.currentConversationId++;
    const now = new Date();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      lastUpdated: now,
      createdAt: now
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: number, context: any): Promise<Conversation | undefined> {
    const conversation = await this.getConversation(id);
    if (!conversation) return undefined;
    
    const updatedConversation: Conversation = {
      ...conversation,
      context,
      lastUpdated: new Date()
    };
    
    this.conversations.set(id, updatedConversation);
    return updatedConversation;
  }

  async closeConversation(id: number): Promise<boolean> {
    const conversation = await this.getConversation(id);
    if (!conversation) return false;
    
    const updatedConversation: Conversation = {
      ...conversation,
      active: false,
      lastUpdated: new Date()
    };
    
    this.conversations.set(id, updatedConversation);
    return true;
  }

  async getRecentConversations(limit: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, limit);
  }

  async getActiveConversationsCount(): Promise<number> {
    return Array.from(this.conversations.values())
      .filter(conversation => conversation.active)
      .length;
  }

  // Command methods
  async getCommand(id: number): Promise<Command | undefined> {
    return this.commands.get(id);
  }

  async getCommandByName(name: string): Promise<Command | undefined> {
    return Array.from(this.commands.values())
      .find(command => command.name === name);
  }

  async getCommands(): Promise<Command[]> {
    return Array.from(this.commands.values());
  }

  async createCommand(insertCommand: InsertCommand): Promise<Command> {
    const id = this.currentCommandId++;
    const now = new Date();
    const command: Command = {
      ...insertCommand,
      id,
      createdAt: now
    };
    this.commands.set(id, command);
    return command;
  }

  async updateCommandUsage(name: string): Promise<Command | undefined> {
    const command = await this.getCommandByName(name);
    if (!command) return undefined;
    
    const updatedCommand: Command = {
      ...command,
      usage: command.usage + 1
    };
    
    this.commands.set(command.id, updatedCommand);
    return updatedCommand;
  }

  async getCommandStats(limit: number): Promise<Command[]> {
    return Array.from(this.commands.values())
      .sort((a, b) => b.usage - a.usage)
      .slice(0, limit);
  }

  async getTotalCommandsCount(): Promise<number> {
    return Array.from(this.commands.values())
      .reduce((total, command) => total + command.usage, 0);
  }

  // API Integration methods
  async getApiIntegration(id: number): Promise<ApiIntegration | undefined> {
    return this.apiIntegrations.get(id);
  }

  async getApiIntegrationByName(name: string): Promise<ApiIntegration | undefined> {
    return Array.from(this.apiIntegrations.values())
      .find(integration => integration.name === name);
  }

  async getApiIntegrations(): Promise<ApiIntegration[]> {
    return Array.from(this.apiIntegrations.values());
  }

  async createApiIntegration(insertIntegration: InsertApiIntegration): Promise<ApiIntegration> {
    const id = this.currentApiIntegrationId++;
    const now = new Date();
    const integration: ApiIntegration = {
      ...insertIntegration,
      id,
      usage: 0,
      lastCall: null,
      createdAt: now
    };
    this.apiIntegrations.set(id, integration);
    return integration;
  }

  async updateApiIntegration(id: number, integration: Partial<ApiIntegration>): Promise<ApiIntegration | undefined> {
    const existingIntegration = await this.getApiIntegration(id);
    if (!existingIntegration) return undefined;
    
    const updatedIntegration: ApiIntegration = {
      ...existingIntegration,
      ...integration
    };
    
    this.apiIntegrations.set(id, updatedIntegration);
    return updatedIntegration;
  }

  async updateApiIntegrationUsage(id: number): Promise<ApiIntegration | undefined> {
    const integration = await this.getApiIntegration(id);
    if (!integration) return undefined;
    
    const updatedIntegration: ApiIntegration = {
      ...integration,
      usage: integration.usage + 1,
      lastCall: new Date()
    };
    
    this.apiIntegrations.set(id, updatedIntegration);
    return updatedIntegration;
  }

  async toggleApiIntegration(id: number, active: boolean): Promise<ApiIntegration | undefined> {
    const integration = await this.getApiIntegration(id);
    if (!integration) return undefined;
    
    const updatedIntegration: ApiIntegration = {
      ...integration,
      active
    };
    
    this.apiIntegrations.set(id, updatedIntegration);
    return updatedIntegration;
  }

  async getApiIntegrationsCount(): Promise<number> {
    return this.apiIntegrations.size;
  }

  // Bot Settings methods
  async getBotSettings(): Promise<BotSettings | undefined> {
    return this.botSettings;
  }

  async createBotSettings(insertSettings: InsertBotSettings): Promise<BotSettings> {
    const id = 1; // Only one settings record
    const now = new Date();
    const settings: BotSettings = {
      ...insertSettings,
      id,
      updatedAt: now
    };
    this.botSettings = settings;
    return settings;
  }

  async updateBotSettings(settings: Partial<BotSettings>): Promise<BotSettings | undefined> {
    if (!this.botSettings) return undefined;
    
    const updatedSettings: BotSettings = {
      ...this.botSettings,
      ...settings,
      updatedAt: new Date()
    };
    
    this.botSettings = updatedSettings;
    return updatedSettings;
  }

  // Moderation Actions methods
  async getModerationAction(id: number): Promise<ModerationAction | undefined> {
    return this.moderationActions.get(id);
  }

  async getModerationActions(): Promise<ModerationAction[]> {
    return Array.from(this.moderationActions.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getModerationActionsByUserId(userId: string): Promise<ModerationAction[]> {
    return Array.from(this.moderationActions.values())
      .filter(action => action.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createModerationAction(insertAction: InsertModerationAction): Promise<ModerationAction> {
    const id = this.currentModerationActionId++;
    const now = new Date();
    const action: ModerationAction = {
      ...insertAction,
      id,
      createdAt: now
    };
    this.moderationActions.set(id, action);
    return action;
  }

  async getModerationActionsCount(): Promise<number> {
    return this.moderationActions.size;
  }
}

export const storage = new MemStorage();
