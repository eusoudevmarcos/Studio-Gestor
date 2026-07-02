import type { TaskStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { taskStatusLabels } from "@/lib/labels";

const variants: Record<TaskStatus, "default" | "blue" | "green" | "amber" | "red" | "violet" | "outline"> = {
  PENDENTE: "default",
  EM_ANDAMENTO: "blue",
  AGUARDANDO_CLIENTE: "amber",
  AGUARDANDO_DOCUMENTO: "amber",
  EM_REVISAO: "violet",
  CONCLUIDO: "green",
  ATRASADO: "red",
  CANCELADO: "outline",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={variants[status]}>{taskStatusLabels[status]}</Badge>;
}
