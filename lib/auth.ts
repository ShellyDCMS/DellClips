import { accounts, sessions, users, verificationTokens } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { emailService } from "@/lib/services";
import { isDellEmail } from "@/lib/utils";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";

export const authConfig: NextAuthConfig = {
  debug: true, // ← ADD THIS LINE (temporarily)
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    EmailProvider({
      server: {
        host: "localhost",
        port: 25,
        auth: { user: "", pass: "" },
      },
      from: process.env.GMAIL_USER || "noreply@dellclips.com",
      sendVerificationRequest: async ({ identifier: email, url }) => {
        if (process.env.NODE_ENV === "development") {
          console.log("\n========================================");
          console.log("🔗 MAGIC LINK (dev only — click to sign in)");
          console.log(`📧 Email: ${email}`);
          console.log(`🔑 URL: ${url}`);
          console.log("========================================\n");
          return;
        }
        // Rewrite the callback URL to go through our interstitial page
        // Original: /api/auth/callback/email?callbackUrl=...&token=...&email=...
        // New:      /confirm?callbackUrl=...&token=...&email=...
        const confirmUrl = url.replace("/api/auth/callback/email", "/confirm");
        // Delegates to whatever adapter is configured in lib/services.ts
        try {
          console.log("[auth] === SENDING MAGIC LINK ===");
          console.log("[auth] To:", email);
          console.log("[auth] Original URL:", url);
          console.log("[auth] Confirm URL:", confirmUrl);
          await emailService.sendMagicLink(email, confirmUrl);
          console.log("[auth] === MAGIC LINK SENT SUCCESSFULLY ===");
        } catch (err) {
          console.error("[auth] === FAILED TO SEND MAGIC LINK ===");
          console.error("[auth] Error:", err);
          throw err;
        }
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

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
