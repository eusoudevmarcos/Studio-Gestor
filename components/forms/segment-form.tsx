"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import type { SegmentInput } from "@/lib/validations/entities";
import { segmentSchema } from "@/lib/validations/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, type FormAction, toFormData } from "@/components/forms/form-utils";

type SegmentFormProps = {
  action: FormAction;
  defaultValues?: Partial<SegmentInput>;
};

export function SegmentForm({ action, defaultValues }: SegmentFormProps) {
  const [pending, startTransition] = useTransition();
  const form = useForm<z.input<typeof segmentSchema>, unknown, SegmentInput>({
    resolver: zodResolver(segmentSchema),
    defaultValues: { name: "", description: "", active: true, ...defaultValues },
  });

  function onSubmit(values: SegmentInput) {
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
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" {...form.register("description")} />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...form.register("active")} />
        Segmento ativo
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar segmento
      </Button>
    </form>
  );
}
