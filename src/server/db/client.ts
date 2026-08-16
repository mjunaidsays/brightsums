import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Driver switch: local dev + drizzle-kit migrations use the standard TCP
 * `node-postgres` driver against a Neon dev branch's pooled connection
 * string (DATABASE_URL). Deploys to Cloudflare Workers (which cannot open
 * raw TCP sockets) use Neon's HTTP driver instead — set DB_DRIVER=neon-http
 * in that environment. Same Drizzle schema either way.
 *
 * See CLAUDE.md §6 and the plan's "open technical risks" §2: Neon's HTTP
 * driver's transaction support must be spiked before the quiz engine's
 * atomic 10-row session-question insert is finalized.
 */
function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — see .env.local.example");
  }

  if (process.env.DB_DRIVER === "neon-http") {
    const sql = neon(connectionString);
    return drizzleNeonHttp({ client: sql, schema });
  }

  // Neon's pooled connection string already fronts this with PgBouncer, so
  // our own pool here just needs to cap concurrent local connections
  // sensibly (Neon free tier's own connection ceiling is shared across
  // everything hitting the branch) — not act as the primary pooler itself.
  const pool = new Pool({
    connectionString,
    max: Number(process.env.DB_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  // CRITICAL for stability under load: pg's Pool emits 'error' on an idle
  // client that hits a backend-initiated disconnect (network blip, Neon
  // scaling event, etc). If nothing listens for it, Node treats it as an
  // uncaught exception and crashes the ENTIRE process — taking down every
  // in-flight request, not just the one connection. Log and let the pool
  // recover (it replaces the dead client on next checkout) instead.
  pool.on("error", (err) => {
    console.error("[db] Unexpected error on idle Postgres client:", err);
  });

  return drizzleNodePostgres({ client: pool, schema });
}

export const db = createDb();
