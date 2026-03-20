import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// POST /api/auth/candidate
// Body: { candidateId: string, key: string }
// Verifies the shared candidate auth key, then returns the candidate's full data.
export async function POST(request) {
  try {
    const { candidateId, key } = await request.json();

    if (!key || key !== process.env.CANDIDATE_AUTH_KEY) {
      return NextResponse.json({ error: "Invalid access key." }, { status: 401 });
    }

    if (!candidateId) {
      return NextResponse.json({ error: "candidateId is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: candidateId },
      include: {
        enrollments: {
          take: 1,
          include: {
            course: {
              include: {
                lectures: {
                  orderBy: { order: "asc" },
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    youtubeUrl: true,
                    transcription: true,
                    order: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
    }

    const course = user.enrollments[0]?.course ?? null;

    return NextResponse.json({
      id: user.id,
      name: user.fullName,
      phone: user.phone,
      cohort: user.cohort,
      courseId: course?.id ?? null,
      courseName: course?.name ?? null,
      lectures: course?.lectures ?? [],
    });
  } catch {
    return NextResponse.json({ error: "Auth failed." }, { status: 500 });
  }
}
