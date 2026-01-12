import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

const config: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account?.provider === "linkedin") {
        token.linkedinId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Create subscription for new users
      if (user.id && account) {
        try {
          const existingSub = await prisma.subscription.findUnique({
            where: { userId: user.id },
          });

          if (!existingSub) {
            await prisma.subscription.create({
              data: {
                userId: user.id,
                plan: "FREE",
                status: "ACTIVE",
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              },
            });
          }
        } catch (error) {
          console.error("Error creating subscription:", error);
        }
      }
      return true;
    },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nextAuthResult = NextAuth(config) as any;
export const { handlers, auth, signIn, signOut } = nextAuthResult;

