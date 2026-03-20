import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// POST /api/auth/student
// Body: { name: string, phone: string }
// Looks up a STUDENT by first name (case-insensitive prefix) + exact phone.
// Returns the student's full data including course and lectures.
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, phone } = body;

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: "Name and phone number are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        role: "STUDENT",
        phone: phone.trim(),
        fullName: { startsWith: name.trim(), mode: "insensitive" },
      },
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

    if (!user) {
      return NextResponse.json(
        { error: "No student found with that name and phone number." },
        { status: 404 }
      );
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
  } catch (error) {
    console.error("[POST /api/auth/student]", error);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
