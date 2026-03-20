import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// GET /api/candidates
// Returns all STUDENT users with their enrollment + course info.
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { createdAt: "desc" },
      include: {
        enrollments: {
          include: {
            course: {
              include: {
                lectures: {
                  orderBy: { order: "asc" },
                  select: { id: true, title: true, order: true },
                },
              },
            },
          },
        },
        lectureProgresses: {
          select: {
            id: true,
            lectureId: true,
            status: true,
            startedAt: true,
            completedAt: true,
            voiceCalls: {
              select: { id: true, status: true, transcript: true, recording: true, callSessionId: true, comprehensionScore: true, weakTopics: true, summary: true },
              take: 1,
            },
          },
        },
      },
    });

    const candidates = users.map((user) => {
      const enrollment = user.enrollments[0] ?? null;
      const course = enrollment?.course ?? null;

      const lectures = (course?.lectures ?? []).map((l) => {
        const lp = user.lectureProgresses.find((p) => p.lectureId === l.id) ?? null;
        return {
          id: l.id,
          title: l.title,
          order: l.order,
          progress: lp
            ? {
                id: lp.id,
                status: lp.status,
                startedAt: lp.startedAt,
                completedAt: lp.completedAt,
                voiceCall: lp.voiceCalls?.[0] ?? null,
              }
            : null,
        };
      });

      return {
        id: user.id,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        cohort: user.cohort,
        courseId: course?.id ?? null,
        courseName: course?.name ?? null,
        assignedOn: enrollment?.enrolledAt ?? user.createdAt,
        lectures,
      };
    });

    return NextResponse.json(candidates);
  } catch (error) {
    console.error("[GET /api/candidates]", error);
    return NextResponse.json(
      { error: "Failed to fetch candidates." },
      { status: 500 },
    );
  }
}

// POST /api/candidates
// Body: { name, email, phone, cohort?, courseId }
// Creates a STUDENT User + CourseEnrollment in a transaction.
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, cohort, courseId } = body;

    if (!name || !email || !phone || !courseId) {
      return NextResponse.json(
        { error: "name, email, phone, and courseId are required." },
        { status: 400 },
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lectures: {
          orderBy: { order: "asc" },
          take: 1,
          select: { title: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          fullName: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          cohort: cohort?.trim() || null,
          role: "STUDENT",
        },
      });

      await tx.courseEnrollment.create({
        data: { userId: created.id, courseId },
      });

      return created;
    });

    const firstLecture = course.lectures[0]?.title ?? null;

    return NextResponse.json(
      {
        id: user.id,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        cohort: user.cohort,
        courseId,
        status: "Active learner",
        currentLecture: firstLecture,
        assignedOn: "Just now",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A candidate with this email already exists." },
        { status: 409 },
      );
    }
    console.error("[POST /api/candidates]", error);
    return NextResponse.json(
      { error: "Failed to register candidate." },
      { status: 500 },
    );
  }
}
