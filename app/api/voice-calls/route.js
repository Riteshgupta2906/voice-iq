import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { generateLectureQuestions } from "@/lib/gemini";

// POST /api/voice-calls
// Body: { userId: string, lectureId: string }
//
// Creates a VoiceCall record and triggers an outbound AI call via Bolna.
// Called when a student clicks "Mark as completed" on a lecture.
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, lectureId } = body;

    if (!userId || !lectureId) {
      return NextResponse.json(
        { error: "userId and lectureId are required." },
        { status: 400 }
      );
    }

    // ── Upsert LectureProgress to COMPLETED ────────────────────────
    const progress = await prisma.lectureProgress.upsert({
      where: { userId_lectureId: { userId, lectureId } },
      create: { userId, lectureId, status: "COMPLETED", completedAt: new Date() },
      update: { status: "COMPLETED", completedAt: new Date() },
    });

    // ── Prevent duplicate calls ─────────────────────────────────────
    const existing = await prisma.voiceCall.findUnique({
      where: { lectureProgressId: progress.id },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    // ── Look up user and lecture (needed for Bolna call) ────────────
    const [user, lecture] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.lecture.findUnique({
        where: { id: lectureId },
        include: { course: { select: { name: true } } },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    if (!lecture) {
      return NextResponse.json({ error: "Lecture not found." }, { status: 404 });
    }

    // ── Generate / fetch quiz questions ────────────────────────────
    const questionCount = await prisma.lectureQuestion.count({
      where: { lectureId },
    });

    if (questionCount === 0) {
      console.log(`[VoiceCall] Generating questions for lecture "${lecture.title}"`);
      const generated = await generateLectureQuestions(
        lecture.transcription ?? "",
        lecture.title
      );
      await prisma.lectureQuestion.createMany({
        data: generated.map((q) => ({
          lectureId,
          question: q.question,
          expected: q.expected,
          followUp: q.follow_up,
        })),
      });
    }

    const allQuestions = await prisma.lectureQuestion.findMany({
      where: { lectureId },
    });

    // Shuffle and pick 3
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const threeQuestions = shuffled.slice(0, 3);

    // ── Create VoiceCall record (owned by LectureProgress) ──────────
    const voiceCall = await prisma.voiceCall.create({
      data: {
        lectureProgressId: progress.id,
        status: "QUEUED",
        callProvider: "bolna",
      },
    });

    console.log(
      `[VoiceCall] Created — id: ${voiceCall.id}, user: ${user.fullName} (${user.phone}), lecture: "${lecture.title}"`
    );

    // ── Trigger Bolna outbound call ─────────────────────────────────
    try {
      const bolnaRes = await fetch("https://api.bolna.ai/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BOLNA_API_KEY}`,
        },
        body: JSON.stringify({
          agent_id: process.env.AGENT_ID,
          recipient_phone_number: user.phone,
          from_phone_number: process.env.BOLNA_FROM_PHONE,
          user_data: {
            candidate_name: user.fullName,
            lecture_topic: lecture.title,
            questions: JSON.stringify(threeQuestions),
          },
        }),
      });

      const bolnaData = await bolnaRes.json();
      console.log("[VoiceCall] Bolna response:", bolnaData);

      if (bolnaRes.ok) {
        await prisma.voiceCall.update({
          where: { id: voiceCall.id },
          data: {
            callSessionId: bolnaData.execution_id,
            status: "INITIATED",
          },
        });
        voiceCall.callSessionId = bolnaData.execution_id;
        voiceCall.status = "INITIATED";
      } else {
        await prisma.voiceCall.update({
          where: { id: voiceCall.id },
          data: { status: "CALL_DISCONNECTED" },
        });
        voiceCall.status = "CALL_DISCONNECTED";
      }
    } catch (bolnaError) {
      console.error("[VoiceCall] Bolna call failed:", bolnaError);
      await prisma.voiceCall.update({
        where: { id: voiceCall.id },
        data: { status: "CALL_DISCONNECTED" },
      });
      voiceCall.status = "CALL_DISCONNECTED";
    }

    return NextResponse.json(voiceCall, { status: 201 });
  } catch (error) {
    console.error("[POST /api/voice-calls]", error);
    return NextResponse.json({ error: "Failed to create voice call." }, { status: 500 });
  }
}

// GET /api/voice-calls?userId=xxx
// Returns all voice calls for a given user, newest first.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId query param is required." }, { status: 400 });
    }

    const calls = await prisma.voiceCall.findMany({
      where: { lectureProgress: { userId } },
      orderBy: { createdAt: "desc" },
      include: {
        lectureProgress: {
          select: {
            lecture: { select: { id: true, title: true, slug: true } },
          },
        },
      },
    });

    return NextResponse.json(calls);
  } catch (error) {
    console.error("[GET /api/voice-calls]", error);
    return NextResponse.json({ error: "Failed to fetch voice calls." }, { status: 500 });
  }
}
