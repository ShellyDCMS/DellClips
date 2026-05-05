import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/drizzle/schema";
import { db } from "@/lib/db";
import { emailService } from "@/lib/services";
import { isDellEmail } from "@/lib/utils";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";

export const authConfig: NextAuthConfig = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    EmailProvider({
      // No vendor-specific configuration here.
      // Auth.js delegates to our EmailPort adapter via sendVerificationRequest.
      sendVerificationRequest: async ({ identifier: email, url }) => {
        if (process.env.NODE_ENV === "development") {
          console.log("\n========================================");
          console.log("🔗 MAGIC LINK (dev only — click to sign in)");
          console.log(`📧 Email: ${email}`);
          console.log(`🔑 URL: ${url}`);
          console.log("========================================\n");
          return;
        }
        // Delegates to whatever adapter is configured in lib/services.ts
        await emailService.sendMagicLink(email, url);
      },
    }),
  ],
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

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);