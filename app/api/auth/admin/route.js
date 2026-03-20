import { NextResponse } from "next/server";

// POST /api/auth/admin
// Body: { key: string }
export async function POST(request) {
  try {
    const { key } = await request.json();

    if (!key || key !== process.env.ADMIN_AUTH_KEY) {
      return NextResponse.json({ error: "Invalid admin key." }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Auth failed." }, { status: 500 });
  }
}
