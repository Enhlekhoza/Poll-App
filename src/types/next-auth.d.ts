import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string; // our extra field
    } & DefaultSession["user"];
  }
}
