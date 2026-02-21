import { NextRequest, NextResponse } from "next/server";
import { getRepoMetrics } from "@/lib/github";

export async function GET(request: NextRequest) {
  const repo = request.nextUrl.searchParams.get("repo") || "vercel/next.js";
  const [owner, name] = repo.split("/");

  if (!owner || !name) {
    return NextResponse.json({ error: "Use format owner/repo" }, { status: 400 });
  }

  try {
    const data = await getRepoMetrics(owner, name);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
