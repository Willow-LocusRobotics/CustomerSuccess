import { NextRequest, NextResponse } from "next/server";
import { getCases, createCase, type CreateCasePayload } from "@/lib/salesforce";

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email") || undefined;
    const cases = await getCases(email);
    return NextResponse.json({ cases });
  } catch (error) {
    console.error("Failed to fetch cases:", error);
    return NextResponse.json(
      { error: "Failed to fetch cases" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCasePayload = await request.json();
    if (!body.Subject || !body.Description || !body.Priority) {
      return NextResponse.json(
        { error: "Subject, Description, and Priority are required" },
        { status: 400 }
      );
    }
    const result = await createCase(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create case:", error);
    return NextResponse.json(
      { error: "Failed to create case" },
      { status: 500 }
    );
  }
}
