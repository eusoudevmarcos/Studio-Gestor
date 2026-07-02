"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import type { DepartmentInput } from "@/lib/validations/entities";
import { departmentSchema } from "@/lib/validations/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, type FormAction, toFormData } from "@/components/forms/form-utils";

type Option = { id: string; name: string };

type DepartmentFormProps = {
  action: FormAction;
  segments: Option[];
  defaultValues?: Partial<DepartmentInput>;
};

export function DepartmentForm({ action, segments, defaultValues }: DepartmentFormProps) {
  const [pending, startTransition] = useTransition();
  const form = useForm<z.input<typeof departmentSchema>, unknown, DepartmentInput>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: "", description: "", segmentId: "", active: true, ...defaultValues },
  });

  function onSubmit(values: DepartmentInput) {
    startTransition(() => {
      void action(toFormData(values));
    });
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...form.register("name")} />
        <FieldError message={form.formState.errors.name?.message} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="segmentId">Segmento</Label>
        <Select id="segmentId" {...form.register("segmentId")}>
          <option value="">Sem segmento fixo</option>
          {segments.map((segment) => (
            <option key={segment.id} value={segment.id}>{segment.name}</option>
          ))}
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" {...form.register("description")} />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...form.register("active")} />
        Setor ativo
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar setor
      </Button>
    </form>
  );
}
