import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    resend: !!process.env.RESEND_API_KEY?.trim(),
  });
}
