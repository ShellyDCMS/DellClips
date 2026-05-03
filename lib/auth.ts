import { accounts, sessions, users, verificationTokens } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { isDellEmail } from "@/lib/utils";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";

const resendProvider = Resend({
  apiKey: process.env.AUTH_RESEND_KEY,
  from: "DellClips <onboarding@resend.dev>",
});

// In development, log magic link to console instead of sending email
if (process.env.NODE_ENV === "development") {
  resendProvider.sendVerificationRequest = async ({ identifier: email, url }) => {
    console.log("\n========================================");
    console.log("🔗 MAGIC LINK (dev only — click to sign in)");
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 URL: ${url}`);
    console.log("========================================\n");
  };
}

export const authConfig: NextAuthConfig = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [resendProvider],
  pages: {
    signIn: "/login",
    verifyRequest: "/verify",
    error: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (process.env.NODE_ENV === "development") {
        return true;
      }
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
    maxAge: 30 * 24 * 60 * 60,
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
