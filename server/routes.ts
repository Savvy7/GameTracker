import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameSchema } from "@shared/schema";
import { searchIGDBGames } from "./igdb";
import { setupAuth } from "./auth";
import { setupFriendshipRoutes } from "./friendship-routes";

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Set up friendship routes
  setupFriendshipRoutes(app);

  // IGDB API endpoints
  app.get("/api/igdb/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const games = await searchIGDBGames(query);
      res.json(games);
    } catch (error) {
      console.error("IGDB search failed:", error);
      res.status(500).json({ message: "Failed to search IGDB" });
    }
  });

  // Games CRUD endpoints
  app.get("/api/games", async (req, res) => {
    try {
      // If user is authenticated, get only their games
      // Otherwise, get all games (this will change in production)
      const userId = req.isAuthenticated() ? req.user!.id : undefined;
      const games = await storage.getGames(userId);
      res.json(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  app.get("/api/games/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      // Get userId if authenticated
      const userId = req.isAuthenticated() ? req.user!.id : undefined;
      
      // Parse filters if provided
      let filters = undefined;
      if (req.query.filters) {
        try {
          filters = JSON.parse(req.query.filters as string);
        } catch (e) {
          console.error("Invalid filters format:", e);
        }
      }
      
      const games = await storage.searchGames(query, userId, filters);
      res.json(games);
    } catch (error) {
      console.error("Error searching games:", error);
      res.status(500).json({ message: "Failed to search games" });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const game = await storage.getGame(id);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Check if the user has access to this game (if authenticated)
      if (req.isAuthenticated() && game.userId && game.userId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have permission to view this game" });
      }
      
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  app.post("/api/games", ensureAuthenticated, async (req, res) => {
    try {
      const parsed = insertGameSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid game data",
          errors: parsed.error.errors
        });
      }

      // Assign the game to the current user
      const gameData = {
        ...parsed.data,
        userId: req.user!.id
      };

      const game = await storage.createGame(gameData);
      res.status(201).json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  app.patch("/api/games/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // First check if the game exists and belongs to the user
      const existingGame = await storage.getGame(id);
      if (!existingGame) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      if (existingGame.userId && existingGame.userId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have permission to update this game" });
      }
      
      const game = await storage.updateGame(id, req.body);
      res.json(game);
    } catch (error) {
      console.error("Error updating game:", error);
      res.status(500).json({ message: "Failed to update game" });
    }
  });

  app.delete("/api/games/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // First check if the game exists and belongs to the user
      const existingGame = await storage.getGame(id);
      if (!existingGame) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      if (existingGame.userId && existingGame.userId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have permission to delete this game" });
      }
      
      const deleted = await storage.deleteGame(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting game:", error);
      res.status(500).json({ message: "Failed to delete game" });
    }
  });
  
  // Friend's library routes
  app.get("/api/friends/:friendId/games", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const friendId = parseInt(req.params.friendId);
      
      // Check if they are actually friends
      const friendships = await storage.getFriendships(userId);
      const isFriend = friendships.some(f => 
        (f.userId === userId && f.friendId === friendId) || 
        (f.userId === friendId && f.friendId === userId)
      );
      
      if (!isFriend) {
        return res.status(403).json({ message: "You need to be friends to view their library" });
      }
      
      // Get friend's games
      const games = await storage.getGames(friendId);
      res.json(games);
    } catch (error) {
      console.error("Error fetching friend's games:", error);
      res.status(500).json({ message: "Failed to fetch friend's games" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}