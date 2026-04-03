/**
 * URL de base utilisée par NextAuth (OAuth redirect_uri).
 * Sur Vercel : définir NEXTAUTH_URL = URL publique exacte (ex. https://trassci.vercel.app).
 */
export function getNextAuthPublicBaseUrl() {
  const explicit = process.env.NEXTAUTH_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//i, "");
    return `https://${host}`;
  }
  return null;
}

/** URI exacte à ajouter dans Google Cloud → OAuth → URI de redirection autorisés */
export function getGoogleOAuthRedirectUri() {
  const base = getNextAuthPublicBaseUrl();
  if (!base) return null;
  return `${base}/api/auth/callback/google`;
}
