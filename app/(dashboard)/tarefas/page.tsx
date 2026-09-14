import { Plus } from "lucide-react";
import Link from "next/link";
import { DepartmentBadge } from "@/components/badges/department-badge";
import { PriorityBadge } from "@/components/badges/priority-badge";
import { StatusBadge } from "@/components/badges/status-badge";
import { TaskFilters } from "@/components/forms/filters";
import { TaskStatusControl } from "@/components/forms/task-status-control";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getFormOptions, getTasks } from "@/lib/data";
import { type SearchParams, readSearchParams } from "@/lib/search-params";
import { formatDate, isOverdue } from "@/lib/utils";

export default async function TasksPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await readSearchParams(searchParams);
  const [tasks, options] = await Promise.all([getTasks(filters), getFormOptions()]);

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Tarefas avulsas"
        description="Demandas fora da rotina fixa: responsável, prazo, status e prioridade."
        actionHref="/tarefas/nova"
        actionLabel="Nova tarefa"
        actionIcon={Plus}
      />
      <TaskFilters departments={options.departments} users={options.users} clients={options.clientProjects} />
      {tasks.length ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Tarefa</th>
                <th className="px-4 py-3 text-left">Empresa</th>
                <th className="px-4 py-3 text-left">Setor</th>
                <th className="px-4 py-3 text-left">Responsável</th>
                <th className="px-4 py-3 text-left">Vencimento</th>
                <th className="px-4 py-3 text-left">Prioridade</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Ação rápida</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <Link href={`/tarefas/${task.id}`} className="font-medium text-sky-800 hover:underline">{task.title}</Link>
                  </td>
                  <td className="px-4 py-3">{task.clientProject?.name ?? "-"}</td>
                  <td className="px-4 py-3"><DepartmentBadge name={task.department.name} /></td>
                  <td className="px-4 py-3">{task.responsible?.name ?? "-"}</td>
                  <td className={isOverdue(task.dueDate, task.status) ? "px-4 py-3 font-semibold text-rose-700" : "px-4 py-3 text-slate-700"}>
                    {formatDate(task.dueDate)}
                  </td>
                  <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                  <td className="px-4 py-3">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-4 py-3"><TaskStatusControl id={task.id} status={task.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Nenhuma tarefa encontrada" description="Crie uma tarefa avulsa ou ajuste os filtros." />
      )}
    </div>
  );
}
