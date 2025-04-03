import * as mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

let pool;
let db;

try {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is not set. Database functionality will be unavailable.");
  } else {
    // Log connection attempt to diagnose issues
    console.log("Attempting to connect to database...");

    // Create the connection pool
    pool = mysql.createPool(process.env.DATABASE_URL);

    // Initialize db
    db = drizzle(pool);
  }
} catch (error) {
  console.error("Failed to initialize database:", error);
}

// Export with fallback to prevent app from crashing if db unavailable
export const safePool = pool;
export const safeDb = db;
