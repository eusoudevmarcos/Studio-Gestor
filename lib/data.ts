import { addDays, endOfMonth, endOfWeek, isSameMonth, startOfDay, startOfMonth } from "date-fns";
import type { TaskStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";
import { canViewAllTasks } from "@/lib/permissions";
import { getDemoStore, type DemoClientProject, type DemoStore, type DemoTask } from "@/lib/demo-store";
import { accountingActivityShortLabels, accountingTaxRegimeShortLabels } from "@/lib/accounting";
import {
  closingModules,
  closingSteps,
  competenceLabel,
  defaultCompetence,
  isCompetence,
  isDoneStatus,
  isOpenStatus as isOpenCellStatus,
  resolveStep,
  type ClosingCellView,
  type ClosingModule,
} from "@/lib/closing";

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
  regime?: string;
  state?: string;
  pending?: string;
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

function countBy<T extends string | null>(values: T[]) {
  const map = new Map<T, number>();
  values.forEach((value) => map.set(value, (map.get(value) ?? 0) + 1));
  return [...map.entries()].map(([id, count]) => ({ id, count }));
}

// Ordena como na planilha: pelo código numérico, depois pelo nome.
function compareCompanies(a: DemoClientProject, b: DemoClientProject) {
  const codeA = a.code ? Number(a.code) : Number.POSITIVE_INFINITY;
  const codeB = b.code ? Number(b.code) : Number.POSITIVE_INFINITY;
  if (codeA !== codeB) return codeA - codeB;
  return a.name.localeCompare(b.name);
}

function isActiveCompany(client: DemoClientProject) {
  return ["ATIVO", "EM_IMPLANTACAO"].includes(client.status);
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
      .sort(compareCompanies),
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

/* ---------------------------------------------------------------------------
 * Fechamento por competência (matriz empresa × etapa)
 * ------------------------------------------------------------------------- */

export type ClosingBoardRow = {
  company: {
    id: string;
    code: string | null;
    name: string;
    document: string | null;
    regimeShort: string;
    activityShort: string;
    state: string | null;
    employeesCount: number | null;
    responsibleName: string | null;
  };
  noMovement: boolean | null;
  note: string | null;
  cells: ClosingCellView[];
  applicable: number;
  done: number;
  open: number;
  attention: number;
};

function buildBoardRow(store: DemoStore, client: DemoClientProject, module: ClosingModule, competence: string): ClosingBoardRow {
  const row = store.closingRows.find((item) => item.clientProjectId === client.id && item.module === module && item.competence === competence);
  const storedCells = store.closingCells.filter((item) => item.clientProjectId === client.id && item.module === module && item.competence === competence);

  const cells: ClosingCellView[] = closingSteps[module].map((step) => {
    const resolution = resolveStep(client, module, step.key, competence, { noMovement: row?.noMovement });
    const stored = storedCells.find((cell) => cell.stepKey === step.key);

    if (!resolution.applicable) {
      return {
        stepKey: step.key,
        status: "NAO_APLICA",
        applicable: false,
        isDefault: true,
        note: null,
        doneAt: null,
        reason: resolution.reason,
        updatedByName: null,
        updatedAt: null,
      };
    }

    return {
      stepKey: step.key,
      status: stored?.status ?? resolution.defaultStatus,
      applicable: true,
      isDefault: !stored,
      note: stored?.note ?? null,
      doneAt: stored?.doneAt ?? null,
      flag: resolution.flag,
      reason: resolution.reason,
      updatedByName: stored ? findUser(store, stored.updatedById)?.name ?? null : null,
      updatedAt: stored?.updatedAt ?? null,
    };
  });

  const applicableCells = cells.filter((cell) => cell.applicable);

  return {
    company: {
      id: client.id,
      code: client.code,
      name: client.name,
      document: client.document,
      regimeShort: client.accountingTaxRegime ? accountingTaxRegimeShortLabels[client.accountingTaxRegime] : "-",
      activityShort: client.accountingActivity ? accountingActivityShortLabels[client.accountingActivity] : "-",
      state: client.accountingState,
      employeesCount: client.employeesCount,
      responsibleName: findUser(store, client.mainResponsibleUserId)?.name ?? null,
    },
    noMovement: row?.noMovement ?? null,
    note: row?.note ?? null,
    cells,
    applicable: applicableCells.length,
    done: applicableCells.filter((cell) => isDoneStatus(cell.status)).length,
    open: applicableCells.filter((cell) => cell.status === "PENDENTE").length,
    attention: applicableCells.filter((cell) => cell.status === "ATENCAO").length,
  };
}

export async function getClosingBoard(module: ClosingModule, filters: SearchFilters = {}) {
  const store = await getDemoStore();
  const competence = isCompetence(filters.competence) ? filters.competence : defaultCompetence();
  const companies = store.clientProjects.filter(isActiveCompany).sort(compareCompanies);

  const allRows = companies.map((client) => buildBoardRow(store, client, module, competence));
  const rows = allRows
    .filter((row) => (filters.regime ? store.clientProjects.find((c) => c.id === row.company.id)?.accountingTaxRegime === filters.regime : true))
    .filter((row) => (filters.state ? row.company.state === filters.state : true))
    .filter((row) => (filters.pending === "1" ? row.open + row.attention > 0 : true))
    .filter((row) => includes(row.company.name, filters.q) || includes(row.company.code, filters.q) || includes(row.company.document, filters.q));

  const totals = rows.reduce(
    (acc, row) => ({
      applicable: acc.applicable + row.applicable,
      done: acc.done + row.done,
      open: acc.open + row.open,
      attention: acc.attention + row.attention,
    }),
    { applicable: 0, done: 0, open: 0, attention: 0 },
  );

  return {
    module,
    competence,
    competenceLabel: competenceLabel(competence),
    steps: closingSteps[module],
    rows,
    totalCompanies: companies.length,
    totals: { ...totals, percent: totals.applicable ? Math.round((totals.done / totals.applicable) * 100) : 0 },
    stateOptions: [...new Set(companies.map((client) => client.accountingState).filter(Boolean))].sort() as string[],
  };
}

// Resumo por módulo para o painel.
export async function getClosingSummary(competence = defaultCompetence()) {
  const store = await getDemoStore();
  const companies = store.clientProjects.filter(isActiveCompany).sort(compareCompanies);

  return closingModules.map((module) => {
    const rows = companies.map((client) => buildBoardRow(store, client, module, competence)).filter((row) => row.applicable > 0);
    const totals = rows.reduce(
      (acc, row) => ({
        applicable: acc.applicable + row.applicable,
        done: acc.done + row.done,
        open: acc.open + row.open,
        attention: acc.attention + row.attention,
      }),
      { applicable: 0, done: 0, open: 0, attention: 0 },
    );

    return {
      module,
      competence,
      competenceLabel: competenceLabel(competence),
      companies: rows.length,
      companiesDone: rows.filter((row) => row.open + row.attention === 0).length,
      ...totals,
      percent: totals.applicable ? Math.round((totals.done / totals.applicable) * 100) : 0,
      pendingRows: rows
        .filter((row) => row.open + row.attention > 0)
        .sort((a, b) => b.attention - a.attention || b.open - a.open)
        .slice(0, 8)
        .map((row) => ({
          id: row.company.id,
          code: row.company.code,
          name: row.company.name,
          open: row.open,
          attention: row.attention,
          pendingSteps: row.cells
            .filter((cell) => cell.applicable && isOpenCellStatus(cell.status))
            .map((cell) => closingSteps[module].find((step) => step.key === cell.stepKey)?.label ?? cell.stepKey),
        })),
    };
  });
}

/* ---------------------------------------------------------------------------
 * Empresas
 * ------------------------------------------------------------------------- */

export async function getCompanies(filters: SearchFilters = {}) {
  const store = await getDemoStore();
  return store.clientProjects
    .filter((client) => (filters.status ? client.status === filters.status : true))
    .filter((client) => (filters.regime ? client.accountingTaxRegime === filters.regime : true))
    .filter((client) => (filters.state ? client.accountingState === filters.state : true))
    .filter((client) => includes(client.name, filters.q) || includes(client.document, filters.q) || includes(client.code, filters.q))
    .map((client) => ({
      ...client,
      mainResponsible: findUser(store, client.mainResponsibleUserId),
    }))
    .sort(compareCompanies);
}

export async function getCompany(id: string) {
  const store = await getDemoStore();
  const client = store.clientProjects.find((item) => item.id === id);
  if (!client) return null;

  const competence = defaultCompetence();

  return {
    ...client,
    mainResponsible: findUser(store, client.mainResponsibleUserId),
    competence,
    competenceLabel: competenceLabel(competence),
    closing: closingModules.map((module) => ({ module, row: buildBoardRow(store, client, module, competence) })),
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

/* ---------------------------------------------------------------------------
 * Painel
 * ------------------------------------------------------------------------- */

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
  const responsibleCounts = countBy(
    tasks.filter((task) => task.status === "CONCLUIDO" && task.completedAt && task.completedAt >= monthStart && task.completedAt <= monthEnd).map((task) => task.responsibleId),
  );

  return {
    closing: await getClosingSummary(),
    cards: {
      dueToday: openTasks.filter((task) => task.dueDate >= today && task.dueDate < tomorrow).length,
      overdue: openTasks.filter((task) => task.dueDate < today).length,
      weekTasks: openTasks.filter((task) => task.dueDate >= today && task.dueDate <= weekEnd).length,
      completedThisMonth: tasks.filter((task) => task.status === "CONCLUIDO" && task.completedAt && isSameMonth(task.completedAt, today)).length,
      activeCompanies: store.clientProjects.filter(isActiveCompany).length,
    },
    nextTasks: openTasks.slice(0, 6),
    departmentRows: departmentCounts.map((row) => ({ name: findDepartment(store, row.id).name, count: row.count })),
    responsibleRows: responsibleCounts.map((row) => ({ name: findUser(store, row.id)?.name ?? "Sem responsável", count: row.count })),
  };
}

/* ---------------------------------------------------------------------------
 * Segmentos, setores, rotinas e tarefas
 * ------------------------------------------------------------------------- */

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
    byResponsible: countBy(tasks.map((task) => task.responsibleId)).map((row) => ({ name: findUser(store, row.id)?.name ?? "Sem responsável", count: row.count })),
    overdueByClient: countBy(openTasks.filter((task) => task.dueDate < today).map((task) => task.clientProjectId)).map((row) => ({
      name: findClient(store, row.id)?.name ?? "Sem empresa",
      count: row.count,
    })),
    completedThisMonth: tasks
      .filter((task) => task.status === "CONCLUIDO" && task.completedAt && task.completedAt >= monthStart && task.completedAt <= monthEnd)
      .slice(0, 20),
  };
}
