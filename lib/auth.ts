import { db } from "@/lib/db";
import { isDellEmail } from "@/lib/utils";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";

export const authConfig: NextAuthConfig = {
  adapter: DrizzleAdapter(db),
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: "DellClips <noreply@dellclips.com>",
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/verify",
    error: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      // Only allow @dell.com emails
      if (!user.email || !isDellEmail(user.email)) {
        return false;
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);