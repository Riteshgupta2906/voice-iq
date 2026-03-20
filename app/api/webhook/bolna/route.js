import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// Bolna status → our CallStatus enum
const STATUS_MAP = {
  queued:              "QUEUED",
  rescheduled:         "RESCHEDULED",
  initiated:           "INITIATED",
  ringing:             "RINGING",
  "in-progress":       "IN_PROGRESS",
  "call-disconnected": "CALL_DISCONNECTED",
  completed:           "COMPLETED",
};

// POST /api/webhook/bolna
export async function POST(request) {
  try {
    const payload = await request.json();

    const bolnaStatus   = payload?.status ?? "";
    const callSessionId = payload?.execution_id ?? payload?.id;

    console.log("[BOLNA]", bolnaStatus, callSessionId ?? "—");

    if (!callSessionId) {
      console.warn("[BOLNA WEBHOOK] No execution_id/id — skipping.");
      return NextResponse.json({ received: true });
    }

    const newStatus = STATUS_MAP[bolnaStatus];
    if (!newStatus) {
      console.warn(`[BOLNA WEBHOOK] Unknown status "${bolnaStatus}" — ignored.`);
      return NextResponse.json({ received: true });
    }

    const data = { status: newStatus };

    if (newStatus === "COMPLETED") {
      data.completedAt        = new Date();
      data.transcript         = payload?.transcript ?? null;
      data.recording          = payload?.telephony_data?.recording_url ?? payload?.recording_url ?? payload?.recording ?? null;
      data.summary            = payload?.summary ?? null;
      data.comprehensionScore = payload?.extracted_data?.comprehension_score ?? null;
      data.weakTopics         = payload?.extracted_data?.weak_topics ?? [];
    }

    const result = await prisma.voiceCall.updateMany({
      where: {
        callSessionId,
        status: { not: newStatus },
      },
      data,
    });

    if (result.count > 0) {
      console.log(`[BOLNA WEBHOOK] ${callSessionId}: → ${newStatus}`);
    } else {
      console.log(`[BOLNA WEBHOOK] No-op for ${callSessionId} (unchanged or not found)`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[BOLNA WEBHOOK] Error:", error);
    return NextResponse.json({ received: true });
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "Bolna webhook endpoint. Expects POST from Bolna Voice AI." },
    { status: 405 },
  );
}
