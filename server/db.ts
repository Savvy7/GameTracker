import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

let pool;
let db;

try {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is not set. Using in-memory storage.");
  } else if (process.env.DATABASE_URL.includes("ep-endpoint-disabled")) {
    console.warn("Database endpoint is disabled. Using in-memory storage.");
  } else {
    // Log connection attempt to diagnose issues
    console.log("Attempting to connect to database...");

    // Create the connection pool
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      max: 5, // Reduced pool size to avoid connection issues
      idleTimeoutMillis: 30000 // Increased timeout
    });

    // Initialize db
    db = drizzle({ client: pool, schema });
  }
} catch (error) {
  console.error("Failed to initialize database:", error);
}

// Export with fallback to prevent app from crashing if db unavailable
export const safePool = pool;
export const safeDb = db;