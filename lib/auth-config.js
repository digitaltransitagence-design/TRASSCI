import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  findClientByEmail,
  verifyClientPassword,
  upsertGoogleUser,
  clientAccountsReady,
} from "./client-accounts";

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const googleOAuthEnabled = Boolean(googleClientId && googleClientSecret);

export const authOptions = {
  providers: [
    ...(googleOAuthEnabled
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            authorization: {
              params: {
                prompt: "select_account",
                access_type: "offline",
                response_type: "code",
              },
            },
          }),
        ]
      : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const ready = await clientAccountsReady();
        if (!ready) return null;
        const user = await findClientByEmail(credentials.email);
        if (!user?.password_hash) return null;
        if (!verifyClientPassword(credentials.password, user.password_hash)) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name || "",
          image: user.image || null,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        const ready = await clientAccountsReady();
        if (!ready) return "/client?error=TableClient";
        const row = await upsertGoogleUser({
          email: profile.email,
          name: profile.name || user.name || "",
          googleId: account.providerAccountId,
          image: profile.picture,
        });
        user.id = row.id;
        user.email = row.email;
        user.name = row.name;
        user.image = row.image;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.picture;
      }
      return session;
    },
  },
  pages: {
    signIn: "/client",
    error: "/client",
  },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  secret: process.env.NEXTAUTH_SECRET,
};
