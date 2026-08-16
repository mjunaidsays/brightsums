import { NextResponse } from "next/server";
import { searchSchools } from "@/server/db/queries/schools.queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const results = await searchSchools(q);
  return NextResponse.json({ results });
}
