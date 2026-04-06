import { NextRequest, NextResponse } from "next/server";
import { getCaseById, addCaseComment } from "@/lib/salesforce";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sfCase = await getCaseById(id);
    if (!sfCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }
    return NextResponse.json({ case: sfCase });
  } catch (error) {
    console.error("Failed to fetch case:", error);
    return NextResponse.json(
      { error: "Failed to fetch case" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { comment } = await request.json();
    if (!comment) {
      return NextResponse.json(
        { error: "Comment body is required" },
        { status: 400 }
      );
    }
    const result = await addCaseComment(id, comment);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to add comment:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}
