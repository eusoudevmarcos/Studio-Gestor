import { Edit, ClipboardList } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DepartmentBadge } from "@/components/badges/department-badge";
import { PriorityBadge } from "@/components/badges/priority-badge";
import { StatusBadge } from "@/components/badges/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  accountingActivityLabels,
  accountingInvoiceModelLabels,
  accountingTaxRegimeLabels,
  getAccountingObligations,
  isAccountingSegmentName,
} from "@/lib/accounting";
import { clientProjectStatusLabels, clientProjectTypeLabels } from "@/lib/labels";
import { getClientProject } from "@/lib/data";
import type { RouteParams } from "@/lib/search-params";
import { formatDate } from "@/lib/utils";

export default async function ClientProjectDetailPage({ params }: { params: RouteParams<{ id: string }> }) {
  const { id } = await params;
  const item = await getClientProject(id);

  if (!item) notFound();
  const isAccounting = isAccountingSegmentName(item.segment?.name);
  const obligations = isAccounting ? getAccountingObligations(item) : [];

  return (
    <div className="grid gap-5">
      <PageHeader title={item.name} description="Detalhamento do cliente/projeto e tarefas relacionadas." />
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href={`/clientes/${item.id}/editar`}><Edit className="h-4 w-4" />Editar</Link>
        </Button>
        <Button asChild>
          <Link href="/tarefas/nova"><ClipboardList className="h-4 w-4" />Nova tarefa</Link>
        </Button>
      </div>
      <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <div className="grid gap-5">
          <Card>
            <CardHeader><CardTitle>Dados gerais</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div><span className="text-slate-500">Tipo</span><p className="font-medium">{clientProjectTypeLabels[item.type]}</p></div>
              <div><span className="text-slate-500">Status</span><p className="font-medium">{clientProjectStatusLabels[item.status]}</p></div>
              <div><span className="text-slate-500">Documento</span><p className="font-medium">{item.document ?? "-"}</p></div>
              <div><span className="text-slate-500">Segmento</span><p className="font-medium">{item.segment?.name ?? "-"}</p></div>
              <div><span className="text-slate-500">Responsável principal</span><p className="font-medium">{item.mainResponsible?.name ?? "-"}</p></div>
              <div><span className="text-slate-500">Criado em</span><p className="font-medium">{formatDate(item.createdAt)}</p></div>
              <div><span className="text-slate-500">Observações</span><p className="font-medium whitespace-pre-wrap">{item.notes ?? "-"}</p></div>
            </CardContent>
          </Card>
          {isAccounting ? (
            <Card>
              <CardHeader><CardTitle>Perfil contábil</CardTitle></CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Regime</span>
                  <p className="font-medium">{item.accountingTaxRegime ? accountingTaxRegimeLabels[item.accountingTaxRegime] : "-"}</p>
                </div>
                <div>
                  <span className="text-slate-500">Atividade</span>
                  <p className="font-medium">{item.accountingActivity ? accountingActivityLabels[item.accountingActivity] : "-"}</p>
                </div>
                <div><span className="text-slate-500">Estado/UF</span><p className="font-medium">{item.accountingState ?? "-"}</p></div>
                <div><span className="text-slate-500">Movimento mensal</span><p className="font-medium">{item.hasMonthlyMovement ? "Sim" : "Não"}</p></div>
                <div><span className="text-slate-500">Emite nota</span><p className="font-medium">{item.issuesInvoices ? "Sim" : "Não"}</p></div>
                <div>
                  <span className="text-slate-500">Modelos de nota</span>
                  <p className="font-medium">
                    {item.invoiceModels.length ? item.invoiceModels.map((model) => accountingInvoiceModelLabels[model]).join(", ") : "-"}
                  </p>
                </div>
                <div><span className="text-slate-500">IRRF de aluguel</span><p className="font-medium">{item.hasRentalIrrf ? "Sim" : "Não"}</p></div>
              </CardContent>
            </Card>
          ) : null}
        </div>
        <Card>
          <CardHeader><CardTitle>{isAccounting ? "Obrigações e tarefas" : "Tarefas vinculadas"}</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {obligations.length ? (
              <div className="rounded-lg border border-sky-100 bg-sky-50/50 p-4">
                <h3 className="text-sm font-semibold text-slate-950">Rotinas sugeridas pelo perfil</h3>
                <ul className="mt-3 grid gap-2 text-sm text-slate-700">
                  {obligations.map((obligation) => (
                    <li key={obligation} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-700" />
                      <span>{obligation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {item.tasks.length ? (
              item.tasks.map((task) => (
                <Link key={task.id} href={`/tarefas/${task.id}`} className="grid gap-3 rounded-md border border-slate-100 p-3 hover:bg-slate-50 md:grid-cols-[1fr_auto]">
                  <div>
                    <p className="font-medium text-slate-950">{task.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{task.responsible?.name ?? "Sem responsável"} · {formatDate(task.dueDate)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <DepartmentBadge name={task.department.name} />
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState title="Sem tarefas vinculadas" description="Crie tarefas para acompanhar entregas deste registro." />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
