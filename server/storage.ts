import { games, type Game, type InsertGame } from "@shared/schema";

export interface IStorage {
  getGames(): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  searchGames(query: string): Promise<Game[]>;
}

export class MemStorage implements IStorage {
  private games: Map<number, Game>;
  private currentId: number;

  constructor() {
    this.games = new Map();
    this.currentId = 1;
  }

  async getGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }

  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.currentId++;
    const game: Game = { id, ...insertGame };
    this.games.set(id, game);
    return game;
  }

  async searchGames(query: string): Promise<Game[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.games.values()).filter(game => 
      game.title.toLowerCase().includes(lowercaseQuery) ||
      game.genres?.some(genre => genre.toLowerCase().includes(lowercaseQuery)) ||
      game.platforms?.some(platform => platform.toLowerCase().includes(lowercaseQuery))
    );
  }
}

export const storage = new MemStorage();
