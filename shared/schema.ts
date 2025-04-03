import { mysqlTable, text, int, json } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const games = mysqlTable("games", {
  id: int("id").primaryKey().autoincrement(),
  title: text("title").notNull(),
  igdbId: int("igdb_id"),
  cover: text("cover"),
  releaseDate: text("release_date"),
  platforms: json("platforms").$type<string[]>(),
  genres: json("genres").$type<string[]>(),
  rating: int("rating"),
  summary: text("summary"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  // New fields
  playStatus: text("play_status").default("not_started"),
  personalRating: int("personal_rating"),
  review: text("review"),
  // Additional metadata
  developer: text("developer"),
  publisher: text("publisher"),
  installSize: text("install_size"),
  timeToComplete: text("time_to_complete"),
  tags: json("tags").$type<string[]>(),
});

export const insertGameSchema = createInsertSchema(games).omit({ 
  id: true 
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

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;