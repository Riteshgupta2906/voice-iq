import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const BOLNA_STATUS_MAP = {
  queued:              "QUEUED",
  rescheduled:        "RESCHEDULED",
  initiated:          "INITIATED",
  ringing:            "RINGING",
  "in-progress":      "IN_PROGRESS",
  "call-disconnected":"CALL_DISCONNECTED",
  completed:          "COMPLETED",
};

// POST /api/voice-calls/[voiceCallId]/sync
// Fetches the Bolna execution record for any call that has a callSessionId
// and updates status, transcript, and recording URL in the DB.
// Safe to call multiple times — skips if already COMPLETED with transcript + recording.
export async function POST(request, { params }) {
  try {
    const { voiceCallId } = await params;

    const voiceCall = await prisma.voiceCall.findUnique({
      where: { id: voiceCallId },
    });

    if (!voiceCall) {
      return NextResponse.json({ error: "VoiceCall not found." }, { status: 404 });
    }

    // Already fully synced — return early
    if (voiceCall.status === "COMPLETED" && voiceCall.transcript !== null && voiceCall.recording !== null && voiceCall.comprehensionScore !== null) {
      return NextResponse.json(voiceCall);
    }

    if (!voiceCall.callSessionId) {
      return NextResponse.json(
        { error: "No callSessionId stored — cannot fetch from Bolna." },
        { status: 400 },
      );
    }

    // Fetch execution details from Bolna
    const bolnaRes = await fetch(
      `https://api.bolna.ai/executions/${voiceCall.callSessionId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.BOLNA_API_KEY}`,
        },
      },
    );

    if (!bolnaRes.ok) {
      const text = await bolnaRes.text().catch(() => "");
      console.error("[SYNC] Bolna fetch failed:", bolnaRes.status, text);
      return NextResponse.json(
        { error: "Failed to fetch execution from Bolna." },
        { status: 502 },
      );
    }

    const execution = await bolnaRes.json();

    const transcript        = execution?.transcript ?? null;
    const recording         = execution?.telephony_data?.recording_url ?? null;
    const executionStatus   = BOLNA_STATUS_MAP[execution?.status] ?? null;
    const summary           = execution?.summary ?? null;
    const comprehensionScore = execution?.extracted_data?.comprehension_score ?? null;
    const weakTopics        = execution?.extracted_data?.weak_topics ?? [];

    const data = { transcript, recording, summary, comprehensionScore, weakTopics };
    if (executionStatus) data.status = executionStatus;
    if (executionStatus === "COMPLETED" && !voiceCall.completedAt) data.completedAt = new Date();

    const updated = await prisma.voiceCall.update({
      where: { id: voiceCallId },
      data,
    });

    console.log(`[SYNC] VoiceCall ${voiceCallId} — status: ${executionStatus}, transcript: ${!!transcript}, recording: ${!!recording}`);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[POST /api/voice-calls/[voiceCallId]/sync]", error);
    return NextResponse.json({ error: "Sync failed." }, { status: 500 });
  }
}
