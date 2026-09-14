"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { taskPriorityLabels, taskStatusLabels } from "@/lib/labels";
import type { TaskInput } from "@/lib/validations/entities";
import { taskPriorities, taskSchema, taskStatuses } from "@/lib/validations/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, type FormAction, toFormData } from "@/components/forms/form-utils";

type Option = { id: string; name: string | null; email?: string; code?: string | null };

type TaskFormProps = {
  action: FormAction;
  clients: Option[];
  departments: Option[];
  users: Option[];
  defaultValues?: Partial<Omit<TaskInput, "dueDate">> & { dueDate?: string | Date };
};

export function TaskForm({ action, clients, departments, users, defaultValues }: TaskFormProps) {
  const [pending, startTransition] = useTransition();
  const form = useForm<z.input<typeof taskSchema>, unknown, TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      clientProjectId: "",
      departmentId: "",
      responsibleId: "",
      dueDate: new Date(),
      status: "PENDENTE",
      priority: "MEDIA",
      internalNotes: "",
      ...defaultValues,
    } as TaskInput,
  });

  function onSubmit(values: TaskInput) {
    startTransition(() => {
      void action(toFormData(values));
    });
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" {...form.register("title")} />
          <FieldError message={form.formState.errors.title?.message} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="clientProjectId">Empresa</Label>
          <Select id="clientProjectId" {...form.register("clientProjectId")}>
            <option value="">Sem vínculo</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.code ? `${client.code} · ` : ""}{client.name}</option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="departmentId">Setor</Label>
          <Select id="departmentId" {...form.register("departmentId")}>
            <option value="">Selecione</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </Select>
          <FieldError message={form.formState.errors.departmentId?.message} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="responsibleId">Responsável</Label>
          <Select id="responsibleId" {...form.register("responsibleId")}>
            <option value="">Sem responsável</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.name ?? user.email}</option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="dueDate">Vencimento</Label>
          <Input id="dueDate" type="date" {...form.register("dueDate")} />
          <FieldError message={form.formState.errors.dueDate?.message} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <Select id="status" {...form.register("status")}>
            {taskStatuses.map((status) => (
              <option key={status} value={status}>{taskStatusLabels[status]}</option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="priority">Prioridade</Label>
          <Select id="priority" {...form.register("priority")}>
            {taskPriorities.map((priority) => (
              <option key={priority} value={priority}>{taskPriorityLabels[priority]}</option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" {...form.register("description")} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="internalNotes">Observações internas</Label>
        <Textarea id="internalNotes" {...form.register("internalNotes")} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar tarefa
      </Button>
    </form>
  );
}
