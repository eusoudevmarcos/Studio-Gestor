import { Edit, MessageSquare } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DepartmentBadge } from "@/components/badges/department-badge";
import { PriorityBadge } from "@/components/badges/priority-badge";
import { StatusBadge } from "@/components/badges/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/textarea";
import { createTaskComment } from "@/lib/actions/tasks";
import { getTask } from "@/lib/data";
import type { RouteParams } from "@/lib/search-params";
import { formatDate, formatDateTime } from "@/lib/utils";

export default async function TaskDetailPage({ params }: { params: RouteParams<{ id: string }> }) {
  const { id } = await params;
  const task = await getTask(id);

  if (!task) notFound();

  return (
    <div className="grid gap-5">
      <PageHeader title={task.title} description="Detalhamento da tarefa, comentários e histórico de alterações." />
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href={`/tarefas/${task.id}/editar`}><Edit className="h-4 w-4" />Editar</Link>
        </Button>
      </div>

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="grid gap-5">
          <Card>
            <CardHeader><CardTitle>Resumo</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                <DepartmentBadge name={task.department.name} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div><span className="text-sm text-slate-500">Empresa</span><p className="font-medium">{task.clientProject?.name ?? "-"}</p></div>
                <div><span className="text-sm text-slate-500">Responsável</span><p className="font-medium">{task.responsible?.name ?? "-"}</p></div>
                <div><span className="text-sm text-slate-500">Vencimento</span><p className="font-medium">{formatDate(task.dueDate)}</p></div>
                <div><span className="text-sm text-slate-500">Criado por</span><p className="font-medium">{task.createdBy?.name ?? "-"}</p></div>
                <div><span className="text-sm text-slate-500">Concluído em</span><p className="font-medium">{formatDateTime(task.completedAt)}</p></div>
              </div>
              <div><span className="text-sm text-slate-500">Descrição</span><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{task.description ?? "-"}</p></div>
              <div><span className="text-sm text-slate-500">Observações internas</span><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{task.internalNotes ?? "-"}</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Comentários</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <form action={createTaskComment.bind(null, task.id)} className="grid gap-3">
                <Textarea name="text" placeholder="Adicionar comentário" />
                <Button type="submit" className="w-fit"><MessageSquare className="h-4 w-4" />Comentar</Button>
              </form>
              {task.comments.length ? (
                task.comments.map((comment) => (
                  <div key={comment.id} className="rounded-md border border-slate-100 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-sm text-slate-950">{comment.author.name ?? comment.author.email}</strong>
                      <span className="text-xs text-slate-500">{formatDateTime(comment.createdAt)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{comment.text}</p>
                  </div>
                ))
              ) : (
                <EmptyState title="Sem comentários" description="Registre contexto, alinhamentos e pendências da tarefa." />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {task.histories.length ? (
              task.histories.map((history) => (
                <div key={history.id} className="rounded-md border border-slate-100 p-3">
                  <p className="text-sm font-medium text-slate-950">{history.action}</p>
                  <p className="mt-1 text-xs text-slate-500">{history.user?.name ?? "Sistema"} · {formatDateTime(history.createdAt)}</p>
                  {(history.previousValue || history.newValue) ? (
                    <p className="mt-2 text-xs text-slate-600">{history.previousValue ?? "-"} → {history.newValue ?? "-"}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <EmptyState title="Sem histórico" description="Alterações de status, responsável, prazo, prioridade e setor aparecerão aqui." />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
