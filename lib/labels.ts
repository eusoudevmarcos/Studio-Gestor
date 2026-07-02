import type {
  ClientProjectStatus,
  ClientProjectType,
  RoutineRecurrence,
  TaskPriority,
  TaskStatus,
  UserRole,
} from "@prisma/client";

export const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  GESTOR: "Gestor",
  COORDENADOR: "Coordenador",
  COLABORADOR: "Colaborador",
  CONSULTA: "Consulta",
};

export const clientProjectTypeLabels: Record<ClientProjectType, string> = {
  CLIENTE: "Cliente",
  PROJETO: "Projeto",
  EMPRESA: "Empresa",
  CANDIDATO: "Candidato",
  PROCESSO: "Processo",
  OUTRO: "Outro",
};

export const clientProjectStatusLabels: Record<ClientProjectStatus, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  EM_IMPLANTACAO: "Em implantação",
  PAUSADO: "Pausado",
  ENCERRADO: "Encerrado",
};

export const recurrenceLabels: Record<RoutineRecurrence, string> = {
  UNICA: "Única",
  DIARIA: "Diária",
  SEMANAL: "Semanal",
  MENSAL: "Mensal",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO_CLIENTE: "Aguardando cliente",
  AGUARDANDO_DOCUMENTO: "Aguardando documento",
  EM_REVISAO: "Em revisão",
  CONCLUIDO: "Concluído",
  ATRASADO: "Atrasado",
  CANCELADO: "Cancelado",
};

export const taskPriorityLabels: Record<TaskPriority, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  CRITICA: "Crítica",
};
