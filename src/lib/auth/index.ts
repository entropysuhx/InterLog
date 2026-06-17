import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";

import { env } from "@/env";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import { consumeRateLimit, getRateLimitStatus, resetRateLimit } from "@/lib/rate-limit";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const providers: NextAuthConfig["providers"] = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const parsed = LoginSchema.safeParse(credentials);
      if (!parsed.success) return null;
      const email = parsed.data.email.toLowerCase();
      const status = await getRateLimitStatus(email, "login", 5, 15 * 60);
      if (!status.allowed) return null;
      const user = await prisma.user.findUnique({
        where: { email },
        include: { credential: true },
      });
      if (!user?.credential) {
        await consumeRateLimit(email, "login", 5, 15 * 60);
        return null;
      }
      if (!user.emailVerified) return null;
      const valid = await verifyPassword(parsed.data.password, user.credential.passwordHash);
      if (!valid) {
        await consumeRateLimit(email, "login", 5, 15 * 60);
        return null;
      }
      await resetRateLimit(email, "login");
      return { id: user.id, email: user.email, name: user.name };
    },
  }),
];

if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers,
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user?.id) token.id = user.id;
      delete token.picture;
      if (account?.provider === "google" && user?.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string") session.user.id = token.id;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
