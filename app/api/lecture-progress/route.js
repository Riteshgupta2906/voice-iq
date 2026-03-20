import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// GET /api/lecture-progress?userId=xxx
// Returns all LectureProgress records for a user.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId query param is required." }, { status: 400 });
    }

    const progresses = await prisma.lectureProgress.findMany({
      where: { userId },
      orderBy: { startedAt: "asc" },
      include: {
        voiceCalls: {
          select: { id: true, status: true, callSessionId: true, recording: true, comprehensionScore: true, weakTopics: true, summary: true },
          take: 1,
        },
      },
    });

    return NextResponse.json(progresses);
  } catch (error) {
    console.error("[GET /api/lecture-progress]", error);
    return NextResponse.json({ error: "Failed to fetch lecture progress." }, { status: 500 });
  }
}

// POST /api/lecture-progress
// Body: { userId, lectureId, status }
// Upserts a LectureProgress record.
// STARTED: create if not exists, no-op if already exists
// COMPLETED: upsert — set status + completedAt
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, lectureId, status } = body;

    if (!userId || !lectureId || !status) {
      return NextResponse.json(
        { error: "userId, lectureId, and status are required." },
        { status: 400 }
      );
    }

    if (status !== "STARTED" && status !== "COMPLETED") {
      return NextResponse.json(
        { error: "status must be STARTED or COMPLETED." },
        { status: 400 }
      );
    }

    let progress;

    if (status === "STARTED") {
      // Create only if no record exists — no-op if already STARTED or COMPLETED
      progress = await prisma.lectureProgress.upsert({
        where: { userId_lectureId: { userId, lectureId } },
        create: { userId, lectureId, status: "STARTED" },
        update: {}, // no-op on existing record
      });
    } else {
      // COMPLETED: always set status + completedAt
      progress = await prisma.lectureProgress.upsert({
        where: { userId_lectureId: { userId, lectureId } },
        create: { userId, lectureId, status: "COMPLETED", completedAt: new Date() },
        update: { status: "COMPLETED", completedAt: new Date() },
      });
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error("[POST /api/lecture-progress]", error);
    return NextResponse.json({ error: "Failed to upsert lecture progress." }, { status: 500 });
  }
}
