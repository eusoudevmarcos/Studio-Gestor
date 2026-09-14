import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  ClientProjectStatus,
  ClientProjectType,
  RoutineRecurrence,
  TaskPriority,
  TaskStatus,
  UserRole,
} from "@prisma/client";
import { addDays, subDays } from "date-fns";
import type { AccountingActivity, AccountingTaxRegime } from "@/lib/accounting";
import { closingModules, type CellStatus, type ClosingModule, type StepOverride } from "@/lib/closing";

const demoStoreDirectory = process.env.VERCEL ? path.join("/tmp", "studio-gestor") : path.join(process.cwd(), ".demo");
const storePath = path.join(demoStoreDirectory, "studio-gestor-data.json");
export const demoOrganizationId = "org-studio";
export const accountingSegmentId = "seg-contabilidade";

// Incrementar quando a estrutura do JSON local mudar de forma incompatível.
// Versões antigas são descartadas e o seed é recriado.
const storeVersion = 2;

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  organizationId: string;
  departmentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DemoSegment = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type DemoDepartment = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  segmentId: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
};

// Empresa cliente do escritório (uma linha da planilha).
export type DemoClientProject = {
  id: string;
  code: string | null;
  name: string;
  document: string | null;
  stateRegistration: string | null;
  districtRegistration: string | null;
  type: ClientProjectType;
  status: ClientProjectStatus;
  notes: string | null;
  accountingTaxRegime: AccountingTaxRegime | null;
  accountingActivity: AccountingActivity | null;
  accountingState: string | null;
  hasMonthlyMovement: boolean | null;
  issuesInvoices: boolean;
  hasRentalIrrf: boolean;
  employeesCount: number | null;
  modules: ClosingModule[];
  stepOverrides: Record<string, StepOverride>;
  mainResponsibleUserId: string | null;
  segmentId: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type DemoRoutine = {
  id: string;
  name: string;
  description: string | null;
  systemKey: string | null;
  recurrence: RoutineRecurrence;
  defaultDueDay: number | null;
  defaultPriority: TaskPriority;
  active: boolean;
  segmentId: string;
  departmentId: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type DemoTask = {
  id: string;
  title: string;
  description: string | null;
  systemKey: string | null;
  competence: string | null;
  dueDate: Date;
  status: TaskStatus;
  priority: TaskPriority;
  internalNotes: string | null;
  completedAt: Date | null;
  organizationId: string;
  clientProjectId: string | null;
  segmentId: string | null;
  departmentId: string;
  routineId: string | null;
  responsibleId: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DemoTaskComment = {
  id: string;
  taskId: string;
  authorId: string;
  text: string;
  createdAt: Date;
};

export type DemoTaskHistory = {
  id: string;
  taskId: string;
  userId: string | null;
  action: string;
  previousValue: string | null;
  newValue: string | null;
  createdAt: Date;
};

// Linha da matriz de fechamento (empresa × módulo × competência).
export type DemoClosingRow = {
  id: string;
  clientProjectId: string;
  module: ClosingModule;
  competence: string;
  noMovement: boolean | null;
  note: string | null;
  updatedById: string | null;
  updatedAt: Date;
};

// Célula da matriz de fechamento. Só existe quando alguém a editou; o restante é derivado do perfil.
export type DemoClosingCell = {
  id: string;
  clientProjectId: string;
  module: ClosingModule;
  competence: string;
  stepKey: string;
  status: CellStatus;
  note: string | null;
  doneAt: Date | null;
  updatedById: string | null;
  updatedAt: Date;
};

export type DemoStore = {
  version: number;
  organization: {
    id: string;
    name: string;
    slug: string;
    segment: string;
    createdAt: Date;
    updatedAt: Date;
  };
  users: DemoUser[];
  segments: DemoSegment[];
  departments: DemoDepartment[];
  clientProjects: DemoClientProject[];
  routines: DemoRoutine[];
  tasks: DemoTask[];
  comments: DemoTaskComment[];
  histories: DemoTaskHistory[];
  closingRows: DemoClosingRow[];
  closingCells: DemoClosingCell[];
};

const dateKeys = new Set(["createdAt", "updatedAt", "dueDate", "completedAt", "doneAt"]);

function reviveDates<T>(value: T): T {
  if (Array.isArray(value)) return value.map(reviveDates) as T;
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      dateKeys.has(key) && typeof entry === "string" ? new Date(entry) : reviveDates(entry),
    ]),
  ) as T;
}

export function nextDemoId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function currentDate() {
  return new Date();
}

function createSeedStore(): DemoStore {
  const createdAt = currentDate();
  const segments: DemoSegment[] = [
    {
      id: accountingSegmentId,
      name: "Contabilidade",
      description: "Rotinas fiscais, folha, contábeis e societárias do escritório.",
      active: true,
      organizationId: demoOrganizationId,
      createdAt,
      updatedAt: createdAt,
    },
  ];

  const departments: DemoDepartment[] = [
    ["dep-fiscal", "Fiscal", "Apuração, guias e obrigações acessórias."],
    ["dep-folha", "Folha", "Fechamento da folha, eSocial, FGTS Digital e INSS."],
    ["dep-contabil", "Contábil", "Lançamentos, conciliação e balancetes."],
    ["dep-societario", "Societário", "Abertura, alteração e baixa de empresas."],
  ].map(([id, name, description]) => ({
    id,
    name,
    description,
    active: true,
    segmentId: accountingSegmentId,
    organizationId: demoOrganizationId,
    createdAt,
    updatedAt: createdAt,
  }));

  const users: DemoUser[] = [
    ["user-admin", "Operação Studio", "operacao@studiogestor.local", UserRole.ADMIN, null],
    ["user-fiscal", "Colaborador Fiscal", "fiscal@studiogestor.local", UserRole.COLABORADOR, "dep-fiscal"],
    ["user-folha", "Colaborador Folha", "folha@studiogestor.local", UserRole.COLABORADOR, "dep-folha"],
  ].map(([id, name, email, role, departmentId]) => ({
    id,
    name,
    email,
    role,
    active: true,
    organizationId: demoOrganizationId,
    departmentId,
    createdAt,
    updatedAt: createdAt,
  })) as DemoUser[];

  const routines: DemoRoutine[] = [
    ["rot-abertura", "Abertura de empresa", "dep-societario", RoutineRecurrence.UNICA, null, TaskPriority.ALTA],
    ["rot-alteracao", "Alteração contratual", "dep-societario", RoutineRecurrence.UNICA, null, TaskPriority.MEDIA],
    ["rot-balancete", "Balancete mensal", "dep-contabil", RoutineRecurrence.MENSAL, 25, TaskPriority.MEDIA],
  ].map(([id, name, departmentId, recurrence, defaultDueDay, defaultPriority]) => ({
    id,
    name,
    description: `Rotina padrão: ${name}.`,
    systemKey: null,
    recurrence,
    defaultDueDay,
    defaultPriority,
    active: true,
    segmentId: accountingSegmentId,
    departmentId,
    organizationId: demoOrganizationId,
    createdAt,
    updatedAt: createdAt,
  })) as DemoRoutine[];

  const tasks: DemoTask[] = [
    {
      id: "task-exemplo-1",
      title: "Revisar cadastro das empresas importadas",
      description: "Conferir regime, atividade, UF e inscrições após importar a planilha.",
      systemKey: null,
      competence: null,
      dueDate: addDays(createdAt, 3),
      status: TaskStatus.PENDENTE,
      priority: TaskPriority.MEDIA,
      internalNotes: null,
      completedAt: null,
      organizationId: demoOrganizationId,
      clientProjectId: null,
      segmentId: accountingSegmentId,
      departmentId: "dep-fiscal",
      routineId: null,
      responsibleId: "user-admin",
      createdById: "user-admin",
      createdAt,
      updatedAt: createdAt,
    },
  ];

  return {
    version: storeVersion,
    organization: {
      id: demoOrganizationId,
      name: "Studio Tax",
      slug: "studio-tax",
      segment: "Contabilidade",
      createdAt: subDays(createdAt, 1),
      updatedAt: createdAt,
    },
    users,
    segments,
    departments,
    clientProjects: [],
    routines,
    tasks,
    comments: [],
    histories: tasks.map((task) => ({
      id: `hist-${task.id}`,
      taskId: task.id,
      userId: "user-admin",
      action: "Tarefa criada no modo local",
      previousValue: null,
      newValue: task.title,
      createdAt,
    })),
    closingRows: [],
    closingCells: [],
  };
}

function normalizeStore(store: DemoStore) {
  store.closingRows ??= [];
  store.closingCells ??= [];

  store.clientProjects.forEach((client) => {
    client.code ??= null;
    client.stateRegistration ??= null;
    client.districtRegistration ??= null;
    client.hasMonthlyMovement ??= true;
    client.issuesInvoices ??= false;
    client.hasRentalIrrf ??= false;
    client.employeesCount ??= null;
    client.modules ??= [...closingModules];
    client.stepOverrides ??= {};
    client.segmentId ??= accountingSegmentId;
  });

  return store;
}

export async function getDemoStore() {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = reviveDates(JSON.parse(raw)) as DemoStore;
    if (parsed.version !== storeVersion) throw new Error("Estrutura antiga do store local.");
    return normalizeStore(parsed);
  } catch {
    const store = normalizeStore(createSeedStore());
    await saveDemoStore(store);
    return store;
  }
}

export async function saveDemoStore(store: DemoStore) {
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

export async function mutateDemoStore<T>(mutator: (store: DemoStore) => T | Promise<T>) {
  const store = await getDemoStore();
  const result = await mutator(store);
  await saveDemoStore(store);
  return result;
}
