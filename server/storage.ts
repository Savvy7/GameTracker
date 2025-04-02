import { games, type Game, type InsertGame } from "@shared/schema";
import { safeDb } from "./db";
import { eq, ilike } from "drizzle-orm";

export interface IStorage {
  getGames(): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, game: Partial<InsertGame>): Promise<Game | undefined>;
  deleteGame(id: number): Promise<boolean>;
  searchGames(query: string): Promise<Game[]>;
}

// In-memory storage implementation for fallback
export class MemStorage implements IStorage {
  private games: Game[] = [];
  private nextId = 1;

  async getGames(): Promise<Game[]> {
    return this.games;
  }

  async getGame(id: number): Promise<Game | undefined> {
    return this.games.find((game) => game.id === id);
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const game = { ...insertGame, id: this.nextId++ } as Game;
    this.games.push(game);
    return game;
  }

  async updateGame(id: number, updateGame: Partial<InsertGame>): Promise<Game | undefined> {
    const index = this.games.findIndex((game) => game.id === id);
    if (index === -1) return undefined;
    
    this.games[index] = { ...this.games[index], ...updateGame };
    return this.games[index];
  }

  async deleteGame(id: number): Promise<boolean> {
    const index = this.games.findIndex((game) => game.id === id);
    if (index === -1) return false;
    
    this.games.splice(index, 1);
    return true;
  }

  async searchGames(query: string): Promise<Game[]> {
    const lowercaseQuery = query.toLowerCase();
    return this.games.filter((game) => 
      game.title.toLowerCase().includes(lowercaseQuery)
    );
  }
}

// Database storage with fallback to memory storage if database connection fails
export class DatabaseStorage implements IStorage {
  private memStorage = new MemStorage();
  private useMemStorage = false;

  constructor() {
    // Test database connection on init
    this.testConnection();
  }

  private async testConnection() {
    try {
      if (!safeDb) {
        throw new Error("Database not initialized");
      }
      await safeDb.select().from(games).limit(1);
      console.log("Database connection successful, using database storage");
      this.useMemStorage = false;
    } catch (error) {
      console.error("Database connection failed, using in-memory storage fallback:", error);
      this.useMemStorage = true;
    }
  }

  async getGames(): Promise<Game[]> {
    try {
      if (this.useMemStorage || !safeDb) return this.memStorage.getGames();
      return await safeDb.select().from(games);
    } catch (error) {
      console.error("Database error in getGames, using fallback:", error);
      this.useMemStorage = true;
      return this.memStorage.getGames();
    }
  }

  async getGame(id: number): Promise<Game | undefined> {
    try {
      if (this.useMemStorage || !safeDb) return this.memStorage.getGame(id);
      const [game] = await safeDb.select().from(games).where(eq(games.id, id));
      return game;
    } catch (error) {
      console.error("Database error in getGame, using fallback:", error);
      this.useMemStorage = true;
      return this.memStorage.getGame(id);
    }
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    try {
      if (this.useMemStorage || !safeDb) return this.memStorage.createGame(insertGame);
      const [game] = await safeDb.insert(games).values(insertGame).returning();
      return game;
    } catch (error) {
      console.error("Database error in createGame, using fallback:", error);
      this.useMemStorage = true;
      return this.memStorage.createGame(insertGame);
    }
  }

  async updateGame(id: number, updateGame: Partial<InsertGame>): Promise<Game | undefined> {
    try {
      if (this.useMemStorage || !safeDb) return this.memStorage.updateGame(id, updateGame);
      const [game] = await safeDb
        .update(games)
        .set(updateGame)
        .where(eq(games.id, id))
        .returning();
      return game;
    } catch (error) {
      console.error("Database error in updateGame, using fallback:", error);
      this.useMemStorage = true;
      return this.memStorage.updateGame(id, updateGame);
    }
  }

  async deleteGame(id: number): Promise<boolean> {
    try {
      if (this.useMemStorage || !safeDb) return this.memStorage.deleteGame(id);
      const [deleted] = await safeDb
        .delete(games)
        .where(eq(games.id, id))
        .returning();
      return !!deleted;
    } catch (error) {
      console.error("Database error in deleteGame, using fallback:", error);
      this.useMemStorage = true;
      return this.memStorage.deleteGame(id);
    }
  }

  async searchGames(query: string): Promise<Game[]> {
    try {
      if (this.useMemStorage || !safeDb) return this.memStorage.searchGames(query);
      const lowercaseQuery = `%${query.toLowerCase()}%`;
      return await safeDb
        .select()
        .from(games)
        .where(
          ilike(games.title, lowercaseQuery)
        );
    } catch (error) {
      console.error("Database error in searchGames, using fallback:", error);
      this.useMemStorage = true;
      return this.memStorage.searchGames(query);
    }
  }
}

export const storage = new DatabaseStorage();