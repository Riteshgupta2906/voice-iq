import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// POST /api/courses/[courseId]/lectures
// Body: { title, youtubeUrl?, transcription? }
export async function POST(request, { params }) {
  try {
    const { courseId } = await params;
    const body = await request.json();
    const { title, youtubeUrl, transcription } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { error: "Lecture title is required." },
        { status: 400 },
      );
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const count = await prisma.lecture.count({ where: { courseId } });

    // Ensure slug uniqueness
    const baseSlug = slugify(title.trim());
    let slug = baseSlug;
    let attempt = 0;
    while (true) {
      const existing = await prisma.lecture.findUnique({ where: { slug } });
      if (!existing) break;
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    const lecture = await prisma.lecture.create({
      data: {
        title: title.trim(),
        slug,
        youtubeUrl: youtubeUrl?.trim() || null,
        transcription: transcription?.trim() || null,
        order: count,
        courseId,
      },
    });

    return NextResponse.json(lecture, { status: 201 });
  } catch (error) {
    console.error("[POST /api/courses/[courseId]/lectures]", error);
    return NextResponse.json(
      { error: "Failed to create lecture." },
      { status: 500 },
    );
  }
}
