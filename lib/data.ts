import { addDays, endOfWeek, isSameMonth, startOfDay } from "date-fns";
import type { ClientProject, ClosingCell, ClosingRow, Prisma, User } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";
import { canViewAllTasks } from "@/lib/permissions";
import { prisma } from "@/lib/prisma/client";
import { accountingActivityShortLabels, accountingTaxRegimeShortLabels } from "@/lib/accounting";
import { toProfile } from "@/lib/closing-profile";
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
  departmentId?: string;
  responsibleId?: string;
  clientProjectId?: string;
  competence?: string;
  regime?: string;
  state?: string;
  pending?: string;
};

const activeStatuses = ["ATIVO", "EM_IMPLANTACAO"] as const;

function isOpenTaskStatus(status: string) {
  return !["CONCLUIDO", "CANCELADO"].includes(status);
}

// Ordena como na planilha: pelo código numérico, depois pelo nome.
function compareCompanies(a: Pick<ClientProject, "code" | "name">, b: Pick<ClientProject, "code" | "name">) {
  const codeA = a.code ? Number(a.code) : Number.POSITIVE_INFINITY;
  const codeB = b.code ? Number(b.code) : Number.POSITIVE_INFINITY;
  if (codeA !== codeB) return codeA - codeB;
  return a.name.localeCompare(b.name);
}

export async function getCurrentContext() {
  const user = await requireUser();
  return { user, organizationId: user.organizationId };
}

export function getTaskScope(user: Awaited<ReturnType<typeof requireUser>>) {
  return canViewAllTasks(user.role) ? {} : { responsibleId: user.id };
}

export async function getFormOptions() {
  const { organizationId } = await getCurrentContext();
  const [departments, users, clientProjects] = await Promise.all([
    prisma.department.findMany({ where: { organizationId, active: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { organizationId, active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true } }),
    prisma.clientProject.findMany({ where: { organizationId }, select: { id: true, name: true, code: true } }),
  ]);

  return { departments, users, clientProjects: clientProjects.sort(compareCompanies) };
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

type BoardSource = {
  rows: ClosingRow[];
  cells: ClosingCell[];
  users: Map<string, Pick<User, "id" | "name">>;
};

function buildBoardRow(client: ClientProject, module: ClosingModule, competence: string, source: BoardSource): ClosingBoardRow {
  const profile = toProfile(client);
  const row = source.rows.find((item) => item.clientProjectId === client.id && item.module === module);
  const storedCells = source.cells.filter((item) => item.clientProjectId === client.id && item.module === module);

  const cells: ClosingCellView[] = closingSteps[module].map((step) => {
    const resolution = resolveStep(profile, module, step.key, competence, { noMovement: row?.noMovement });
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
      updatedByName: stored?.updatedById ? source.users.get(stored.updatedById)?.name ?? null : null,
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
      responsibleName: client.mainResponsibleUserId ? source.users.get(client.mainResponsibleUserId)?.name ?? null : null,
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

async function loadBoardSource(organizationId: string, competence: string, module?: ClosingModule): Promise<BoardSource> {
  const where = { organizationId, competence, ...(module ? { module } : {}) };
  const [rows, cells, users] = await Promise.all([
    prisma.closingRow.findMany({ where }),
    prisma.closingCell.findMany({ where }),
    prisma.user.findMany({ where: { organizationId }, select: { id: true, name: true } }),
  ]);
  return { rows, cells, users: new Map(users.map((user) => [user.id, user])) };
}

function sumTotals(rows: ClosingBoardRow[]) {
  const totals = rows.reduce(
    (acc, row) => ({
      applicable: acc.applicable + row.applicable,
      done: acc.done + row.done,
      open: acc.open + row.open,
      attention: acc.attention + row.attention,
    }),
    { applicable: 0, done: 0, open: 0, attention: 0 },
  );
  return { ...totals, percent: totals.applicable ? Math.round((totals.done / totals.applicable) * 100) : 0 };
}

export async function getClosingBoard(module: ClosingModule, filters: SearchFilters = {}) {
  const { organizationId } = await getCurrentContext();
  const competence = isCompetence(filters.competence) ? filters.competence : defaultCompetence();
  const [companies, source] = await Promise.all([
    prisma.clientProject.findMany({ where: { organizationId, status: { in: [...activeStatuses] } } }),
    loadBoardSource(organizationId, competence, module),
  ]);
  companies.sort(compareCompanies);

  const query = filters.q?.toLowerCase();
  const rows = companies
    .filter((client) => (filters.regime ? client.accountingTaxRegime === filters.regime : true))
    .filter((client) => (filters.state ? client.accountingState === filters.state : true))
    .filter((client) => {
      if (!query) return true;
      return [client.name, client.code, client.document].some((value) => (value ?? "").toLowerCase().includes(query));
    })
    .map((client) => buildBoardRow(client, module, competence, source))
    .filter((row) => (filters.pending === "1" ? row.open + row.attention > 0 : true));

  return {
    module,
    competence,
    competenceLabel: competenceLabel(competence),
    steps: closingSteps[module],
    rows,
    totalCompanies: companies.length,
    totals: sumTotals(rows),
    stateOptions: [...new Set(companies.map((client) => client.accountingState).filter((state): state is string => Boolean(state)))].sort(),
  };
}

// Resumo por módulo para o painel.
export async function getClosingSummary(competence = defaultCompetence()) {
  const { organizationId } = await getCurrentContext();
  const [companies, source] = await Promise.all([
    prisma.clientProject.findMany({ where: { organizationId, status: { in: [...activeStatuses] } } }),
    loadBoardSource(organizationId, competence),
  ]);
  companies.sort(compareCompanies);

  return closingModules.map((module) => {
    const rows = companies.map((client) => buildBoardRow(client, module, competence, source)).filter((row) => row.applicable > 0);

    return {
      module,
      competence,
      competenceLabel: competenceLabel(competence),
      companies: rows.length,
      companiesDone: rows.filter((row) => row.open + row.attention === 0).length,
      ...sumTotals(rows),
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
  const { organizationId } = await getCurrentContext();
  const where: Prisma.ClientProjectWhereInput = { organizationId };
  if (filters.status) where.status = filters.status as ClientProject["status"];
  if (filters.regime) where.accountingTaxRegime = filters.regime as ClientProject["accountingTaxRegime"];
  if (filters.state) where.accountingState = filters.state;
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { document: { contains: filters.q.replace(/\D/g, "") || filters.q } },
      { code: { equals: filters.q.trim() } },
    ];
  }

  const items = await prisma.clientProject.findMany({ where, include: { mainResponsible: { select: { id: true, name: true } } } });
  return items.sort(compareCompanies);
}

export async function getCompany(id: string) {
  const { organizationId } = await getCurrentContext();
  const client = await prisma.clientProject.findFirst({
    where: { id, organizationId },
    include: {
      mainResponsible: { select: { id: true, name: true } },
      tasks: {
        include: { department: true, responsible: { select: { id: true, name: true } } },
        orderBy: { dueDate: "asc" },
      },
    },
  });
  if (!client) return null;

  const competence = defaultCompetence();
  const source = await loadBoardSource(organizationId, competence);

  return {
    ...client,
    stepOverrides: toProfile(client).stepOverrides,
    competence,
    competenceLabel: competenceLabel(competence),
    closing: closingModules.map((module) => ({ module, row: buildBoardRow(client, module, competence, source) })),
  };
}

/* ---------------------------------------------------------------------------
 * Tarefas avulsas
 * ------------------------------------------------------------------------- */

const taskInclude = {
  clientProject: { select: { id: true, name: true, code: true } },
  department: true,
  responsible: { select: { id: true, name: true, email: true } },
} satisfies Prisma.TaskInclude;

function taskWhere(organizationId: string, filters: SearchFilters = {}): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = { organizationId };
  if (filters.status) where.status = filters.status as Prisma.TaskWhereInput["status"];
  if (filters.departmentId) where.departmentId = filters.departmentId;
  if (filters.responsibleId) where.responsibleId = filters.responsibleId;
  if (filters.clientProjectId) where.clientProjectId = filters.clientProjectId;
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { clientProject: { name: { contains: filters.q, mode: "insensitive" } } },
    ];
  }
  return where;
}

export async function getTasks(filters: SearchFilters = {}) {
  const { organizationId } = await getCurrentContext();
  return prisma.task.findMany({ where: taskWhere(organizationId, filters), include: taskInclude, orderBy: { dueDate: "asc" } });
}

export async function getTask(id: string) {
  const { organizationId } = await getCurrentContext();
  return prisma.task.findFirst({
    where: { id, organizationId },
    include: {
      ...taskInclude,
      createdBy: { select: { id: true, name: true } },
      comments: { include: { author: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" } },
      histories: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getCalendarBuckets() {
  const tasks = await getTasks();
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const nextWeekEnd = addDays(weekEnd, 7);

  return {
    overdue: tasks.filter((task) => task.dueDate < today && isOpenTaskStatus(task.status)),
    today: tasks.filter((task) => task.dueDate >= today && task.dueDate < tomorrow),
    tomorrow: tasks.filter((task) => task.dueDate >= tomorrow && task.dueDate < addDays(tomorrow, 1)),
    thisWeek: tasks.filter((task) => task.dueDate >= addDays(tomorrow, 1) && task.dueDate <= weekEnd),
    nextWeek: tasks.filter((task) => task.dueDate > weekEnd && task.dueDate <= nextWeekEnd),
    future: tasks.filter((task) => task.dueDate > nextWeekEnd),
  };
}

/* ---------------------------------------------------------------------------
 * Painel e equipe
 * ------------------------------------------------------------------------- */

export async function getDashboardData() {
  const { organizationId } = await getCurrentContext();
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const [closing, tasks, activeCompanies, departments] = await Promise.all([
    getClosingSummary(),
    prisma.task.findMany({ where: { organizationId }, include: taskInclude, orderBy: { dueDate: "asc" } }),
    prisma.clientProject.count({ where: { organizationId, status: { in: [...activeStatuses] } } }),
    prisma.department.findMany({ where: { organizationId } }),
  ]);
  const openTasks = tasks.filter((task) => isOpenTaskStatus(task.status));
  const completedThisMonth = tasks.filter((task) => task.status === "CONCLUIDO" && task.completedAt && isSameMonth(task.completedAt, today));

  const countBy = (values: (string | null)[]) => {
    const map = new Map<string | null, number>();
    values.forEach((value) => map.set(value, (map.get(value) ?? 0) + 1));
    return [...map.entries()];
  };

  return {
    closing,
    cards: {
      dueToday: openTasks.filter((task) => task.dueDate >= today && task.dueDate < tomorrow).length,
      overdue: openTasks.filter((task) => task.dueDate < today).length,
      weekTasks: openTasks.filter((task) => task.dueDate >= today && task.dueDate <= weekEnd).length,
      completedThisMonth: completedThisMonth.length,
      activeCompanies,
    },
    nextTasks: openTasks.slice(0, 6),
    departmentRows: countBy(openTasks.map((task) => task.departmentId)).map(([id, count]) => ({
      name: departments.find((department) => department.id === id)?.name ?? "Sem setor",
      count,
    })),
    responsibleRows: countBy(completedThisMonth.map((task) => task.responsibleId)).map(([id, count]) => ({
      name: completedThisMonth.find((task) => task.responsibleId === id)?.responsible?.name ?? "Sem responsável",
      count,
    })),
  };
}

export async function getTeam() {
  const { organizationId } = await getCurrentContext();
  const users = await prisma.user.findMany({
    where: { organizationId },
    include: { department: true, _count: { select: { responsibleTasks: true } } },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
  return users;
}

