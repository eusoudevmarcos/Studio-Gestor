import type { Task, UserRole } from "@prisma/client";

type PermissionUser = {
  id: string;
  role: UserRole;
  departmentId?: string | null;
};

const managers: UserRole[] = ["ADMIN", "GESTOR"];

export function canManageUsers(role: UserRole) {
  return role === "ADMIN";
}

export function canCreateTask(role: UserRole) {
  return role !== "CONSULTA";
}

export function canViewAllTasks(role: UserRole) {
  return managers.includes(role);
}

export function canViewDepartmentTasks(role: UserRole) {
  return role === "COORDENADOR" || role === "COLABORADOR";
}

export function canManageRoutines(role: UserRole) {
  return managers.includes(role) || role === "COORDENADOR";
}

export function canManageSegments(role: UserRole) {
  return managers.includes(role);
}

export function canAccessReports(role: UserRole) {
  return role !== "CONSULTA";
}

export function canEditTask(user: PermissionUser, task: Pick<Task, "responsibleId" | "departmentId">) {
  if (managers.includes(user.role)) return true;
  if (user.role === "CONSULTA") return false;
  if (user.role === "COORDENADOR") return task.departmentId === user.departmentId;
  return task.responsibleId === user.id;
}
