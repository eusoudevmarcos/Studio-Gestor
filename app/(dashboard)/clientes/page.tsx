import { Plus } from "lucide-react";
import Link from "next/link";
import { ClientProjectFilters } from "@/components/forms/filters";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { accountingTaxRegimeLabels, isAccountingSegmentName } from "@/lib/accounting";
import { clientProjectStatusLabels, clientProjectTypeLabels } from "@/lib/labels";
import { getClientProjects, getFormOptions } from "@/lib/data";
import { type SearchParams, readSearchParams } from "@/lib/search-params";
import { formatDate } from "@/lib/utils";

export default async function ClientProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await readSearchParams(searchParams);
  const [items, options] = await Promise.all([getClientProjects(filters), getFormOptions()]);

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Clientes/Projetos"
        description="Carteira operacional para clientes, projetos, empresas, candidatos ou processos."
        actionHref="/clientes/novo"
        actionLabel="Novo registro"
        actionIcon={Plus}
      />
      <ClientProjectFilters segments={options.segments} />
      {items.length ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Segmento</th>
                <th className="px-4 py-3 text-left">Responsável</th>
                <th className="px-4 py-3 text-right">Tarefas</th>
                <th className="px-4 py-3 text-left">Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <Link href={`/clientes/${item.id}`} className="font-medium text-sky-800 hover:underline">{item.name}</Link>
                    <p className="text-xs text-slate-500">{item.document ?? "Sem documento"}</p>
                  </td>
                  <td className="px-4 py-3">{clientProjectTypeLabels[item.type]}</td>
                  <td className="px-4 py-3"><Badge variant={item.status === "ATIVO" ? "green" : "default"}>{clientProjectStatusLabels[item.status]}</Badge></td>
                  <td className="px-4 py-3">
                    <p>{item.segment?.name ?? "-"}</p>
                    {isAccountingSegmentName(item.segment?.name) && item.accountingTaxRegime ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {accountingTaxRegimeLabels[item.accountingTaxRegime]} · {item.accountingState ?? "UF não informada"}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{item.mainResponsible?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-right">{item._count.tasks}</td>
                  <td className="px-4 py-3">{formatDate(item.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Nenhum cliente/projeto encontrado" description="Crie o primeiro registro ou ajuste os filtros." />
      )}
    </div>
  );
}
