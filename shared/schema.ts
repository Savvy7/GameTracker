import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  // New fields
  playStatus: text("play_status").default("not_started"),
  personalRating: integer("personal_rating"),
  review: text("review"),
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
});

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;