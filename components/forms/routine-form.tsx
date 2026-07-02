"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { recurrenceLabels, taskPriorityLabels } from "@/lib/labels";
import type { RoutineInput } from "@/lib/validations/entities";
import { routineRecurrences, routineSchema, taskPriorities } from "@/lib/validations/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, type FormAction, toFormData } from "@/components/forms/form-utils";

type Option = { id: string; name: string };

type RoutineFormProps = {
  action: FormAction;
  segments: Option[];
  departments: Option[];
  defaultValues?: Partial<RoutineInput>;
};

export function RoutineForm({ action, segments, departments, defaultValues }: RoutineFormProps) {
  const [pending, startTransition] = useTransition();
  const form = useForm<z.input<typeof routineSchema>, unknown, RoutineInput>({
    resolver: zodResolver(routineSchema),
    defaultValues: {
      name: "",
      description: "",
      segmentId: "",
      departmentId: "",
      recurrence: "MENSAL",
      defaultDueDay: undefined,
      defaultPriority: "MEDIA",
      active: true,
      ...defaultValues,
    },
  });

  function onSubmit(values: RoutineInput) {
    startTransition(() => {
      void action(toFormData(values));
    });
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" {...form.register("name")} />
          <FieldError message={form.formState.errors.name?.message} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="segmentId">Segmento</Label>
          <Select id="segmentId" {...form.register("segmentId")}>
            <option value="">Selecione</option>
            {segments.map((segment) => (
              <option key={segment.id} value={segment.id}>{segment.name}</option>
            ))}
          </Select>
          <FieldError message={form.formState.errors.segmentId?.message} />
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
          <Label htmlFor="recurrence">Recorrência</Label>
          <Select id="recurrence" {...form.register("recurrence")}>
            {routineRecurrences.map((recurrence) => (
              <option key={recurrence} value={recurrence}>{recurrenceLabels[recurrence]}</option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="defaultDueDay">Dia padrão de vencimento</Label>
          <Input id="defaultDueDay" type="number" min={1} max={31} {...form.register("defaultDueDay")} />
          <FieldError message={form.formState.errors.defaultDueDay?.message} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="defaultPriority">Prioridade padrão</Label>
          <Select id="defaultPriority" {...form.register("defaultPriority")}>
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
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...form.register("active")} />
        Rotina ativa
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar rotina
      </Button>
    </form>
  );
}
