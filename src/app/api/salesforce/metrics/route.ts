import { NextRequest, NextResponse } from "next/server";
import { getSupportMetrics } from "@/lib/salesforce";

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email") || undefined;
    const metrics = await getSupportMetrics(email);
    return NextResponse.json({ metrics });
  } catch (error) {
    console.error("Failed to fetch metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
