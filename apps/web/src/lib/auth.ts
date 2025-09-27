import type { NextAuthOptions, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/partner/login" },
  providers: [
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(creds) {
        const email = (creds?.email || "").toLowerCase().trim();
        const password = (creds?.password || "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        const u: User & { role: string; partnerId: string; referralCode: string } = {
          id: user.id, name: user.name ?? "", email: user.email,
          role: user.role, partnerId: user.partnerId, referralCode: user.referralCode
        };
        return u;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // @ts-ignore
        token.role = (user as any).role;
        // @ts-ignore
        token.partnerId = (user as any).partnerId;
        // @ts-ignore
        token.referralCode = (user as any).referralCode;
      }
      return token;
    },
    async session({ session, token }) {
      // @ts-ignore
      session.user.role = token.role as string;
      // @ts-ignore
      session.user.partnerId = token.partnerId as string;
      // @ts-ignore
      session.user.referralCode = token.referralCode as string;
      return session;
    }
  }
};
