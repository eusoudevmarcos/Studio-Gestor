import { notFound } from "next/navigation";
import { TaskForm } from "@/components/forms/task-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { updateTask } from "@/lib/actions/tasks";
import { getFormOptions, getTask } from "@/lib/data";
import type { RouteParams } from "@/lib/search-params";
import { toDateInputValue } from "@/lib/utils";

export default async function EditTaskPage({ params }: { params: RouteParams<{ id: string }> }) {
  const { id } = await params;
  const [task, options] = await Promise.all([getTask(id), getFormOptions()]);

  if (!task) notFound();

  return (
    <div className="mx-auto grid max-w-5xl gap-5">
      <PageHeader title="Editar tarefa" description={task.title} />
      <Card>
        <CardContent>
          <TaskForm
            action={updateTask.bind(null, task.id)}
            clients={options.clientProjects}
            segments={options.segments}
            departments={options.departments}
            users={options.users}
            routines={options.routines}
            defaultValues={{
              title: task.title,
              description: task.description ?? "",
              clientProjectId: task.clientProjectId ?? "",
              segmentId: task.segmentId ?? "",
              departmentId: task.departmentId,
              routineId: task.routineId ?? "",
              responsibleId: task.responsibleId ?? "",
              dueDate: toDateInputValue(task.dueDate),
              status: task.status,
              priority: task.priority,
              internalNotes: task.internalNotes ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
