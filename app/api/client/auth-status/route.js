import { NextResponse } from "next/server";
import {
  getNextAuthPublicBaseUrl,
  getGoogleOAuthRedirectUri,
} from "@/lib/nextauth-public";

export async function GET() {
  const googleId = process.env.GOOGLE_CLIENT_ID?.trim();
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const google = Boolean(googleId && googleSecret);
  const nextAuthBaseUrl = getNextAuthPublicBaseUrl();
  const googleRedirectUri = google ? getGoogleOAuthRedirectUri() : null;

  return NextResponse.json({
    google,
    /** URL canonique déduite (NEXTAUTH_URL ou VERCEL_URL) — pour vérifier redirect_uri */
    nextAuthBaseUrl,
    /** À copier tel quel dans Google Cloud → URI de redirection autorisés */
    googleRedirectUri,
    resend: !!process.env.RESEND_API_KEY?.trim(),
  });
}
