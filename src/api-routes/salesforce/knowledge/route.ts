export const dynamic = "force-static";

import { NextRequest, NextResponse } from "next/server";
import { getKnowledgeArticles } from "@/lib/salesforce";

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("q") || undefined;
    const articles = await getKnowledgeArticles(search);
    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Failed to fetch knowledge articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
