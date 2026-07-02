"use client";

import type { TaskStatus } from "@prisma/client";
import { useTransition } from "react";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { taskStatusLabels } from "@/lib/labels";
import { taskStatuses } from "@/lib/validations/entities";
import { Select } from "@/components/ui/select";

export function TaskStatusControl({ id, status }: { id: string; status: TaskStatus }) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      aria-label="Alterar status"
      defaultValue={status}
      disabled={pending}
      onChange={(event) => {
        const nextStatus = event.target.value as TaskStatus;
        startTransition(() => {
          void updateTaskStatus(id, nextStatus);
        });
      }}
      className="h-9 min-w-44"
    >
      {taskStatuses.map((item) => (
        <option key={item} value={item}>{taskStatusLabels[item]}</option>
      ))}
    </Select>
  );
}
