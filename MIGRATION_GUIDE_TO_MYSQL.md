# Migration Guide: PostgreSQL to MySQL

This guide outlines the steps needed to convert the GameTracker application from PostgreSQL to MySQL.

## 1. Install MySQL Dependencies

```bash
npm install mysql2
npm uninstall @neondatabase/serverless ws
```

## 2. Modify Database Configuration Files

### Update `drizzle.config.ts`
```typescript
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
```

### Update `server/db.ts`
```typescript
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
```

## 3. Update Database Schema

### Modify `shared/schema.ts`

```typescript
import { mysqlTable, text, int, json } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const games = mysqlTable("games", {
  id: int("id").primaryKey().autoincrement(),
  title: text("title").notNull(),
  igdbId: int("igdb_id"),
  cover: text("cover"),
  releaseDate: text("release_date"),
  platforms: json("platforms").$type<string[]>(),
  genres: json("genres").$type<string[]>(),
  rating: int("rating"),
  summary: text("summary"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  // New fields
  playStatus: text("play_status").default("not_started"),
  personalRating: int("personal_rating"),
  review: text("review"),
  // Additional metadata
  developer: text("developer"),
  publisher: text("publisher"),
  installSize: text("install_size"),
  timeToComplete: text("time_to_complete"),
  tags: json("tags").$type<string[]>(),
});

// Keep the rest of the schema file as is
```

## 4. Update Environment Variables

Set up MySQL connection string in the `.env` file:

```
DATABASE_URL=mysql://username:password@localhost:3306/gametracker
```

## 5. Install and Set Up MySQL

1. Download and install MySQL from https://dev.mysql.com/downloads/
2. Create a new database:
```sql
CREATE DATABASE gametracker;
```
3. Create a user with appropriate permissions:
```sql
CREATE USER 'gametracker'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON gametracker.* TO 'gametracker'@'localhost';
FLUSH PRIVILEGES;
```

## 6. Generate and Apply Database Migrations

After installing MySQL and setting up your environment:

```bash
npm run db:push
```

## 7. Update Any Session Store Configuration

If your app uses express-session with PostgreSQL, update that configuration:

```typescript
// Replace connect-pg-simple with express-mysql-session
import MySQLStore from 'express-mysql-session';

const sessionStore = new MySQLStore({
  // MySQL session store options
}, pool);

app.use(session({
  store: sessionStore,
  // other session options
}));
```

## 8. Testing

Test all database operations to ensure they work correctly with MySQL:

- Creating records
- Reading records
- Updating records
- Deleting records
- More complex queries

## Notes on MySQL vs PostgreSQL Differences

- **Array Types**: PostgreSQL has native support for arrays, while MySQL does not. We've converted array fields to JSON.
- **JSONB vs JSON**: PostgreSQL's JSONB type is replaced with MySQL's JSON type.
- **Case Sensitivity**: MySQL can be case-sensitive depending on your configuration. Check your table and column names.
- **Transactions**: Ensure any transaction logic continues to work as expected. 