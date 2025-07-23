import { pgTable, text, boolean, timestamp, jsonb, primaryKey, varchar } from "drizzle-orm/pg-core";

// Clerk user table
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(), // Clerk user ID
});

// Chat table
export const chats = pgTable("chats", {
  id: varchar("id", { length: 255 }).primaryKey(), // chatId, e.g., "chat_1712345678901"
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// Message table (normalized, for flexibility)
export const messages = pgTable("messages", {
  id: varchar("id", { length: 255 }).primaryKey(),
  chatId: varchar("chat_id", { length: 255 }).notNull().references(() => chats.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" or "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// Pinned chats (mapping table)
export const pinnedChats = pgTable("pinned_chats", {
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  chatId: varchar("chat_id", { length: 255 }).notNull().references(() => chats.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.chatId] }),
}));

// Canvas table
export const canvases = pgTable("canvases", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  nodes: jsonb("nodes").notNull(), // array of node objects
  edges: jsonb("edges").notNull(), // array of edge objects
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// Canvas meta (for pinned, etc.)
export const canvasesMeta = pgTable("canvases_meta", {
  canvasId: varchar("canvas_id", { length: 255 }).notNull().references(() => canvases.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  pinned: boolean("pinned").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.canvasId] }),
})); 