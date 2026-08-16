import "server-only";
import { desc } from "drizzle-orm";
import { db } from "@/server/db/client";
import { contestRounds } from "@/server/db/schema";

export async function getAllRounds() {
  return db.select().from(contestRounds).orderBy(desc(contestRounds.createdAt));
}
