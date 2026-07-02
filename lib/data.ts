import {
  addDays,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  startOfDay,
  startOfMonth,
} from "date-fns";
import type { TaskStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";
import { canViewAllTasks } from "@/lib/permissions";
import { currentFiscalCompetence, fiscalCompetenceLabel, getDemoStore, type DemoStore, type DemoTask } from "@/lib/demo-store";
import { isAccountingSegmentName } from "@/lib/accounting";
import { getFiscalRoutineTemplates } from "@/lib/fiscal-routines";

type SearchFilters = {
  q?: string;
  status?: string;
  segmentId?: string;
  departmentId?: string;
  responsibleId?: string;
  clientProjectId?: string;
  recurrence?: string;
  competence?: string;
  sort?: string;
};

function includes(value: string | null | undefined, query?: string) {
  if (!query) return true;
  return (value ?? "").toLowerCase().includes(query.toLowerCase());
}

function isOpenStatus(status: string) {
  return !["CONCLUIDO", "CANCELADO"].includes(status);
}

function findDepartment(store: DemoStore, id: string) {
  return store.departments.find((department) => department.id === id)!;
}

function findSegment(store: DemoStore, id: string | null) {
  return id ? store.segments.find((segment) => segment.id === id) ?? null : null;
}

function findClient(store: DemoStore, id: string | null) {
  return id ? store.clientProjects.find((client) => client.id === id) ?? null : null;
}

function findRoutineById(store: DemoStore, id: string | null) {
  return id ? store.routines.find((routine) => routine.id === id) ?? null : null;
}

function findUser(store: DemoStore, id: string | null) {
  return id ? store.users.find((user) => user.id === id) ?? null : null;
}

function taskWithRelations(store: DemoStore, task: DemoTask) {
  return {
    ...task,
    clientProject: findClient(store, task.clientProjectId),
    department: findDepartment(store, task.departmentId),
    segment: findSegment(store, task.segmentId),
    routine: findRoutineById(store, task.routineId),
    responsible: findUser(store, task.responsibleId),
  };
}

function visibleTasks(store: DemoStore, filters: SearchFilters = {}) {
  const query = filters.q?.toLowerCase();

  return store.tasks
    .filter((task) => (filters.status ? task.status === filters.status : true))
    .filter((task) => (filters.segmentId ? task.segmentId === filters.segmentId : true))
    .filter((task) => (filters.departmentId ? task.departmentId === filters.departmentId : true))
    .filter((task) => (filters.responsibleId ? task.responsibleId === filters.responsibleId : true))
    .filter((task) => (filters.clientProjectId ? task.clientProjectId === filters.clientProjectId : true))
    .filter((task) => (filters.competence ? task.competence === filters.competence : true))
    .filter((task) => {
      if (!query) return true;
      const client = findClient(store, task.clientProjectId);
      return includes(task.title, query) || includes(task.description, query) || includes(client?.name, query);
    })
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .map((task) => taskWithRelations(store, task));
}

function isFiscalTask(task: DemoTask) {
  return task.systemKey?.startsWith("fiscal:") ?? false;
}

function countBy<T extends string | null>(values: T[]) {
  const map = new Map<T, number>();
  values.forEach((value) => map.set(value, (map.get(value) ?? 0) + 1));
  return [...map.entries()].map(([id, count]) => ({ id, count }));
}

export async function getCurrentContext() {
  const user = await requireUser();
  return {
    user,
    organizationId: user.organizationId,
  };
}

export function getTaskScope(user: Awaited<ReturnType<typeof requireUser>>) {
  return canViewAllTasks(user.role) ? {} : { responsibleId: user.id };
}

export async function getFormOptions() {
  const store = await getDemoStore();
  return {
    segments: store.segments.filter((segment) => segment.active).sort((a, b) => a.name.localeCompare(b.name)),
    departments: store.departments
      .filter((department) => department.active)
      .map((department) => ({ ...department, segment: findSegment(store, department.segmentId) }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    users: store.users.filter((user) => user.active).sort((a, b) => a.name.localeCompare(b.name)),
    clientProjects: store.clientProjects
      .map((client) => ({
        ...client,
        segment: findSegment(store, client.segmentId),
        mainResponsible: findUser(store, client.mainResponsibleUserId),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    routines: store.routines
      .filter((routine) => routine.active)
      .map((routine) => ({
        ...routine,
        segment: findSegment(store, routine.segmentId)!,
        department: findDepartment(store, routine.departmentId),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export async function getDashboardData() {
  const store = await getDemoStore();
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const tasks = visibleTasks(store);
  const openTasks = tasks.filter((task) => isOpenStatus(task.status));

  const departmentCounts = countBy(openTasks.map((task) => task.departmentId));
  const segmentCounts = countBy(openTasks.map((task) => task.segmentId));
  const responsibleCounts = countBy(tasks.filter((task) => task.status === "CONCLUIDO" && task.completedAt && task.completedAt >= monthStart && task.completedAt <= monthEnd).map((task) => task.responsibleId));
  const clientCounts = countBy(openTasks.map((task) => task.clientProjectId));

  return {
    cards: {
      dueToday: openTasks.filter((task) => task.dueDate >= today && task.dueDate < tomorrow).length,
      overdue: openTasks.filter((task) => task.dueDate < today).length,
      weekTasks: openTasks.filter((task) => task.dueDate >= today && task.dueDate <= weekEnd).length,
      completedThisMonth: tasks.filter((task) => task.status === "CONCLUIDO" && task.completedAt && isSameMonth(task.completedAt, today)).length,
      waitingClient: tasks.filter((task) => task.status === "AGUARDANDO_CLIENTE").length,
      activeClients: store.clientProjects.filter((client) => ["ATIVO", "EM_IMPLANTACAO"].includes(client.status)).length,
      activeRoutines: store.routines.filter((routine) => routine.active).length,
    },
    nextTasks: openTasks.slice(0, 8),
    criticalTasks: openTasks.filter((task) => ["ALTA", "CRITICA"].includes(task.priority)).slice(0, 8),
    departmentRows: departmentCounts.map((row) => ({ name: findDepartment(store, row.id).name, count: row.count })),
    segmentRows: segmentCounts.map((row) => ({ name: findSegment(store, row.id)?.name ?? "Sem segmento", count: row.count })),
    responsibleRows: responsibleCounts.map((row) => ({ name: findUser(store, row.id)?.name ?? "Sem responsÃ¡vel", count: row.count })),
    clientRows: clientCounts.map((row) => ({ name: findClient(store, row.id)?.name ?? "Sem cliente/projeto", count: row.count })),
  };
}

export async function getClientProjects(filters: SearchFilters = {}) {
  const store = await getDemoStore();
  return store.clientProjects
    .filter((client) => (filters.status ? client.status === filters.status : true))
    .filter((client) => (filters.segmentId ? client.segmentId === filters.segmentId : true))
    .filter((client) => includes(client.name, filters.q) || includes(client.document, filters.q))
    .map((client) => ({
      ...client,
      segment: findSegment(store, client.segmentId),
      mainResponsible: findUser(store, client.mainResponsibleUserId),
      _count: { tasks: store.tasks.filter((task) => task.clientProjectId === client.id).length },
    }))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getClientProject(id: string) {
  const store = await getDemoStore();
  const client = store.clientProjects.find((item) => item.id === id);
  if (!client) return null;

  return {
    ...client,
    segment: findSegment(store, client.segmentId),
    mainResponsible: findUser(store, client.mainResponsibleUserId),
    tasks: store.tasks
      .filter((task) => task.clientProjectId === client.id)
      .map((task) => ({
        ...task,
        department: findDepartment(store, task.departmentId),
        responsible: findUser(store, task.responsibleId),
      }))
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()),
  };
}

export async function getSegments(filters: SearchFilters = {}) {
  const store = await getDemoStore();
  return store.segments
    .filter((segment) => includes(segment.name, filters.q) || includes(segment.description, filters.q))
    .map((segment) => ({
      ...segment,
      _count: {
        departments: store.departments.filter((department) => department.segmentId === segment.id).length,
        routines: store.routines.filter((routine) => routine.segmentId === segment.id).length,
        clientProjects: store.clientProjects.filter((client) => client.segmentId === segment.id).length,
      },
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSegment(id: string) {
  const store = await getDemoStore();
  const segment = store.segments.find((item) => item.id === id);
  if (!segment) return null;
  return {
    ...segment,
    departments: store.departments.filter((department) => department.segmentId === segment.id),
    routines: store.routines.filter((routine) => routine.segmentId === segment.id),
  };
}

export async function getDepartments(filters: SearchFilters = {}) {
  const store = await getDemoStore();
  return store.departments
    .filter((department) => (filters.segmentId ? department.segmentId === filters.segmentId : true))
    .filter((department) => includes(department.name, filters.q) || includes(department.description, filters.q))
    .map((department) => ({
      ...department,
      segment: findSegment(store, department.segmentId),
      _count: {
        users: store.users.filter((user) => user.departmentId === department.id).length,
        routines: store.routines.filter((routine) => routine.departmentId === department.id).length,
        tasks: store.tasks.filter((task) => task.departmentId === department.id).length,
      },
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getDepartment(id: string) {
  const store = await getDemoStore();
  const department = store.departments.find((item) => item.id === id);
  if (!department) return null;
  return {
    ...department,
    segment: findSegment(store, department.segmentId),
    users: store.users.filter((user) => user.departmentId === department.id),
    routines: store.routines.filter((routine) => routine.departmentId === department.id),
  };
}

export async function getRoutines(filters: SearchFilters = {}) {
  const store = await getDemoStore();
  return store.routines
    .filter((routine) => (filters.segmentId ? routine.segmentId === filters.segmentId : true))
    .filter((routine) => (filters.departmentId ? routine.departmentId === filters.departmentId : true))
    .filter((routine) => (filters.recurrence ? routine.recurrence === filters.recurrence : true))
    .filter((routine) => includes(routine.name, filters.q) || includes(routine.description, filters.q))
    .map((routine) => ({
      ...routine,
      segment: findSegment(store, routine.segmentId)!,
      department: findDepartment(store, routine.departmentId),
      _count: { tasks: store.tasks.filter((task) => task.routineId === routine.id).length },
    }))
    .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
}

export async function getRoutine(id: string) {
  const store = await getDemoStore();
  const routine = store.routines.find((item) => item.id === id);
  if (!routine) return null;
  return {
    ...routine,
    segment: findSegment(store, routine.segmentId)!,
    department: findDepartment(store, routine.departmentId),
  };
}

export async function getTasks(filters: SearchFilters = {}) {
  const store = await getDemoStore();
  return visibleTasks(store, filters);
}

export async function getFiscalCompetenceData(
  competence = currentFiscalCompetence(),
  filters: Pick<SearchFilters, "clientProjectId" | "q" | "sort" | "status"> & { overdue?: boolean } = {},
) {
  const store = await getDemoStore();
  const today = startOfDay(new Date());
  const allClients = store.clientProjects
    .filter((client) => {
      const segment = findSegment(store, client.segmentId);
      return isAccountingSegmentName(segment?.name) && ["ATIVO", "EM_IMPLANTACAO"].includes(client.status);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const clients = allClients.filter((client) => (filters.clientProjectId ? client.id === filters.clientProjectId : true));

  const fiscalTasks = store.tasks
    .filter((task) => task.competence === competence && isFiscalTask(task))
    .filter((task) => (filters.clientProjectId ? task.clientProjectId === filters.clientProjectId : true))
    .filter((task) => (filters.status ? task.status === filters.status : true))
    .filter((task) => (filters.overdue ? isOpenStatus(task.status) && task.dueDate < today : true))
    .filter((task) => {
      if (!filters.q) return true;
      const client = findClient(store, task.clientProjectId);
      return includes(task.title, filters.q) || includes(task.description, filters.q) || includes(client?.name, filters.q);
    })
    .map((task) => taskWithRelations(store, task))
    .sort((a, b) => {
      switch (filters.sort) {
        case "cliente":
          return (a.clientProject?.name ?? "").localeCompare(b.clientProject?.name ?? "") || a.dueDate.getTime() - b.dueDate.getTime();
        case "status":
          return a.status.localeCompare(b.status) || a.dueDate.getTime() - b.dueDate.getTime();
        case "titulo":
          return a.title.localeCompare(b.title);
        case "vencimento-desc":
          return b.dueDate.getTime() - a.dueDate.getTime();
        default:
          return a.dueDate.getTime() - b.dueDate.getTime();
      }
    });
  const openTasks = fiscalTasks.filter((task) => isOpenStatus(task.status));
  const overdueTasks = openTasks.filter((task) => task.dueDate < today);
  const todayTasks = openTasks.filter((task) => task.dueDate.getTime() === today.getTime());

  return {
    competence,
    competenceLabel: fiscalCompetenceLabel(competence),
    cards: {
      clients: allClients.length,
      visibleClients: clients.length,
      generatedTasks: fiscalTasks.length,
      openTasks: openTasks.length,
      todayTasks: todayTasks.length,
      overdueTasks: overdueTasks.length,
      completedTasks: fiscalTasks.filter((task) => task.status === "CONCLUIDO").length,
    },
    clientOptions: allClients.map((client) => ({ id: client.id, name: client.name })),
    clients: clients.map((client) => {
      const segment = findSegment(store, client.segmentId);
      const tasks = fiscalTasks
        .filter((task) => task.clientProjectId === client.id)
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

      return {
        ...client,
        segment,
        mainResponsible: findUser(store, client.mainResponsibleUserId),
        expectedRoutines: getFiscalRoutineTemplates(client),
        tasks,
        openTasks: tasks.filter((task) => isOpenStatus(task.status)).length,
        overdueTasks: tasks.filter((task) => isOpenStatus(task.status) && task.dueDate < today).length,
        completedTasks: tasks.filter((task) => task.status === "CONCLUIDO").length,
      };
    }),
    tasks: fiscalTasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()),
  };
}

export async function getTask(id: string) {
  const store = await getDemoStore();
  const task = store.tasks.find((item) => item.id === id);
  if (!task) return null;
  return {
    ...taskWithRelations(store, task),
    createdBy: findUser(store, task.createdById),
    comments: store.comments
      .filter((comment) => comment.taskId === task.id)
      .map((comment) => ({ ...comment, author: findUser(store, comment.authorId)! }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    histories: store.histories
      .filter((history) => history.taskId === task.id)
      .map((history) => ({ ...history, user: findUser(store, history.userId) }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  };
}

export async function getCalendarBuckets() {
  const tasks = await getTasks();
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const nextWeekEnd = addDays(weekEnd, 7);

  return {
    overdue: tasks.filter((task) => task.dueDate < today && isOpenStatus(task.status)),
    today: tasks.filter((task) => task.dueDate >= today && task.dueDate < tomorrow),
    tomorrow: tasks.filter((task) => task.dueDate >= tomorrow && task.dueDate < addDays(tomorrow, 1)),
    thisWeek: tasks.filter((task) => task.dueDate >= addDays(tomorrow, 1) && task.dueDate <= weekEnd),
    nextWeek: tasks.filter((task) => task.dueDate > weekEnd && task.dueDate <= nextWeekEnd),
    future: tasks.filter((task) => task.dueDate > nextWeekEnd),
  };
}

export async function getTeam() {
  const store = await getDemoStore();
  return store.users
    .map((user) => ({
      ...user,
      department: user.departmentId ? findDepartment(store, user.departmentId) : null,
      _count: { responsibleTasks: store.tasks.filter((task) => task.responsibleId === user.id).length },
    }))
    .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
}

export async function getReportsData() {
  const store = await getDemoStore();
  const tasks = visibleTasks(store);
  const today = startOfDay(new Date());
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const openTasks = tasks.filter((task) => isOpenStatus(task.status));

  return {
    byStatus: countBy(tasks.map((task) => task.status)).map((row) => ({ name: row.id as TaskStatus, count: row.count })),
    byDepartment: countBy(tasks.map((task) => task.departmentId)).map((row) => ({ name: findDepartment(store, row.id).name, count: row.count })),
    bySegment: countBy(tasks.map((task) => task.segmentId)).map((row) => ({ name: findSegment(store, row.id)?.name ?? "Sem segmento", count: row.count })),
    byResponsible: countBy(tasks.map((task) => task.responsibleId)).map((row) => ({ name: findUser(store, row.id)?.name ?? "Sem responsÃ¡vel", count: row.count })),
    overdueByClient: countBy(openTasks.filter((task) => task.dueDate < today).map((task) => task.clientProjectId)).map((row) => ({
      name: findClient(store, row.id)?.name ?? "Sem cliente/projeto",
      count: row.count,
    })),
    completedThisMonth: tasks
      .filter((task) => task.status === "CONCLUIDO" && task.completedAt && task.completedAt >= monthStart && task.completedAt <= monthEnd)
      .slice(0, 20),
  };
}

