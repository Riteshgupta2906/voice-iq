import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// GET /api/courses
// Returns all courses with their lectures ordered by position.
export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        lectures: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            slug: true,
            title: true,
            youtubeUrl: true,
            order: true,
            createdAt: true
          }
        },
        _count: {
          select: { enrollments: true }
        }
      }
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error("[GET /api/courses]", error);
    return NextResponse.json({ error: "Failed to fetch courses." }, { status: 500 });
  }
}

// POST /api/courses
// Body: { name: string, description?: string }
// Creates a new course and returns it.
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Course name is required." }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        name: name.trim(),
        description: description?.trim() ?? null
      }
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("[POST /api/courses]", error);
    return NextResponse.json({ error: "Failed to create course." }, { status: 500 });
  }
}
