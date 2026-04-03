import { NextResponse } from "next/server";

export async function GET() {
  const googleId = process.env.GOOGLE_CLIENT_ID?.trim();
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  return NextResponse.json({
    google: Boolean(googleId && googleSecret),
    resend: !!process.env.RESEND_API_KEY?.trim(),
  });
}
