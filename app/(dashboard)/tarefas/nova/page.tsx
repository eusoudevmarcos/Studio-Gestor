import { TaskForm } from "@/components/forms/task-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createTask } from "@/lib/actions/tasks";
import { getFormOptions } from "@/lib/data";

export default async function NewTaskPage() {
  const options = await getFormOptions();

  return (
    <div className="mx-auto grid max-w-5xl gap-5">
      <PageHeader title="Nova tarefa" description="Crie uma entrega manual vinculada a setor, responsável, prazo e cliente/projeto." />
      <Card>
        <CardContent>
          <TaskForm
            action={createTask}
            clients={options.clientProjects}
            segments={options.segments}
            departments={options.departments}
            users={options.users}
            routines={options.routines}
          />
        </CardContent>
      </Card>
    </div>
  );
}
