import { queryClient } from './queryClient';

/**
 * API utilities for the Discord AI Agent Bot
 */

// API endpoints
export const ENDPOINTS = {
  STATS: '/api/stats',
  BOT_STATUS: '/api/status',
  BOT_START: '/api/bot/start',
  BOT_STOP: '/api/bot/stop',
  SETTINGS: '/api/settings',
  TOGGLE_SETTING: '/api/settings/toggle',
  CONVERSATIONS: '/api/conversations/recent',
  CONVERSATION: (id: number) => `/api/conversations/${id}`,
  COMMANDS: '/api/commands',
  COMMAND_STATS: '/api/commands/stats',
  INTEGRATIONS: '/api/integrations',
  INTEGRATION: (id: number) => `/api/integrations/${id}`,
  TOGGLE_INTEGRATION: (id: number) => `/api/integrations/${id}/toggle`,
  MODERATION: '/api/moderation',
  TEST_GENERATE: '/api/test/generate',
};

// Type definitions for API responses
export interface BotStatus {
  status: {
    ready: boolean;
    username?: string;
    id?: string;
    serverCount?: number;
    uptime?: number;
  };
  systemInfo: {
    cpuUsage: number;
    memoryUsage: number;
    apiRateLimit: number;
  };
}

export interface DashboardStats {
  totalCommands: number;
  activeConversations: number;
  apiIntegrations: number;
  moderationActions: number;
}

export interface BotSettings {
  id: number;
  contextAwareness: boolean;
  autoModeration: boolean;
  userTracking: boolean;
  debugMode: boolean;
  nlpModel: string;
  temperature: string;
  maxTokens: number;
  contextSize: number;
  updatedAt: string;
}

export interface Command {
  id: number;
  name: string;
  description: string;
  usage: number;
  createdAt: string;
  percentage?: number;
}

export interface ApiIntegration {
  id: number;
  name: string;
  type: string;
  endpoint: string;
  authMethod: string;
  apiKey?: string;
  active: boolean;
  usage: number;
  monthlyLimit: number;
  lastCall: string | null;
  createdAt: string;
}

export interface ModerationAction {
  id: number;
  userId: string;
  type: string;
  reason: string;
  createdAt: string;
}

export interface ContextMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: number;
  userId: string;
  username: string;
  context: ContextMessage[];
  active: boolean;
  lastUpdated: string;
  createdAt: string;
}

// API utility functions

// Invalidate queries
export function invalidateQueries(keys: string[]) {
  keys.forEach(key => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
}

// Format relative time
export function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMinutes = Math.round((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

// Format large numbers
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

// Get icon for different integration types
export function getIntegrationIcon(type: string): { icon: string, color: string } {
  switch (type) {
    case 'weather':
      return { icon: 'cloud', color: 'blue' };
    case 'translation':
      return { icon: 'language', color: 'purple' };
    case 'news':
      return { icon: 'newspaper', color: 'yellow' };
    default:
      return { icon: 'plug', color: 'gray' };
  }
}

// Get icon for different command types
export function getCommandIcon(name: string): string {
  switch (name) {
    case 'weather': return 'cloud';
    case 'translate': return 'language';
    case 'news': return 'newspaper';
    case 'help': return 'question-circle';
    case 'remind': return 'clock';
    case 'stats': return 'chart-bar';
    default: return 'terminal';
  }
}
