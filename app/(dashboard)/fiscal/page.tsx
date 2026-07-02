import { CheckCircle2, RefreshCw, RotateCcw, Search, XCircle } from "lucide-react";
import Link from "next/link";
import { DepartmentBadge } from "@/components/badges/department-badge";
import { StatusBadge } from "@/components/badges/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { generateFiscalCompetence, updateFiscalClientTasksStatus, updateFiscalTaskStatus } from "@/lib/actions/fiscal";
import { currentFiscalCompetence } from "@/lib/demo-store";
import { getFiscalCompetenceData } from "@/lib/data";
import { taskStatusLabels } from "@/lib/labels";
import { readSearchParams, type SearchParams } from "@/lib/search-params";
import { formatDate, isOverdue } from "@/lib/utils";
import { taskStatuses } from "@/lib/validations/entities";

function normalizeCompetence(value?: string) {
  return value && /^\d{4}-\d{2}$/.test(value) ? value : currentFiscalCompetence();
}

export default async function FiscalPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await readSearchParams(searchParams);
  const competence = normalizeCompetence(params.competence);
  const status = params.status;
  const clientProjectId = params.clientProjectId;
  const overdue = params.overdue === "true";
  const q = params.q ?? "";
  const sort = params.sort ?? "";
  const data = await getFiscalCompetenceData(competence, { q, sort, status, clientProjectId, overdue });

  const filterHiddenInputs = (
    <>
      {overdue ? <input type="hidden" name="overdue" value="true" /> : null}
      {q ? <input type="hidden" name="q" value={q} /> : null}
      {sort ? <input type="hidden" name="sort" value={sort} /> : null}
      {status ? <input type="hidden" name="filterStatus" value={status} /> : null}
    </>
  );

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Fiscal mensal"
        description="Controle por competência das rotinas fiscais geradas a partir do perfil contábil dos clientes."
      />

      <Card>
        <CardContent className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
          <form action="/fiscal" className="grid gap-3 md:grid-cols-[160px_220px_170px_170px_1fr_auto] md:items-end">
            <div className="grid gap-2">
              <label htmlFor="competence" className="text-sm font-medium text-slate-700">Competência</label>
              <Input id="competence" name="competence" type="month" defaultValue={competence} />
            </div>
            <div className="grid gap-2">
              <label htmlFor="clientProjectId" className="text-sm font-medium text-slate-700">Cliente</label>
              <Select id="clientProjectId" name="clientProjectId" defaultValue={clientProjectId ?? ""}>
                <option value="">Todos</option>
                {data.clientOptions.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="status" className="text-sm font-medium text-slate-700">Status</label>
              <Select id="status" name="status" defaultValue={status ?? ""}>
                <option value="">Todos</option>
                {taskStatuses.map((item) => (
                  <option key={item} value={item}>{taskStatusLabels[item]}</option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="sort" className="text-sm font-medium text-slate-700">Ordenar</label>
              <Select id="sort" name="sort" defaultValue={sort}>
                <option value="">Vencimento ↑</option>
                <option value="vencimento-desc">Vencimento ↓</option>
                <option value="cliente">Cliente</option>
                <option value="status">Status</option>
                <option value="titulo">Título</option>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="q" className="text-sm font-medium text-slate-700">Busca</label>
              <Input id="q" name="q" defaultValue={q} placeholder="Cliente ou rotina" />
            </div>
            <Button type="submit" variant="outline">
              <Search className="h-4 w-4" />
              Filtrar
            </Button>
            <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-6">
              <input type="checkbox" name="overdue" value="true" defaultChecked={overdue} className="h-4 w-4 rounded border-slate-300" />
              Somente atrasadas
            </label>
          </form>
          <div className="flex flex-wrap gap-2">
            <form action={generateFiscalCompetence}>
              <input type="hidden" name="competence" value={competence} />
              {clientProjectId ? <input type="hidden" name="clientId" value={clientProjectId} /> : null}
              {filterHiddenInputs}
              <Button type="submit">
                <RefreshCw className="h-4 w-4" />
                Gerar/atualizar
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-3 md:grid-cols-7">
        <Card><CardContent><p className="text-sm text-slate-500">Competência</p><p className="mt-1 text-2xl font-semibold text-slate-950">{data.competenceLabel}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Clientes visíveis</p><p className="mt-1 text-2xl font-semibold text-slate-950">{data.cards.visibleClients}/{data.cards.clients}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Tarefas geradas</p><p className="mt-1 text-2xl font-semibold text-slate-950">{data.cards.generatedTasks}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Abertas</p><p className="mt-1 text-2xl font-semibold text-slate-950">{data.cards.openTasks}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Vencem hoje</p><p className="mt-1 text-2xl font-semibold text-slate-950">{data.cards.todayTasks}</p></CardContent></Card>
        <Card className={data.cards.overdueTasks ? "border-rose-200 bg-rose-50/50" : undefined}><CardContent><p className="text-sm text-slate-500">Atrasadas</p><p className="mt-1 text-2xl font-semibold text-rose-700">{data.cards.overdueTasks}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Concluídas</p><p className="mt-1 text-2xl font-semibold text-slate-950">{data.cards.completedTasks}</p></CardContent></Card>
      </section>

      <section className="grid gap-4">
        {data.clients.length ? (
          data.clients.map((client) => (
            <Card key={client.id}>
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>
                    <Link href={`/clientes/${client.id}`} className="hover:underline">{client.name}</Link>
                  </CardTitle>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="blue">{client.expectedRoutines.length} rotinas esperadas</Badge>
                    <Badge variant={client.tasks.length ? "green" : "amber"}>{client.tasks.length} tarefas geradas</Badge>
                    <Badge variant="outline">{client.openTasks} abertas</Badge>
                    {client.overdueTasks ? <Badge variant="red">{client.overdueTasks} atrasadas</Badge> : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <form action={generateFiscalCompetence}>
                    <input type="hidden" name="competence" value={competence} />
                    <input type="hidden" name="clientId" value={client.id} />
                    {filterHiddenInputs}
                    <Button type="submit" variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4" />
                      Atualizar
                    </Button>
                  </form>
                  <form action={updateFiscalClientTasksStatus}>
                    <input type="hidden" name="competence" value={competence} />
                    <input type="hidden" name="clientId" value={client.id} />
                    <input type="hidden" name="status" value="CONCLUIDO" />
                    {filterHiddenInputs}
                    <Button type="submit" variant="secondary" size="sm" disabled={!client.openTasks}>
                      <CheckCircle2 className="h-4 w-4" />
                      Concluir abertas
                    </Button>
                  </form>
                  <form action={updateFiscalClientTasksStatus}>
                    <input type="hidden" name="competence" value={competence} />
                    <input type="hidden" name="clientId" value={client.id} />
                    <input type="hidden" name="status" value="CANCELADO" />
                    {filterHiddenInputs}
                    <Button type="submit" variant="outline" size="sm" disabled={!client.openTasks}>
                      <XCircle className="h-4 w-4" />
                      Cancelar abertas
                    </Button>
                  </form>
                  <form action={updateFiscalClientTasksStatus}>
                    <input type="hidden" name="competence" value={competence} />
                    <input type="hidden" name="clientId" value={client.id} />
                    <input type="hidden" name="status" value="PENDENTE" />
                    {filterHiddenInputs}
                    <Button type="submit" variant="outline" size="sm">
                      <RotateCcw className="h-4 w-4" />
                      Reabrir
                    </Button>
                  </form>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                {client.tasks.length ? (
                  client.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_auto] ${
                        isOverdue(task.dueDate, task.status) ? "border-rose-200 bg-rose-50/50" : "border-slate-100"
                      }`}
                    >
                      <div>
                        <Link href={`/tarefas/${task.id}`} className="font-medium text-slate-950 hover:underline">{task.title}</Link>
                        <p className={isOverdue(task.dueDate, task.status) ? "mt-1 text-sm font-semibold text-rose-700" : "mt-1 text-sm text-slate-500"}>
                          {formatDate(task.dueDate)}{isOverdue(task.dueDate, task.status) ? " · atrasada" : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        <DepartmentBadge name={task.department.name} />
                        <StatusBadge status={task.status} />
                        {!["CONCLUIDO", "CANCELADO"].includes(task.status) ? (
                          <>
                            <form action={updateFiscalTaskStatus}>
                              <input type="hidden" name="competence" value={competence} />
                              <input type="hidden" name="taskId" value={task.id} />
                              <input type="hidden" name="status" value="CONCLUIDO" />
                              {filterHiddenInputs}
                              <Button type="submit" variant="ghost" size="sm">
                                <CheckCircle2 className="h-4 w-4" />
                                Concluir
                              </Button>
                            </form>
                            <form action={updateFiscalTaskStatus}>
                              <input type="hidden" name="competence" value={competence} />
                              <input type="hidden" name="taskId" value={task.id} />
                              <input type="hidden" name="status" value="CANCELADO" />
                              {filterHiddenInputs}
                              <Button type="submit" variant="ghost" size="sm">
                                <XCircle className="h-4 w-4" />
                                Cancelar
                              </Button>
                            </form>
                          </>
                        ) : (
                          <form action={updateFiscalTaskStatus}>
                            <input type="hidden" name="competence" value={competence} />
                            <input type="hidden" name="taskId" value={task.id} />
                            <input type="hidden" name="status" value="PENDENTE" />
                            {filterHiddenInputs}
                            <Button type="submit" variant="ghost" size="sm">
                              <RotateCcw className="h-4 w-4" />
                              Reabrir
                            </Button>
                          </form>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState title="Competência ainda não gerada" description="Use Gerar/atualizar para criar as rotinas fiscais deste mês." />
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <EmptyState title="Nenhum cliente contábil ativo" description="Cadastre clientes de Contabilidade para gerar competências fiscais." />
        )}
      </section>
    </div>
  );
}
