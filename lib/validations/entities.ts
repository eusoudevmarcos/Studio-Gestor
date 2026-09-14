import { z } from "zod";
import { accountingActivities, accountingTaxRegimes, brazilianStates } from "@/lib/accounting";
import { closingModules, stepOverrideValues } from "@/lib/closing";

export const userRoles = ["ADMIN", "GESTOR", "COORDENADOR", "COLABORADOR", "CONSULTA"] as const;
export const clientProjectStatuses = ["ATIVO", "INATIVO", "EM_IMPLANTACAO", "PAUSADO", "ENCERRADO"] as const;
export const routineRecurrences = ["UNICA", "DIARIA", "SEMANAL", "MENSAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"] as const;
export const taskStatuses = [
  "PENDENTE",
  "EM_ANDAMENTO",
  "AGUARDANDO_CLIENTE",
  "AGUARDANDO_DOCUMENTO",
  "EM_REVISAO",
  "CONCLUIDO",
  "ATRASADO",
  "CANCELADO",
] as const;
export const taskPriorities = ["BAIXA", "MEDIA", "ALTA", "CRITICA"] as const;

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

// Checkbox com valor padrão verdadeiro quando ausente do formulário.
const checkboxBoolean = z
  .union([z.boolean(), z.literal("true"), z.literal("false"), z.literal("on")])
  .optional()
  .transform((value) => value === undefined || value === true || value === "true" || value === "on");

// Checkbox que só é verdadeiro quando marcado (sem valor = false).
const strictCheckbox = z
  .union([z.boolean(), z.literal("true"), z.literal("false"), z.literal("on"), z.literal("")])
  .optional()
  .transform((value) => value === true || value === "true" || value === "on");

const optionalInteger = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.number().int().min(0).max(100000).optional(),
);

const modulesSchema = z.preprocess((value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value ? value.split(",").filter(Boolean) : [];
  return [];
}, z.array(z.enum(closingModules)));

const stepOverridesSchema = z.preprocess((value) => {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string" || !value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}, z.record(z.string(), z.enum(stepOverrideValues)));

export const segmentSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do segmento"),
  description: optionalString,
  active: checkboxBoolean.default(true),
});

export const departmentSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do setor"),
  description: optionalString,
  segmentId: optionalId,
  active: checkboxBoolean.default(true),
});

export const companySchema = z.object({
  code: optionalString,
  name: z.string().trim().min(2, "Informe o nome da empresa"),
  document: optionalString,
  stateRegistration: optionalString,
  districtRegistration: optionalString,
  status: z.enum(clientProjectStatuses),
  mainResponsibleUserId: optionalId,
  notes: optionalString,
  accountingTaxRegime: z.enum(accountingTaxRegimes, { message: "Selecione o regime" }),
  accountingActivity: z.enum(accountingActivities, { message: "Selecione a atividade" }),
  accountingState: z.enum(brazilianStates, { message: "Selecione a UF" }),
  hasMonthlyMovement: strictCheckbox,
  issuesInvoices: strictCheckbox,
  hasRentalIrrf: strictCheckbox,
  employeesCount: optionalInteger,
  modules: modulesSchema,
  stepOverrides: stepOverridesSchema,
});

export const routineSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da rotina"),
  description: optionalString,
  segmentId: z.string().min(1, "Selecione o segmento"),
  departmentId: z.string().min(1, "Selecione o setor"),
  recurrence: z.enum(routineRecurrences),
  defaultDueDay: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().min(1).max(31).optional(),
  ),
  defaultPriority: z.enum(taskPriorities),
  active: checkboxBoolean.default(true),
});

export const taskSchema = z.object({
  title: z.string().trim().min(2, "Informe o título da tarefa"),
  description: optionalString,
  clientProjectId: optionalId,
  segmentId: optionalId,
  departmentId: z.string().min(1, "Selecione o setor"),
  routineId: optionalId,
  responsibleId: optionalId,
  dueDate: z.coerce.date(),
  status: z.enum(taskStatuses),
  priority: z.enum(taskPriorities),
  internalNotes: optionalString,
});

export const userEditSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  role: z.enum(userRoles),
  departmentId: optionalId,
  active: checkboxBoolean.default(true),
});

export type SegmentInput = z.infer<typeof segmentSchema>;
export type DepartmentInput = z.infer<typeof departmentSchema>;
export type CompanyInput = z.infer<typeof companySchema>;
export type RoutineInput = z.infer<typeof routineSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type UserEditInput = z.infer<typeof userEditSchema>;
