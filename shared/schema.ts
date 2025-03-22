import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Discord server members/users
export const discordUsers = pgTable("discord_users", {
  id: text("id").primaryKey(), // Discord user ID
  username: text("username").notNull(),
  preferences: jsonb("preferences"), // User preferences for bot interactions
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDiscordUserSchema = createInsertSchema(discordUsers).pick({
  id: true,
  username: true,
  preferences: true,
});

export type InsertDiscordUser = z.infer<typeof insertDiscordUserSchema>;
export type DiscordUser = typeof discordUsers.$inferSelect;

// Conversations with context
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => discordUsers.id),
  context: jsonb("context").notNull(), // Array of messages with roles
  active: boolean("active").default(true),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  userId: true,
  context: true,
  active: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// Commands usage tracking
export const commands = pgTable("commands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  usage: integer("usage").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommandSchema = createInsertSchema(commands).pick({
  name: true,
  description: true,
  usage: true,
});

export type InsertCommand = z.infer<typeof insertCommandSchema>;
export type Command = typeof commands.$inferSelect;

// API integrations
export const apiIntegrations = pgTable("api_integrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // weather, news, translation, etc.
  endpoint: text("endpoint").notNull(),
  authMethod: text("auth_method").notNull(),
  apiKey: text("api_key"),
  active: boolean("active").default(true),
  usage: integer("usage").default(0),
  monthlyLimit: integer("monthly_limit").default(1000),
  lastCall: timestamp("last_call"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertApiIntegrationSchema = createInsertSchema(apiIntegrations).omit({
  id: true,
  usage: true,
  lastCall: true,
  createdAt: true,
});

export type InsertApiIntegration = z.infer<typeof insertApiIntegrationSchema>;
export type ApiIntegration = typeof apiIntegrations.$inferSelect;

// Bot settings
export const botSettings = pgTable("bot_settings", {
  id: serial("id").primaryKey(),
  contextAwareness: boolean("context_awareness").default(true),
  autoModeration: boolean("auto_moderation").default(true),
  userTracking: boolean("user_tracking").default(false),
  debugMode: boolean("debug_mode").default(false),
  nlpModel: text("nlp_model").default("gpt"),
  temperature: text("temperature").default("0.7"),
  maxTokens: integer("max_tokens").default(150),
  contextSize: integer("context_size").default(5),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBotSettingsSchema = createInsertSchema(botSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertBotSettings = z.infer<typeof insertBotSettingsSchema>;
export type BotSettings = typeof botSettings.$inferSelect;

// Moderation actions
export const moderationActions = pgTable("moderation_actions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(), // warning, mute, kick, ban
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertModerationActionSchema = createInsertSchema(moderationActions).pick({
  userId: true,
  type: true,
  reason: true,
});

export type InsertModerationAction = z.infer<typeof insertModerationActionSchema>;
export type ModerationAction = typeof moderationActions.$inferSelect;
