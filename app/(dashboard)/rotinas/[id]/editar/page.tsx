import { notFound } from "next/navigation";
import { RoutineForm } from "@/components/forms/routine-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { updateRoutine } from "@/lib/actions/routines";
import { getFormOptions, getRoutine } from "@/lib/data";
import type { RouteParams } from "@/lib/search-params";

export default async function EditRoutinePage({ params }: { params: RouteParams<{ id: string }> }) {
  const { id } = await params;
  const [routine, options] = await Promise.all([getRoutine(id), getFormOptions()]);

  if (!routine) notFound();

  return (
    <div className="mx-auto grid max-w-4xl gap-5">
      <PageHeader title="Editar rotina" description={routine.name} />
      <Card>
        <CardContent>
          <RoutineForm
            action={updateRoutine.bind(null, routine.id)}
            segments={options.segments}
            departments={options.departments}
            defaultValues={{
              name: routine.name,
              description: routine.description ?? "",
              segmentId: routine.segmentId,
              departmentId: routine.departmentId,
              recurrence: routine.recurrence,
              defaultDueDay: routine.defaultDueDay ?? undefined,
              defaultPriority: routine.defaultPriority,
              active: routine.active,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
