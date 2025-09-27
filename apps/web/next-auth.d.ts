// Augment next-auth types to include our fields
import NextAuth from "next-auth";
declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      role: string;
      partnerId: string;
      referralCode: string;
    };
  }
}
