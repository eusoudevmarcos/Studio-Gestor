import type { UserRole } from "@prisma/client";
import type { DefaultSession, DefaultUser } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      organizationId: string;
      organizationName?: string | null;
      departmentId?: string | null;
      departmentName?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: UserRole;
    organizationId?: string | null;
    organizationName?: string | null;
    departmentId?: string | null;
    departmentName?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    organizationId: string;
    organizationName?: string | null;
    departmentId?: string | null;
    departmentName?: string | null;
  }
}
