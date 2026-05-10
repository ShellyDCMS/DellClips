import { accounts, sessions, users, verificationTokens } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { emailService } from "@/lib/services";
import { isDellEmail } from "@/lib/utils";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";

export const authConfig: NextAuthConfig = {
  debug: true,
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
      // Generate a 6-digit OTP code instead of a long token.
      // This avoids corporate email scanners (Dell, Microsoft) pre-fetching
      // magic links and exhausting the one-time-use token.
      generateVerificationToken: () => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        return code;
      },
      sendVerificationRequest: async ({ identifier: email, url, token }) => {
        if (process.env.NODE_ENV === "development") {
          console.log("\n========================================");
          console.log("� VERIFICATION CODE (dev only)");
          console.log(`📧 Email: ${email}`);
          console.log(`� Code: ${token}`);
          console.log(`🔗 URL: ${url}`);
          console.log("========================================\n");
          return;
        }
        try {
          await emailService.sendVerificationCode(email, token);
        } catch (err) {
          console.error("Failed to send verification code:", err);
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

      // Auto-generate a display name from the email if the user doesn't have one
      if (!user.name && user.email) {
        const { generateNameFromEmail } = await import("@/lib/utils");
        user.name = generateNameFromEmail(user.email);
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
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
