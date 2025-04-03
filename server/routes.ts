import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameSchema } from "@shared/schema";
import { searchIGDBGames } from "./igdb";

export async function registerRoutes(app: Express): Promise<Server> {
  // IGDB API endpoints
  app.get("/api/igdb/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }

      // Check if IGDB credentials are configured
      if (!process.env.IGDB_CLIENT_ID || !process.env.IGDB_CLIENT_SECRET) {
        console.warn("IGDB credentials not configured, using mock data");
        // Return mock data for testing
        return res.json([
          {
            igdbId: 1,
            title: "Mock Game 1",
            cover: null,
            releaseDate: "2023-01-01",
            platforms: ["PC", "PlayStation 5"],
            genres: ["Action", "Adventure"],
            rating: 85,
            summary: "This is a mock game for testing",
            developer: "Mock Developer",
            publisher: "Mock Publisher",
            tags: ["Single Player"],
          },
          {
            igdbId: 2,
            title: "Mock Game 2",
            cover: null,
            releaseDate: "2023-02-01",
            platforms: ["Xbox Series X", "PC"],
            genres: ["RPG"],
            rating: 90,
            summary: "Another mock game for testing",
            developer: "Mock Developer 2",
            publisher: "Mock Publisher 2",
            tags: ["Multiplayer"],
          }
        ]);
      }

      const games = await searchIGDBGames(query);
      res.json(games);
    } catch (error) {
      console.error("IGDB search failed:", error);
      res.status(500).json({ message: "Failed to search IGDB" });
    }
  });

  // Games CRUD endpoints
  app.get("/api/games", async (_req, res) => {
    try {
      const games = await storage.getGames();
      res.json(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const game = await storage.getGame(id);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  app.get("/api/games/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const games = await storage.searchGames(query);
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to search games" });
    }
  });

  app.post("/api/games", async (req, res) => {
    try {
      const parsed = insertGameSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid game data" });
      }

      const game = await storage.createGame(parsed.data);
      res.status(201).json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  app.patch("/api/games/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const game = await storage.updateGame(id, req.body);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to update game" });
    }
  });

  app.delete("/api/games/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGame(id);
      if (!deleted) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete game" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}