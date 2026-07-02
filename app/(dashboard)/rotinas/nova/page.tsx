import { RoutineForm } from "@/components/forms/routine-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createRoutine } from "@/lib/actions/routines";
import { getFormOptions } from "@/lib/data";

export default async function NewRoutinePage() {
  const options = await getFormOptions();

  return (
    <div className="mx-auto grid max-w-4xl gap-5">
      <PageHeader title="Nova rotina" description="Defina uma atividade padrão para gerar tarefas e controlar recorrência." />
      <Card><CardContent><RoutineForm action={createRoutine} segments={options.segments} departments={options.departments} /></CardContent></Card>
    </div>
  );
}
