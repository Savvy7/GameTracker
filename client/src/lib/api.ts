import { apiRequest } from "./queryClient";
import type { Game, InsertGame } from "@shared/schema";

export async function searchIGDB(query: string): Promise<any[]> {
  const res = await apiRequest("GET", `/api/igdb/search?q=${encodeURIComponent(query)}`);
  return res.json();
}

export async function createGame(game: InsertGame): Promise<Game> {
  const res = await apiRequest("POST", "/api/games", game);
  return res.json();
}

export async function searchGames(query: string): Promise<Game[]> {
  const res = await apiRequest("GET", `/api/games/search?q=${encodeURIComponent(query)}`);
  return res.json();
}
