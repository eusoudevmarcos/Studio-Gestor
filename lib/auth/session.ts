import type { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";

export type AppUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: UserRole;
  organizationId: string;
  organizationName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
};

export async function getSession() {
  return getServerSession(authOptions);
}

// Usuário autenticado ou redirecionamento para o login.
export async function requireUser(): Promise<AppUser> {
  const session = await getSession();
  if (!session?.user?.id || !session.user.organizationId) redirect("/login");
  return session.user;
}
