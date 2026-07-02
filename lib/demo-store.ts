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
import { addDays, addMonths, getDaysInMonth, setDate, startOfDay, subDays } from "date-fns";
import type { AccountingActivity, AccountingInvoiceModel, AccountingTaxRegime } from "@/lib/accounting";
import { isAccountingSegmentName } from "@/lib/accounting";
import {
  fiscalRoutineKeys,
  fiscalRoutineSystemKey,
  getFiscalRoutineTemplates,
  type FiscalRoutineTemplate,
} from "@/lib/fiscal-routines";

const demoStoreDirectory = process.env.VERCEL ? path.join("/tmp", "studio-gestor") : path.join(process.cwd(), ".demo");
const storePath = path.join(demoStoreDirectory, "studio-gestor-data.json");
export const demoOrganizationId = "org-demo";

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

export type DemoClientProject = {
  id: string;
  name: string;
  document: string | null;
  type: ClientProjectType;
  status: ClientProjectStatus;
  notes: string | null;
  accountingTaxRegime: AccountingTaxRegime | null;
  accountingActivity: AccountingActivity | null;
  accountingState: string | null;
  hasMonthlyMovement: boolean | null;
  issuesInvoices: boolean;
  invoiceModels: AccountingInvoiceModel[];
  hasRentalIrrf: boolean;
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

export type DemoStore = {
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
};

const dateKeys = new Set(["createdAt", "updatedAt", "dueDate", "completedAt"]);

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

export function currentFiscalCompetence(date = currentDate()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function fiscalCompetenceLabel(competence: string) {
  const [year, month] = competence.split("-");
  if (!year || !month) return competence;
  return `${month}/${year}`;
}

function dueDateForCompetence(competence: string, defaultDueDay: number | null) {
  if (!defaultDueDay) return addDays(startOfDay(currentDate()), 3);
  const [yearValue, monthValue] = competence.split("-").map(Number);
  if (!yearValue || !monthValue) return nextDueDate(defaultDueDay);

  const dueMonth = new Date(yearValue, monthValue, 1);
  return setDate(dueMonth, Math.min(defaultDueDay, getDaysInMonth(dueMonth)));
}

function defaultInvoiceModelsForActivity(activity: AccountingActivity | null): AccountingInvoiceModel[] {
  if (activity === "COMERCIO") return ["NFE"];
  if (activity === "SERVICO") return ["NFSE_PREFEITURA"];
  if (activity === "COMERCIO_SERVICO") return ["NFE", "NFSE_PREFEITURA"];
  return [];
}

type SpreadsheetAccountingClient = {
  code: string;
  name: string;
  document?: string;
  stateRegistration?: string;
  activity: AccountingActivity;
  state: string;
  sourceState?: string;
  regime: AccountingTaxRegime;
  dwNf?: "S" | "N";
  issuesInvoices: boolean;
  hasRentalIrrf?: boolean;
};

const spreadsheetAccountingClients = [
  {
    code: "15",
    name: "RICO FOOD",
    document: "51186787000169",
    stateRegistration: "12919891",
    activity: "COMERCIO",
    state: "RJ",
    regime: "LUCRO_PRESUMIDO",
    issuesInvoices: false,
  },
  {
    code: "16",
    name: "TONTON FOOD",
    document: "32003671000100",
    stateRegistration: "14956590",
    activity: "COMERCIO",
    state: "RJ",
    regime: "LUCRO_PRESUMIDO",
    issuesInvoices: false,
  },
  {
    code: "17",
    name: "JMR PIZZAS",
    activity: "COMERCIO",
    state: "RJ",
    regime: "SIMPLES_NACIONAL",
    issuesInvoices: false,
  },
  {
    code: "18",
    name: "JMR ESFIRRAS",
    activity: "COMERCIO",
    state: "RJ",
    regime: "SIMPLES_NACIONAL",
    issuesInvoices: false,
  },
  {
    code: "19",
    name: "PIZZA AFB",
    document: "54889722000178",
    stateRegistration: "14622942",
    activity: "COMERCIO",
    state: "RJ",
    regime: "SIMPLES_NACIONAL",
    issuesInvoices: false,
  },
  {
    code: "20",
    name: "TENAZ BOTAFOGO",
    document: "49740190000172",
    stateRegistration: "12791976",
    activity: "COMERCIO",
    state: "RJ",
    regime: "LUCRO_PRESUMIDO",
    issuesInvoices: false,
  },
  {
    code: "21",
    name: "TENAZ NITEROI",
    document: "53337130000180",
    stateRegistration: "14319263",
    activity: "COMERCIO",
    state: "RJ",
    regime: "LUCRO_PRESUMIDO",
    issuesInvoices: false,
  },
  {
    code: "25",
    name: "BLUEFIN",
    document: "52269681000191",
    activity: "COMERCIO",
    state: "RJ",
    regime: "SIMPLES_NACIONAL",
    issuesInvoices: false,
  },
  {
    code: "26",
    name: "MADONE",
    document: "54348997000102",
    activity: "COMERCIO",
    state: "RJ",
    regime: "SIMPLES_NACIONAL",
    issuesInvoices: false,
  },
  {
    code: "27",
    name: "WASSABI",
    document: "52269296000144",
    stateRegistration: "13613630",
    activity: "COMERCIO",
    state: "RJ",
    regime: "LUCRO_PRESUMIDO",
    issuesInvoices: false,
    hasRentalIrrf: true,
  },
  {
    code: "28",
    name: "AHIRU",
    document: "54478120000128",
    activity: "COMERCIO",
    state: "RJ",
    regime: "LUCRO_PRESUMIDO",
    issuesInvoices: false,
  },
  {
    code: "29",
    name: "CAGARRAS",
    document: "49605861000192",
    activity: "COMERCIO",
    state: "RJ",
    regime: "LUCRO_PRESUMIDO",
    issuesInvoices: false,
  },
  {
    code: "30",
    name: "AGPR11",
    document: "49589000000168",
    activity: "COMERCIO",
    state: "RJ",
    regime: "SIMPLES_NACIONAL",
    issuesInvoices: false,
  },
  {
    code: "31",
    name: "CONSERTO JACAREPAGU\u00c1",
    document: "43291752000161",
    activity: "SERVICO",
    state: "RJ",
    regime: "SIMPLES_NACIONAL",
    issuesInvoices: true,
  },
  {
    code: "32",
    name: "MASTER HUMAIT\u00c1",
    document: "39693150000163",
    activity: "SERVICO",
    state: "RJ",
    regime: "SIMPLES_NACIONAL",
    issuesInvoices: true,
  },
  {
    code: "33",
    name: "SOLU\u00c7\u00d5ES GAVEA",
    document: "33654901000156",
    activity: "SERVICO",
    state: "RJ",
    regime: "SIMPLES_NACIONAL",
    issuesInvoices: true,
  },
  {
    code: "34",
    name: "SOLU\u00c7\u00d5ES LEBLON",
    document: "35648050000164",
    activity: "SERVICO",
    state: "RJ",
    regime: "SIMPLES_NACIONAL",
    issuesInvoices: true,
  },
  {
    code: "35",
    name: "ADM SERVI\u00c7OS BH",
    document: "54347682000132",
    activity: "SERVICO",
    state: "MG",
    sourceState: "BH",
    regime: "SIMPLES_NACIONAL",
    issuesInvoices: false,
  },
  {
    code: "36",
    name: "TIJUCA RESTAURANTE",
    document: "62853400000105",
    activity: "COMERCIO",
    state: "RJ",
    regime: "LUCRO_PRESUMIDO",
    issuesInvoices: false,
  },
  {
    code: "37",
    name: "IKURA",
    document: "62561151000176",
    activity: "COMERCIO",
    state: "RJ",
    regime: "SIMPLES_NACIONAL",
    issuesInvoices: false,
  },
  {
    code: "38",
    name: "BOTIES",
    document: "57224242000186",
    activity: "SERVICO",
    state: "DF",
    regime: "SIMPLES_NACIONAL",
    issuesInvoices: false,
  },
  {
    code: "39",
    name: "BAR 80",
    document: "14485611000181",
    activity: "COMERCIO",
    state: "DF",
    regime: "LUCRO_PRESUMIDO",
    issuesInvoices: true,
  },
  {
    code: "41",
    name: "PROTEGEMAIS",
    document: "55684273000194",
    activity: "COMERCIO_SERVICO",
    state: "MS",
    regime: "LUCRO_PRESUMIDO",
    issuesInvoices: false,
  },
  {
    code: "45",
    name: "OXIPOR\u00c3",
    document: "11964180000148",
    activity: "COMERCIO_SERVICO",
    state: "MS",
    regime: "SIMPLES_NACIONAL",
    issuesInvoices: true,
  },
  {
    code: "46",
    name: "VRM GASTRONOMIA",
    document: "42976582000196",
    activity: "COMERCIO",
    state: "MS",
    regime: "LUCRO_PRESUMIDO",
    issuesInvoices: false,
  },
  {
    code: "49",
    name: "BMR BLINDADOS",
    document: "58097988000139",
    activity: "COMERCIO_SERVICO",
    state: "RJ",
    regime: "LUCRO_REAL",
    issuesInvoices: true,
    hasRentalIrrf: true,
  },
  {
    code: "50",
    name: "BLC SERVI\u00c7OS",
    document: "63188864000107",
    activity: "SERVICO",
    state: "RJ",
    regime: "LUCRO_PRESUMIDO",
    issuesInvoices: false,
  },
  {
    code: "51",
    name: "CARLOS ALBERTO PART",
    document: "61778906000126",
    activity: "SERVICO",
    state: "RJ",
    regime: "LUCRO_PRESUMIDO",
    issuesInvoices: false,
  },
  {
    code: "52",
    name: "LETICIA PARTICIP",
    document: "58072219000186",
    activity: "SERVICO",
    state: "RJ",
    regime: "LUCRO_PRESUMIDO",
    issuesInvoices: false,
  },
  {
    code: "53",
    name: "BLUEWAVE BR",
    document: "59057248000131",
    activity: "SERVICO",
    state: "RJ",
    regime: "LUCRO_PRESUMIDO",
    issuesInvoices: false,
  },
  {
    code: "54",
    name: "JUUNTOS PARTICIP",
    document: "59862746000157",
    activity: "COMERCIO_SERVICO",
    state: "RJ",
    regime: "LUCRO_PRESUMIDO",
    issuesInvoices: false,
  },
  {
    code: "55",
    name: "LYCON PARTICIP",
    document: "61281421000122",
    activity: "COMERCIO_SERVICO",
    state: "RJ",
    regime: "LUCRO_PRESUMIDO",
    issuesInvoices: true,
  },
  {
    code: "56",
    name: "YVEL TRANSPORTES",
    document: "55927177000120",
    activity: "COMERCIO_SERVICO",
    state: "RJ",
    regime: "LUCRO_PRESUMIDO",
    issuesInvoices: true,
    hasRentalIrrf: true,
  },
  {
    code: "57",
    name: "ARES MEDICOS",
    document: "66493241000128",
    activity: "SERVICO",
    state: "DF",
    regime: "SIMPLES_NACIONAL",
    dwNf: "N",
    issuesInvoices: false,
  },
  {
    code: "58",
    name: "CENTOLLAS REST",
    document: "64469247000134",
    activity: "COMERCIO",
    state: "SP",
    regime: "LUCRO_PRESUMIDO",
    issuesInvoices: false,
  },
  {
    code: "59",
    name: "UNAGUIS REST",
    document: "63789952000112",
    activity: "COMERCIO",
    state: "SP",
    regime: "SIMPLES_NACIONAL",
    issuesInvoices: false,
  },
  {
    code: "60",
    name: "YLO PARTICIP",
    document: "61513740000116",
    activity: "SERVICO",
    state: "RJ",
    regime: "LUCRO_PRESUMIDO",
    issuesInvoices: false,
  },
  {
    code: "61",
    name: "CASA ARARA",
    document: "62018787000176",
    activity: "COMERCIO",
    state: "RJ",
    regime: "SIMPLES_NACIONAL",
    issuesInvoices: true,
  },
  {
    code: "62",
    name: "T7 SERVI\u00c7OS",
    document: "54362238000196",
    activity: "SERVICO",
    state: "MS",
    regime: "LUCRO_PRESUMIDO",
    issuesInvoices: false,
  },
] satisfies SpreadsheetAccountingClient[];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isOpenTask(status: TaskStatus) {
  return status !== TaskStatus.CONCLUIDO && status !== TaskStatus.CANCELADO;
}

function nextDueDate(defaultDueDay: number | null) {
  const today = startOfDay(currentDate());
  if (!defaultDueDay) return addDays(today, 3);

  const thisMonthDay = Math.min(defaultDueDay, getDaysInMonth(today));
  const thisMonthDueDate = setDate(today, thisMonthDay);
  if (thisMonthDueDate >= today) return thisMonthDueDate;

  const nextMonth = addMonths(today, 1);
  return setDate(nextMonth, Math.min(defaultDueDay, getDaysInMonth(nextMonth)));
}

function appendTaskHistory(
  store: DemoStore,
  taskId: string,
  userId: string | null | undefined,
  action: string,
  newValue: string | null,
  recordHistory: boolean,
) {
  if (!recordHistory) return;

  store.histories.push({
    id: nextDemoId("hist"),
    taskId,
    userId: userId ?? null,
    action,
    previousValue: null,
    newValue,
    createdAt: currentDate(),
  });
}

function getOrCreateFiscalDepartment(store: DemoStore, segmentId: string, organizationId: string, createdAt: Date) {
  const fiscalDepartment = store.departments.find(
    (department) => department.segmentId === segmentId && normalizeText(department.name).includes("fiscal"),
  );

  if (fiscalDepartment) return fiscalDepartment;

  const department: DemoDepartment = {
    id: nextDemoId("dep"),
    name: "Fiscal",
    description: "Setor fiscal.",
    active: true,
    segmentId,
    organizationId,
    createdAt,
    updatedAt: createdAt,
  };
  store.departments.push(department);
  return department;
}

function getOrCreateFiscalRoutine(
  store: DemoStore,
  template: FiscalRoutineTemplate,
  segmentId: string,
  departmentId: string,
  organizationId: string,
  createdAt: Date,
) {
  const systemKey = fiscalRoutineSystemKey(template.key);
  const routine = store.routines.find((item) => item.systemKey === systemKey && item.organizationId === organizationId);

  if (routine) {
    routine.name = template.name;
    routine.description = template.description;
    routine.recurrence = template.recurrence;
    routine.defaultDueDay = template.defaultDueDay;
    routine.defaultPriority = template.defaultPriority;
    routine.active = true;
    routine.segmentId = segmentId;
    routine.departmentId = departmentId;
    routine.updatedAt = createdAt;
    return routine;
  }

  const newRoutine: DemoRoutine = {
    id: nextDemoId("rot"),
    name: template.name,
    description: template.description,
    systemKey,
    recurrence: template.recurrence,
    defaultDueDay: template.defaultDueDay,
    defaultPriority: template.defaultPriority,
    active: true,
    segmentId,
    departmentId,
    organizationId,
    createdAt,
    updatedAt: createdAt,
  };
  store.routines.push(newRoutine);
  return newRoutine;
}

export function syncClientFiscalRoutines(
  store: DemoStore,
  client: DemoClientProject,
  actorId?: string | null,
  options: { recordHistory?: boolean; competence?: string } = {},
) {
  const recordHistory = options.recordHistory ?? true;
  const competence = options.competence ?? currentFiscalCompetence();
  const segment = store.segments.find((item) => item.id === client.segmentId);
  const allFiscalSystemKeys = new Set(fiscalRoutineKeys.map(fiscalRoutineSystemKey));
  const createdAt = currentDate();

  if (!segment || !isAccountingSegmentName(segment.name) || !client.accountingTaxRegime || !client.accountingActivity || !client.accountingState) {
    store.tasks
      .filter((task) => task.clientProjectId === client.id && task.systemKey && allFiscalSystemKeys.has(task.systemKey) && isOpenTask(task.status))
      .forEach((task) => {
        task.status = TaskStatus.CANCELADO;
        task.completedAt = null;
        task.updatedAt = createdAt;
        appendTaskHistory(store, task.id, actorId, "Rotina fiscal cancelada pelo perfil", task.title, recordHistory);
      });
    return;
  }

  const department = getOrCreateFiscalDepartment(store, segment.id, client.organizationId, createdAt);
  const responsible =
    client.mainResponsibleUserId ??
    store.users.find((user) => user.departmentId === department.id && user.active && user.organizationId === client.organizationId)?.id ??
    actorId ??
    null;
  const templates = getFiscalRoutineTemplates(client);
  const wantedSystemKeys = new Set(templates.map((template) => fiscalRoutineSystemKey(template.key)));

  store.tasks
    .filter(
      (task) =>
        task.clientProjectId === client.id &&
        task.competence === competence &&
        task.systemKey &&
        allFiscalSystemKeys.has(task.systemKey) &&
        !wantedSystemKeys.has(task.systemKey) &&
        isOpenTask(task.status),
    )
    .forEach((task) => {
      task.status = TaskStatus.CANCELADO;
      task.completedAt = null;
      task.updatedAt = createdAt;
      appendTaskHistory(store, task.id, actorId, "Rotina fiscal cancelada pelo perfil", task.title, recordHistory);
    });

  templates.forEach((template) => {
    const routine = getOrCreateFiscalRoutine(store, template, segment.id, department.id, client.organizationId, createdAt);
    const systemKey = fiscalRoutineSystemKey(template.key);
    const existingTask = store.tasks.find(
      (task) => task.clientProjectId === client.id && task.systemKey === systemKey && task.competence === competence && isOpenTask(task.status),
    );

    if (existingTask) {
      existingTask.title = template.name;
      existingTask.description = template.description;
      existingTask.dueDate = dueDateForCompetence(competence, template.defaultDueDay);
      existingTask.priority = template.defaultPriority;
      existingTask.departmentId = department.id;
      existingTask.segmentId = segment.id;
      existingTask.routineId = routine.id;
      existingTask.responsibleId = responsible;
      existingTask.updatedAt = createdAt;
      return;
    }

    const taskId = nextDemoId("task");
    store.tasks.push({
      id: taskId,
      title: template.name,
      description: template.description,
      systemKey,
      competence,
      dueDate: dueDateForCompetence(competence, template.defaultDueDay),
      status: TaskStatus.PENDENTE,
      priority: template.defaultPriority,
      internalNotes: "Gerada automaticamente pelo perfil fiscal do cliente.",
      completedAt: null,
      organizationId: client.organizationId,
      clientProjectId: client.id,
      segmentId: segment.id,
      departmentId: department.id,
      routineId: routine.id,
      responsibleId: responsible,
      createdById: actorId ?? null,
      createdAt,
      updatedAt: createdAt,
    });
    appendTaskHistory(store, taskId, actorId, "Rotina fiscal vinculada pelo perfil", template.name, recordHistory);
  });
}

function spreadsheetActivityLabel(activity: AccountingActivity) {
  if (activity === "COMERCIO") return "ICMS";
  if (activity === "SERVICO") return "ISS";
  return "ICMS/ISS";
}

function buildSpreadsheetClientNotes(source: SpreadsheetAccountingClient) {
  const lines = [
    `Codigo planilha: ${source.code}`,
    `ATIV planilha: ${spreadsheetActivityLabel(source.activity)}`,
    `DW NF: ${source.dwNf ?? (source.issuesInvoices ? "S" : "vazio")}`,
  ];

  if (source.stateRegistration) {
    lines.push(`Inscricao estadual: ${source.stateRegistration}`);
  }

  if (source.sourceState && source.sourceState !== source.state) {
    lines.push(`UF planilha: ${source.sourceState} (normalizada para ${source.state})`);
  }

  if (source.hasRentalIrrf) {
    lines.push("REINF: IRRF aluguel");
  }

  lines.push("Origem: planilha de cadastro fiscal.");
  return lines.join("\n");
}

function upsertSpreadsheetAccountingClients(store: DemoStore) {
  const accountingSegment = store.segments.find((segment) => isAccountingSegmentName(segment.name));
  if (!accountingSegment) return;

  const createdAt = currentDate();
  const responsibleId =
    store.users.find((user) => user.id === "user-ana" && user.active && user.organizationId === demoOrganizationId)?.id ??
    store.users.find((user) => user.active && user.organizationId === demoOrganizationId)?.id ??
    null;
  const competence = currentFiscalCompetence();

  spreadsheetAccountingClients.forEach((source) => {
    const id = `cli-planilha-${source.code}`;
    const existing =
      store.clientProjects.find((client) => client.id === id) ??
      store.clientProjects.find(
        (client) =>
          client.organizationId === demoOrganizationId &&
          client.segmentId === accountingSegment.id &&
          normalizeText(client.name) === normalizeText(source.name),
      );
    const invoiceModels = source.issuesInvoices ? defaultInvoiceModelsForActivity(source.activity) : [];
    const client: DemoClientProject =
      existing ??
      ({
        id,
        name: source.name,
        document: source.document ?? null,
        type: ClientProjectType.CLIENTE,
        status: ClientProjectStatus.ATIVO,
        notes: null,
        accountingTaxRegime: source.regime,
        accountingActivity: source.activity,
        accountingState: source.state,
        hasMonthlyMovement: true,
        issuesInvoices: source.issuesInvoices,
        invoiceModels,
        hasRentalIrrf: Boolean(source.hasRentalIrrf),
        mainResponsibleUserId: responsibleId,
        segmentId: accountingSegment.id,
        organizationId: demoOrganizationId,
        createdAt,
        updatedAt: createdAt,
      } satisfies DemoClientProject);

    client.name = source.name;
    client.document = source.document ?? null;
    client.type = ClientProjectType.CLIENTE;
    client.status = ClientProjectStatus.ATIVO;
    client.notes = buildSpreadsheetClientNotes(source);
    client.accountingTaxRegime = source.regime;
    client.accountingActivity = source.activity;
    client.accountingState = source.state;
    client.hasMonthlyMovement = true;
    client.issuesInvoices = source.issuesInvoices;
    client.invoiceModels = invoiceModels;
    client.hasRentalIrrf = Boolean(source.hasRentalIrrf);
    client.mainResponsibleUserId ??= responsibleId;
    client.segmentId = accountingSegment.id;
    client.organizationId = demoOrganizationId;
    client.updatedAt = createdAt;

    if (!existing) {
      store.clientProjects.push(client);
    }

    syncClientFiscalRoutines(store, client, null, { recordHistory: false, competence });
  });
}

function createSeedStore(): DemoStore {
  const createdAt = currentDate();
  const segments: DemoSegment[] = [
    ["seg-contabilidade", "Contabilidade", "Rotinas contábeis, fiscais, folha e societário."],
    ["seg-ti", "Empresa de TI", "Suporte, desenvolvimento, infraestrutura e sucesso do cliente."],
    ["seg-marketing", "Marketing", "Planejamento, conteúdo, design, tráfego e atendimento."],
    ["seg-bpo", "Financeiro/BPO", "Contas a pagar, receber, conciliação e relatórios."],
  ].map(([id, name, description]) => ({
    id,
    name,
    description,
    active: true,
    organizationId: demoOrganizationId,
    createdAt,
    updatedAt: createdAt,
  }));

  const departments: DemoDepartment[] = [
    ["dep-folha", "Folha", "seg-contabilidade"],
    ["dep-fiscal", "Fiscal", "seg-contabilidade"],
    ["dep-suporte", "Suporte", "seg-ti"],
    ["dep-dev", "Desenvolvimento", "seg-ti"],
    ["dep-social", "Social Media", "seg-marketing"],
    ["dep-financeiro", "Conciliação", "seg-bpo"],
  ].map(([id, name, segmentId]) => ({
    id,
    name,
    description: `Setor de ${name}.`,
    active: true,
    segmentId,
    organizationId: demoOrganizationId,
    createdAt,
    updatedAt: createdAt,
  }));

  const users: DemoUser[] = [
    ["user-admin", "Operação Studio", "operacao@studiogestor.local", UserRole.ADMIN, null],
    ["user-ana", "Ana Fiscal", "ana@studiogestor.local", UserRole.COLABORADOR, "dep-fiscal"],
    ["user-bruno", "Bruno Suporte", "bruno@studiogestor.local", UserRole.COLABORADOR, "dep-suporte"],
    ["user-clara", "Clara Marketing", "clara@studiogestor.local", UserRole.COLABORADOR, "dep-social"],
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

  const clientProjects: DemoClientProject[] = [
    ["cli-alfa", "Alfa Contábil Ltda", ClientProjectType.CLIENTE, "seg-contabilidade", "user-ana"],
    ["cli-sprint", "SprintHub Plataforma", ClientProjectType.PROJETO, "seg-ti", "user-bruno"],
    ["cli-campanha", "Campanha Lançamento Q3", ClientProjectType.PROJETO, "seg-marketing", "user-clara"],
    ["cli-atlas", "BPO Financeiro Atlas", ClientProjectType.CLIENTE, "seg-bpo", "user-admin"],
  ].map(([id, name, type, segmentId, mainResponsibleUserId], index) => ({
    id,
    name,
    document: index % 2 === 0 ? `00.000.00${index}/0001-0${index}` : null,
    type,
    status: ClientProjectStatus.ATIVO,
    notes: `Registro de demonstração para ${name}.`,
    accountingTaxRegime: segmentId === "seg-contabilidade" ? "SIMPLES_NACIONAL" : null,
    accountingActivity: segmentId === "seg-contabilidade" ? "COMERCIO_SERVICO" : null,
    accountingState: segmentId === "seg-contabilidade" ? "SP" : null,
    hasMonthlyMovement: segmentId === "seg-contabilidade" ? true : null,
    issuesInvoices: segmentId === "seg-contabilidade",
    invoiceModels: segmentId === "seg-contabilidade" ? ["NFE", "NFSE_PREFEITURA"] : [],
    hasRentalIrrf: segmentId === "seg-contabilidade",
    mainResponsibleUserId,
    segmentId,
    organizationId: demoOrganizationId,
    createdAt,
    updatedAt: createdAt,
  })) as DemoClientProject[];

  const routines: DemoRoutine[] = [
    ["rot-folha", "Fechamento da folha", "seg-contabilidade", "dep-folha", RoutineRecurrence.MENSAL, 5, TaskPriority.ALTA],
    ["rot-xml", "Conferência de XML", "seg-contabilidade", "dep-fiscal", RoutineRecurrence.MENSAL, 12, TaskPriority.MEDIA],
    ["rot-chamado", "Atendimento de chamado", "seg-ti", "dep-suporte", RoutineRecurrence.DIARIA, null, TaskPriority.MEDIA],
    ["rot-deploy", "Deploy", "seg-ti", "dep-dev", RoutineRecurrence.SEMANAL, null, TaskPriority.ALTA],
    ["rot-posts", "Publicação de conteúdo", "seg-marketing", "dep-social", RoutineRecurrence.SEMANAL, null, TaskPriority.MEDIA],
    ["rot-conciliacao", "Conciliação bancária", "seg-bpo", "dep-financeiro", RoutineRecurrence.MENSAL, 10, TaskPriority.ALTA],
  ].map(([id, name, segmentId, departmentId, recurrence, defaultDueDay, defaultPriority]) => ({
    id,
    name,
    description: `Rotina padrão: ${name}.`,
    systemKey: null,
    recurrence,
    defaultDueDay,
    defaultPriority,
    active: true,
    segmentId,
    departmentId,
    organizationId: demoOrganizationId,
    createdAt,
    updatedAt: createdAt,
  })) as DemoRoutine[];

  const taskTemplates = [
    ["Conferir folha da Alfa", "cli-alfa", "seg-contabilidade", "dep-folha", "rot-folha", "user-ana", -2, TaskStatus.ATRASADO, TaskPriority.CRITICA],
    ["Importar XMLs da competência", "cli-alfa", "seg-contabilidade", "dep-fiscal", "rot-xml", "user-ana", 0, TaskStatus.PENDENTE, TaskPriority.ALTA],
    ["Responder chamados críticos", "cli-sprint", "seg-ti", "dep-suporte", "rot-chamado", "user-bruno", 1, TaskStatus.EM_ANDAMENTO, TaskPriority.ALTA],
    ["Deploy homologação sprint", "cli-sprint", "seg-ti", "dep-dev", "rot-deploy", "user-bruno", 3, TaskStatus.EM_REVISAO, TaskPriority.MEDIA],
    ["Publicar calendário editorial", "cli-campanha", "seg-marketing", "dep-social", "rot-posts", "user-clara", 5, TaskStatus.AGUARDANDO_CLIENTE, TaskPriority.MEDIA],
    ["Fechamento financeiro mensal", "cli-atlas", "seg-bpo", "dep-financeiro", "rot-conciliacao", "user-admin", 7, TaskStatus.PENDENTE, TaskPriority.ALTA],
  ] as const;

  const tasks = taskTemplates.map(([title, clientProjectId, segmentId, departmentId, routineId, responsibleId, offset, status, priority], index) => ({
    id: `task-${index + 1}`,
    title,
    description: `Execução operacional de ${title.toLowerCase()}.`,
    systemKey: null,
    competence: null,
    dueDate: offset < 0 ? subDays(currentDate(), Math.abs(offset)) : addDays(currentDate(), offset),
    status: status as TaskStatus,
    priority,
    internalNotes: index % 2 === 0 ? "Validar pendências antes do fechamento." : null,
    completedAt: (status as TaskStatus) === TaskStatus.CONCLUIDO ? currentDate() : null,
    organizationId: demoOrganizationId,
    clientProjectId,
    segmentId,
    departmentId,
    routineId,
    responsibleId,
    createdById: "user-admin",
    createdAt,
    updatedAt: createdAt,
  }));

  return {
    organization: {
      id: demoOrganizationId,
      name: "Studio Gestor Demo",
      slug: "studio-gestor-demo",
      segment: "Multi-segmento",
      createdAt,
      updatedAt: createdAt,
    },
    users,
    segments,
    departments,
    clientProjects,
    routines,
    tasks,
    comments: [
      {
        id: "comment-1",
        taskId: "task-1",
        authorId: "user-ana",
        text: "Cliente ainda precisa enviar conferência de eventos.",
        createdAt,
      },
    ],
    histories: tasks.map((task) => ({
      id: `hist-${task.id}`,
      taskId: task.id,
      userId: "user-admin",
      action: "Tarefa criada no modo local",
      previousValue: null,
      newValue: task.title,
      createdAt,
    })),
  };
}

function normalizeStore(store: DemoStore) {
  const allFiscalSystemKeys = new Set(fiscalRoutineKeys.map(fiscalRoutineSystemKey));

  store.routines.forEach((routine) => {
    routine.systemKey ??= null;
  });

  store.tasks.forEach((task) => {
    task.systemKey ??= null;
    task.competence ??= task.systemKey ? currentFiscalCompetence() : null;
  });

  store.clientProjects.forEach((client) => {
    const segment = store.segments.find((item) => item.id === client.segmentId);
    const isAccounting = isAccountingSegmentName(segment?.name);
    client.accountingTaxRegime ??= isAccounting ? "SIMPLES_NACIONAL" : null;
    client.accountingActivity ??= isAccounting ? "COMERCIO_SERVICO" : null;
    client.accountingState ??= isAccounting ? "SP" : null;
    client.hasMonthlyMovement ??= isAccounting ? true : null;
    client.issuesInvoices ??= Boolean(isAccounting && client.hasMonthlyMovement);
    client.invoiceModels ??= isAccounting && client.issuesInvoices ? defaultInvoiceModelsForActivity(client.accountingActivity) : [];
    client.hasRentalIrrf ??= false;

    const hasFiscalTasks = store.tasks.some(
      (task) => task.clientProjectId === client.id && task.systemKey && allFiscalSystemKeys.has(task.systemKey),
    );
    if (isAccounting && !hasFiscalTasks) {
      syncClientFiscalRoutines(store, client, null, { recordHistory: false });
    }
  });

  upsertSpreadsheetAccountingClients(store);

  return store;
}

export async function getDemoStore() {
  try {
    const raw = await readFile(storePath, "utf8");
    const store = normalizeStore(reviveDates(JSON.parse(raw)) as DemoStore);
    await saveDemoStore(store);
    return store;
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
