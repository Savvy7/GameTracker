import { games, users, friendships, type Game, type InsertGame, type User, type InsertUser, type Friendship, type InsertFriendship } from "@shared/schema";
import { safeDb } from "./db";
import { eq, ilike, and, or, inArray, desc, asc, sql, isNull } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";

// Create session stores
const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: Omit<InsertUser, "confirmPassword"> & { passwordHash: string }): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Friendship methods
  getFriendships(userId: number): Promise<Friendship[]>;
  getPendingFriendships(userId: number): Promise<Friendship[]>;
  createFriendship(friendship: InsertFriendship): Promise<Friendship>;
  updateFriendship(userId: number, friendId: number, status: string): Promise<Friendship | undefined>;
  deleteFriendship(userId: number, friendId: number): Promise<boolean>;
  
  // Game methods
  getGames(userId?: number): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, game: Partial<InsertGame>): Promise<Game | undefined>;
  deleteGame(id: number): Promise<boolean>;
  searchGames(query: string, userId?: number, filters?: GameFilters): Promise<Game[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export interface GameFilters {
  platforms?: string[];
  genres?: string[];
  tags?: string[];
  status?: string[];
  favorite?: boolean;
  ratings?: string[];
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

// In-memory storage implementation for fallback
export class MemStorage implements IStorage {
  private users: User[] = [];
  private games: Game[] = [];
  private friendships: Friendship[] = [];
  private nextUserId = 1;
  private nextGameId = 1;
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find((user) => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find((user) => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find((user) => user.email === email);
  }
  
  async getAllUsers(): Promise<User[]> {
    return this.users;
  }

  async createUser(insertUser: Omit<InsertUser, "confirmPassword"> & { passwordHash: string }): Promise<User> {
    const now = new Date();
    const user = { 
      ...insertUser, 
      id: this.nextUserId++,
      createdAt: now,
      lastActive: now,
    } as User;
    this.users.push(user);
    return user;
  }

  async updateUser(id: number, updateUser: Partial<User>): Promise<User | undefined> {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) return undefined;
    
    this.users[index] = { ...this.users[index], ...updateUser };
    return this.users[index];
  }

  async deleteUser(id: number): Promise<boolean> {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) return false;
    
    this.users.splice(index, 1);
    
    // Delete all games associated with user
    this.games = this.games.filter(game => game.userId !== id);
    
    // Delete all friendships associated with user
    this.friendships = this.friendships.filter(
      f => f.userId !== id && f.friendId !== id
    );
    
    return true;
  }

  // Friendship methods
  async getFriendships(userId: number): Promise<Friendship[]> {
    return this.friendships.filter(
      f => (f.userId === userId || f.friendId === userId) && f.status === "accepted"
    );
  }

  async getPendingFriendships(userId: number): Promise<Friendship[]> {
    return this.friendships.filter(
      f => (f.userId === userId || f.friendId === userId) && f.status === "pending"
    );
  }

  async createFriendship(friendship: InsertFriendship): Promise<Friendship> {
    const now = new Date();
    const newFriendship = {
      ...friendship,
      createdAt: now
    } as Friendship;
    
    this.friendships.push(newFriendship);
    return newFriendship;
  }

  async updateFriendship(userId: number, friendId: number, status: string): Promise<Friendship | undefined> {
    const index = this.friendships.findIndex(
      f => (f.userId === userId && f.friendId === friendId) || 
           (f.userId === friendId && f.friendId === userId)
    );
    
    if (index === -1) return undefined;
    
    this.friendships[index] = { ...this.friendships[index], status };
    return this.friendships[index];
  }

  async deleteFriendship(userId: number, friendId: number): Promise<boolean> {
    const index = this.friendships.findIndex(
      f => (f.userId === userId && f.friendId === friendId) || 
           (f.userId === friendId && f.friendId === userId)
    );
    
    if (index === -1) return false;
    
    this.friendships.splice(index, 1);
    return true;
  }

  // Game methods
  async getGames(userId?: number): Promise<Game[]> {
    if (userId) {
      return this.games.filter(game => game.userId === userId);
    }
    return this.games;
  }

  async getGame(id: number): Promise<Game | undefined> {
    return this.games.find((game) => game.id === id);
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const game = { ...insertGame, id: this.nextGameId++ } as Game;
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

  async searchGames(query: string, userId?: number, filters?: GameFilters): Promise<Game[]> {
    const lowercaseQuery = query.toLowerCase();
    let filteredGames = this.games.filter((game) => 
      game.title.toLowerCase().includes(lowercaseQuery)
    );
    
    if (userId) {
      filteredGames = filteredGames.filter(game => game.userId === userId);
    }
    
    if (filters) {
      // Apply filters
      if (filters.platforms && filters.platforms.length > 0) {
        filteredGames = filteredGames.filter(game => 
          game.platforms?.some(platform => filters.platforms?.includes(platform))
        );
      }
      
      if (filters.genres && filters.genres.length > 0) {
        filteredGames = filteredGames.filter(game => 
          game.genres?.some(genre => filters.genres?.includes(genre))
        );
      }
      
      if (filters.tags && filters.tags.length > 0) {
        filteredGames = filteredGames.filter(game => 
          game.tags?.some(tag => filters.tags?.includes(tag))
        );
      }
      
      if (filters.status && filters.status.length > 0) {
        filteredGames = filteredGames.filter(game => 
          filters.status?.includes(game.playStatus || "")
        );
      }
      
      if (filters.favorite) {
        filteredGames = filteredGames.filter(game => game.favorite === true);
      }
      
      if (filters.ratings && filters.ratings.length > 0) {
        filteredGames = filteredGames.filter(game => {
          const rating = game.personalRating || 0;
          return filters.ratings?.some(range => {
            if (range === "unrated") return rating === 0;
            if (range === "1-3") return rating >= 1 && rating <= 3;
            if (range === "4-6") return rating >= 4 && rating <= 6;
            if (range === "7-10") return rating >= 7 && rating <= 10;
            return false;
          });
        });
      }
      
      // Sort games
      if (filters.sortBy) {
        const direction = filters.sortDirection === "desc" ? -1 : 1;
        
        filteredGames.sort((a, b) => {
          const field = filters.sortBy as keyof Game;
          const valueA = a[field];
          const valueB = b[field];
          
          if (valueA === undefined && valueB === undefined) return 0;
          if (valueA === undefined) return direction;
          if (valueB === undefined) return -direction;
          
          if (typeof valueA === "string" && typeof valueB === "string") {
            return direction * valueA.localeCompare(valueB);
          }
          
          if (typeof valueA === "number" && typeof valueB === "number") {
            return direction * (valueA - valueB);
          }
          
          if (valueA instanceof Date && valueB instanceof Date) {
            return direction * (valueA.getTime() - valueB.getTime());
          }
          
          return 0;
        });
      }
    }
    
    return filteredGames;
  }
}

// Database storage with fallback to memory storage if database connection fails
export class DatabaseStorage implements IStorage {
  private memStorage = new MemStorage();
  private useMemStorage = false;
  sessionStore: session.SessionStore;

  constructor() {
    // Test database connection on init
    this.testConnection();
    
    // Initialize session store
    try {
      if (safeDb && !this.useMemStorage) {
        this.sessionStore = new PostgresSessionStore({
          pool: safeDb.$client || undefined,
          createTableIfMissing: true
        });
      } else {
        this.sessionStore = new MemoryStore({
          checkPeriod: 86400000 // 24 hours
        });
      }
    } catch (error) {
      console.error("Error initializing PostgreSQL session store, using memory store:", error);
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000 // 24 hours
      });
    }
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

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      if (this.useMemStorage || !safeDb) return this.memStorage.getUser(id);
      const [user] = await safeDb.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Database error in getUser, using fallback:", error);
      this.useMemStorage = true;
      return this.memStorage.getUser(id);
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      if (this.useMemStorage || !safeDb) return this.memStorage.getUserByUsername(username);
      const [user] = await safeDb.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Database error in getUserByUsername, using fallback:", error);
      this.useMemStorage = true;
      return this.memStorage.getUserByUsername(username);
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      if (this.useMemStorage || !safeDb) return this.memStorage.getUserByEmail(email);
      const [user] = await safeDb.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error("Database error in getUserByEmail, using fallback:", error);
      this.useMemStorage = true;
      return this.memStorage.getUserByEmail(email);
    }
  }
  
  async getAllUsers(): Promise<User[]> {
    try {
      if (this.useMemStorage || !safeDb) return this.memStorage.getAllUsers();
      return await safeDb.select().from(users);
    } catch (error) {
      console.error("Database error in getAllUsers, using fallback:", error);
      this.useMemStorage = true;
      return this.memStorage.getAllUsers();
    }
  }

  async createUser(insertUser: Omit<InsertUser, "confirmPassword"> & { passwordHash: string }): Promise<User> {
    try {
      if (this.useMemStorage || !safeDb) return this.memStorage.createUser(insertUser);
      const [user] = await safeDb.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error("Database error in createUser, using fallback:", error);
      this.useMemStorage = true;
      return this.memStorage.createUser(insertUser);
    }
  }

  async updateUser(id: number, updateUser: Partial<User>): Promise<User | undefined> {
    try {
      if (this.useMemStorage || !safeDb) return this.memStorage.updateUser(id, updateUser);
      const [user] = await safeDb
        .update(users)
        .set(updateUser)
        .where(eq(users.id, id))
        .returning();
      return user;
    } catch (error) {
      console.error("Database error in updateUser, using fallback:", error);
      this.useMemStorage = true;
      return this.memStorage.updateUser(id, updateUser);
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      if (this.useMemStorage || !safeDb) return this.memStorage.deleteUser(id);
      const [deleted] = await safeDb
        .delete(users)
        .where(eq(users.id, id))
        .returning();
      return !!deleted;
    } catch (error) {
      console.error("Database error in deleteUser, using fallback:", error);
      this.useMemStorage = true;
      return this.memStorage.deleteUser(id);
    }
  }

  // Friendship methods
  async getFriendships(userId: number): Promise<Friendship[]> {
    try {
      if (this.useMemStorage || !safeDb) return this.memStorage.getFriendships(userId);
      return await safeDb
        .select()
        .from(friendships)
        .where(
          and(
            or(
              eq(friendships.userId, userId),
              eq(friendships.friendId, userId)
            ),
            eq(friendships.status, "accepted")
          )
        );
    } catch (error) {
      console.error("Database error in getFriendships, using fallback:", error);
      this.useMemStorage = true;
      return this.memStorage.getFriendships(userId);
    }
  }

  async getPendingFriendships(userId: number): Promise<Friendship[]> {
    try {
      if (this.useMemStorage || !safeDb) return this.memStorage.getPendingFriendships(userId);
      return await safeDb
        .select()
        .from(friendships)
        .where(
          and(
            or(
              eq(friendships.userId, userId),
              eq(friendships.friendId, userId)
            ),
            eq(friendships.status, "pending")
          )
        );
    } catch (error) {
      console.error("Database error in getPendingFriendships, using fallback:", error);
      this.useMemStorage = true;
      return this.memStorage.getPendingFriendships(userId);
    }
  }

  async createFriendship(friendship: InsertFriendship): Promise<Friendship> {
    try {
      if (this.useMemStorage || !safeDb) return this.memStorage.createFriendship(friendship);
      const [result] = await safeDb
        .insert(friendships)
        .values(friendship)
        .returning();
      return result;
    } catch (error) {
      console.error("Database error in createFriendship, using fallback:", error);
      this.useMemStorage = true;
      return this.memStorage.createFriendship(friendship);
    }
  }

  async updateFriendship(userId: number, friendId: number, status: string): Promise<Friendship | undefined> {
    try {
      if (this.useMemStorage || !safeDb) return this.memStorage.updateFriendship(userId, friendId, status);
      const [result] = await safeDb
        .update(friendships)
        .set({ status })
        .where(
          or(
            and(
              eq(friendships.userId, userId),
              eq(friendships.friendId, friendId)
            ),
            and(
              eq(friendships.userId, friendId),
              eq(friendships.friendId, userId)
            )
          )
        )
        .returning();
      return result;
    } catch (error) {
      console.error("Database error in updateFriendship, using fallback:", error);
      this.useMemStorage = true;
      return this.memStorage.updateFriendship(userId, friendId, status);
    }
  }

  async deleteFriendship(userId: number, friendId: number): Promise<boolean> {
    try {
      if (this.useMemStorage || !safeDb) return this.memStorage.deleteFriendship(userId, friendId);
      const [result] = await safeDb
        .delete(friendships)
        .where(
          or(
            and(
              eq(friendships.userId, userId),
              eq(friendships.friendId, friendId)
            ),
            and(
              eq(friendships.userId, friendId),
              eq(friendships.friendId, userId)
            )
          )
        )
        .returning();
      return !!result;
    } catch (error) {
      console.error("Database error in deleteFriendship, using fallback:", error);
      this.useMemStorage = true;
      return this.memStorage.deleteFriendship(userId, friendId);
    }
  }

  // Game methods
  async getGames(userId?: number): Promise<Game[]> {
    try {
      if (this.useMemStorage || !safeDb) return this.memStorage.getGames(userId);
      if (userId) {
        return await safeDb
          .select()
          .from(games)
          .where(eq(games.userId, userId));
      }
      return await safeDb.select().from(games);
    } catch (error) {
      console.error("Database error in getGames, using fallback:", error);
      this.useMemStorage = true;
      return this.memStorage.getGames(userId);
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

  async searchGames(query: string, userId?: number, filters?: GameFilters): Promise<Game[]> {
    try {
      if (this.useMemStorage || !safeDb) return this.memStorage.searchGames(query, userId, filters);
      
      const lowercaseQuery = `%${query.toLowerCase()}%`;
      
      // Start building the query
      let baseQuery = safeDb
        .select()
        .from(games)
        .where(ilike(games.title, lowercaseQuery));
      
      // Add user filter if provided
      if (userId) {
        baseQuery = baseQuery.where(eq(games.userId, userId));
      }
      
      // Apply additional filters if provided
      if (filters) {
        // Platforms filter
        if (filters.platforms && filters.platforms.length > 0) {
          baseQuery = baseQuery.where(
            sql`${games.platforms} && ${JSON.stringify(filters.platforms)}`
          );
        }
        
        // Genres filter
        if (filters.genres && filters.genres.length > 0) {
          baseQuery = baseQuery.where(
            sql`${games.genres} && ${JSON.stringify(filters.genres)}`
          );
        }
        
        // Tags filter
        if (filters.tags && filters.tags.length > 0) {
          baseQuery = baseQuery.where(
            sql`${games.tags} && ${JSON.stringify(filters.tags)}`
          );
        }
        
        // Status filter
        if (filters.status && filters.status.length > 0) {
          baseQuery = baseQuery.where(
            inArray(games.playStatus, filters.status)
          );
        }
        
        // Favorite filter
        if (filters.favorite) {
          baseQuery = baseQuery.where(eq(games.favorite, true));
        }
        
        // Rating filters
        if (filters.ratings && filters.ratings.length > 0) {
          const conditions = [];
          
          if (filters.ratings.includes("unrated")) {
            conditions.push(or(
              isNull(games.personalRating),
              eq(games.personalRating, 0)
            ));
          }
          
          if (filters.ratings.includes("1-3")) {
            conditions.push(and(
              sql`${games.personalRating} >= 1`,
              sql`${games.personalRating} <= 3`
            ));
          }
          
          if (filters.ratings.includes("4-6")) {
            conditions.push(and(
              sql`${games.personalRating} >= 4`,
              sql`${games.personalRating} <= 6`
            ));
          }
          
          if (filters.ratings.includes("7-10")) {
            conditions.push(and(
              sql`${games.personalRating} >= 7`,
              sql`${games.personalRating} <= 10`
            ));
          }
          
          if (conditions.length > 0) {
            baseQuery = baseQuery.where(or(...conditions));
          }
        }
        
        // Sort
        if (filters.sortBy) {
          const column = games[filters.sortBy as keyof typeof games] as any;
          if (column) {
            if (filters.sortDirection === "desc") {
              baseQuery = baseQuery.orderBy(desc(column));
            } else {
              baseQuery = baseQuery.orderBy(asc(column));
            }
          }
        }
      }
      
      return await baseQuery;
    } catch (error) {
      console.error("Database error in searchGames, using fallback:", error);
      this.useMemStorage = true;
      return this.memStorage.searchGames(query, userId, filters);
    }
  }
}

export const storage = new DatabaseStorage();