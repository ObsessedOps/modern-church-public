import { Role } from "@/generated/prisma/enums";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      churchId: string;
      campusId: string | null;
      name: string;
      email: string;
      role: Role;
      username: string;
      permissions: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    churchId: string;
    campusId: string | null;
    name: string;
    email: string;
    role: Role;
    username: string;
    permissions: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    churchId: string;
    campusId: string | null;
    role: Role;
    username: string;
    permissions: string;
  }
}
