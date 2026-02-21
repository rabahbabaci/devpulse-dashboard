import { NextRequest, NextResponse } from "next/server";
import { getRepoMetrics } from "@/lib/github";

function normalizeRepoInput(raw: string): { owner: string; repo: string } | null {
  const input = raw.trim();
  if (!input) return null;

  let candidate = input;

  // If input contains a full GitHub URL anywhere, prefer that segment.
  // Handles malformed strings like: owner/https://github.com/owner/repo
  const embeddedUrl = candidate.match(/github\.com\/([^\s]+)/i);
  if (embeddedUrl?.[1]) {
    candidate = embeddedUrl[1];
  }

  // Also support direct URL input: https://github.com/owner/repo
  const urlLike = candidate.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/(.+)$/i);
  if (urlLike?.[1]) {
    candidate = urlLike[1];
  }

  candidate = candidate
    .replace(/\.git$/i, "")
    .replace(/[?#].*$/, "")
    .replace(/^\/+|\/+$/g, "");

  const parts = candidate.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const owner = parts[0];
  const repo = parts[1];

  if (!owner || !repo) return null;
  return { owner, repo };
}

export async function GET(request: NextRequest) {
  const repoParam = request.nextUrl.searchParams.get("repo") || "vercel/next.js";
  const parsed = normalizeRepoInput(repoParam);

  if (!parsed) {
    return NextResponse.json(
      { error: "Use owner/repo or a full GitHub repo URL" },
      { status: 400 }
    );
  }

  try {
    const data = await getRepoMetrics(parsed.owner, parsed.repo);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
