import type { TaskPriority } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { taskPriorityLabels } from "@/lib/labels";

const variants: Record<TaskPriority, "default" | "blue" | "green" | "amber" | "red" | "violet" | "outline"> = {
  BAIXA: "green",
  MEDIA: "blue",
  ALTA: "amber",
  CRITICA: "red",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge variant={variants[priority]}>{taskPriorityLabels[priority]}</Badge>;
}
