import { getServerSession } from "next-auth";
import type { UserRole } from "@prisma/client";
import { authOptions } from "@/lib/auth/options";
import { getDemoStore } from "@/lib/demo-store";

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

export async function requireUser() {
  const session = await getSession();

  if (session?.user?.id && session.user.organizationId) {
    return session.user;
  }

  const store = await getDemoStore();
  const organization = store.organization;
  const user = store.users.find((item) => item.id === "user-admin") ?? store.users[0];
  const department = user?.departmentId ? store.departments.find((item) => item.id === user.departmentId) : null;

  return {
    id: user?.id ?? "no-auth-user",
    name: user?.name ?? "Operação Studio",
    email: user?.email ?? "operacao@studiogestor.local",
    role: user?.role ?? "ADMIN",
    organizationId: organization.id,
    organizationName: organization.name,
    departmentId: user?.departmentId ?? null,
    departmentName: department?.name ?? null,
  } satisfies AppUser;
}
