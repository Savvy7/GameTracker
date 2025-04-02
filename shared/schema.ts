import { pgTable, text, serial, integer, jsonb, timestamp, boolean, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
  lastActive: timestamp("last_active").defaultNow(),
});

// Friends relationship table
export const friendships = pgTable("friendships", {
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  friendId: integer("friend_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.friendId] }),
  }
});

// Games table
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  igdbId: integer("igdb_id"),
  cover: text("cover"),
  releaseDate: text("release_date"),
  platforms: text("platforms").array(),
  genres: text("genres").array(),
  rating: integer("rating"),
  summary: text("summary"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  // Play status tracking
  playStatus: text("play_status").default("not_started"),
  personalRating: integer("personal_rating"),
  review: text("review"),
  favorite: boolean("favorite").default(false),
  lastPlayed: timestamp("last_played"),
  totalPlayTime: integer("total_play_time"), // in minutes
  // Additional metadata
  developer: text("developer"),
  publisher: text("publisher"),
  installSize: text("install_size"),
  timeToComplete: text("time_to_complete"),
  tags: text("tags").array(),
  // User relationship
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  games: many(games),
  friendsInitiated: many(friendships, { relationName: "user_friends" }),
  friendsReceived: many(friendships, { relationName: "friend_users" }),
}));

export const gamesRelations = relations(games, ({ one }) => ({
  user: one(users, {
    fields: [games.userId],
    references: [users.id],
  }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  user: one(users, {
    fields: [friendships.userId],
    references: [users.id],
    relationName: "user_friends",
  }),
  friend: one(users, {
    fields: [friendships.friendId],
    references: [users.id],
    relationName: "friend_users",
  }),
}));

// Create zod schemas for insertion
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastActive: true,
  passwordHash: true,
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const insertGameSchema = createInsertSchema(games).omit({ 
  id: true,
  lastPlayed: true,
  totalPlayTime: true,
  favorite: true,
  userId: true,
}).extend({
  title: z.string().min(1, "Title is required"),
  platforms: z.array(z.string()).optional().default([]),
  genres: z.array(z.string()).optional().default([]),
  playStatus: z.enum(["not_started", "in_progress", "completed", "abandoned"]).optional().default("not_started"),
  personalRating: z.number().min(0).max(10).optional(),
  review: z.string().optional(),
  developer: z.string().optional(),
  publisher: z.string().optional(),
  installSize: z.string().optional(),
  timeToComplete: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  createdAt: true,
});

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;

export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendships.$inferSelect;

// Enums for filters
export const PlayStatusEnum = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  ABANDONED: "abandoned"
} as const;

export type PlayStatus = (typeof PlayStatusEnum)[keyof typeof PlayStatusEnum];