import { accounts, sessions, users, verificationTokens } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { emailService } from "@/lib/services";
import { isDellEmail } from "@/lib/utils";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";

export const authConfig: NextAuthConfig = {
  debug: true,  // ← ADD THIS LINE (temporarily)
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    EmailProvider({
      // Dummy server config required by Nodemailer validation at build time.
      // Not actually used — sendVerificationRequest below handles all email delivery.
      server: {
        host: "localhost",
        port: 25,
        auth: { user: "", pass: "" },
      },
      from: "DellClips <noreply@dellclips.is-a.dev>",
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
        try {
          await emailService.sendMagicLink(email, url);
        } catch (err) {
          console.error("Failed to send magic link:", err);
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
