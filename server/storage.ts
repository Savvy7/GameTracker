import { games, type Game, type InsertGame } from "@shared/schema";
import { db } from "./db";
import { eq, ilike } from "drizzle-orm";

export interface IStorage {
  getGames(): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, game: Partial<InsertGame>): Promise<Game | undefined>;
  deleteGame(id: number): Promise<boolean>;
  searchGames(query: string): Promise<Game[]>;
}

export class DatabaseStorage implements IStorage {
  async getGames(): Promise<Game[]> {
    return await db.select().from(games);
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db.insert(games).values(insertGame).returning();
    return game;
  }

  async updateGame(id: number, updateGame: Partial<InsertGame>): Promise<Game | undefined> {
    const [game] = await db
      .update(games)
      .set(updateGame)
      .where(eq(games.id, id))
      .returning();
    return game;
  }

  async deleteGame(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(games)
      .where(eq(games.id, id))
      .returning();
    return !!deleted;
  }

  async searchGames(query: string): Promise<Game[]> {
    const lowercaseQuery = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(games)
      .where(
        ilike(games.title, lowercaseQuery)
      );
  }
}

export const storage = new DatabaseStorage();