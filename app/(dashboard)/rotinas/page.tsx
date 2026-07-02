import { Play, Plus } from "lucide-react";
import Link from "next/link";
import { PriorityBadge } from "@/components/badges/priority-badge";
import { RoutineFilters } from "@/components/forms/filters";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { generateTaskFromRoutine } from "@/lib/actions/routines";
import { getFormOptions, getRoutines } from "@/lib/data";
import { recurrenceLabels } from "@/lib/labels";
import { type SearchParams, readSearchParams } from "@/lib/search-params";

export default async function RoutinesPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await readSearchParams(searchParams);
  const [routines, options] = await Promise.all([getRoutines(filters), getFormOptions()]);

  return (
    <div className="grid gap-5">
      <PageHeader title="Rotinas" description="Atividades padrão que geram tarefas operacionais." actionHref="/rotinas/nova" actionLabel="Nova rotina" actionIcon={Plus} />
      <RoutineFilters segments={options.segments} departments={options.departments} />
      {routines.length ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Rotina</th>
                <th className="px-4 py-3 text-left">Segmento</th>
                <th className="px-4 py-3 text-left">Setor</th>
                <th className="px-4 py-3 text-left">Recorrência</th>
                <th className="px-4 py-3 text-left">Prioridade</th>
                <th className="px-4 py-3 text-right">Tarefas</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {routines.map((routine) => (
                <tr key={routine.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <Link href={`/rotinas/${routine.id}/editar`} className="font-medium text-sky-800 hover:underline">{routine.name}</Link>
                    <p className="mt-1 text-xs text-slate-500">{routine.description ?? "Sem descrição"}</p>
                  </td>
                  <td className="px-4 py-3">{routine.segment.name}</td>
                  <td className="px-4 py-3">{routine.department.name}</td>
                  <td className="px-4 py-3"><Badge variant="blue">{recurrenceLabels[routine.recurrence]}</Badge></td>
                  <td className="px-4 py-3"><PriorityBadge priority={routine.defaultPriority} /></td>
                  <td className="px-4 py-3 text-right">{routine._count.tasks}</td>
                  <td className="px-4 py-3">
                    <form action={generateTaskFromRoutine.bind(null, routine.id)}>
                      <Button type="submit" variant="outline" size="sm"><Play className="h-4 w-4" />Gerar tarefa</Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Nenhuma rotina encontrada" description="Cadastre rotinas para padronizar tarefas recorrentes." />
      )}
    </div>
  );
}
