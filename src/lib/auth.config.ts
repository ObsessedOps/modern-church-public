import type { NextAuthConfig } from "next-auth";

/**
 * Auth config that can be used in Edge runtime (middleware).
 * Does NOT import Prisma or any Node.js-only modules.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname === "/login";

      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.churchId = user.churchId;
        token.campusId = user.campusId;
        token.role = user.role;
        token.username = user.username;
        token.name = user.name;
        token.permissions = user.permissions ?? "";
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      session.user.id = token.id as string;
      session.user.churchId = token.churchId as string;
      session.user.campusId = token.campusId as string;
      session.user.role = token.role;
      session.user.username = token.username as string;
      session.user.name = token.name as string;
      session.user.permissions = (token.permissions as string) ?? "";
      return session;
    },
  },
  providers: [], // Providers are added in the full auth.ts
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;
