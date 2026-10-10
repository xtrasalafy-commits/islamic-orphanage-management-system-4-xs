import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

/**
 * Neon HTTP driver: setiap query adalah HTTP request terpisah.
 * Cocok untuk Vercel serverless (tidak ada koneksi TCP persisten yang
 bisa terputus saat cold start).
 */
const sql = neon(databaseUrl);

export const db = drizzle(sql);
