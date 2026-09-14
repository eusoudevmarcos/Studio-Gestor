import { Plus, Search, Upload } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  accountingActivityShortLabels,
  accountingTaxRegimeLabels,
  accountingTaxRegimeShortLabels,
  accountingTaxRegimes,
  formatCnpj,
} from "@/lib/accounting";
import { closingModuleLabels } from "@/lib/closing";
import { clientProjectStatusLabels } from "@/lib/labels";
import { getCompanies } from "@/lib/data";
import { type SearchParams, readSearchParams } from "@/lib/search-params";
import { clientProjectStatuses } from "@/lib/validations/entities";

export default async function CompaniesPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await readSearchParams(searchParams);
  const items = await getCompanies(filters);

  return (
    <div className="grid gap-5">
      <PageHeader title="Empresas" description="Cadastro simples das empresas do escritório. As obrigações aparecem automaticamente pelo perfil." />
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/empresas/novo"><Plus className="h-4 w-4" />Nova empresa</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/empresas/importar"><Upload className="h-4 w-4" />Importar da planilha</Link>
        </Button>
      </div>

      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-[1fr_180px_200px_auto]">
        <Input name="q" placeholder="Buscar por código, nome ou CNPJ" defaultValue={filters.q ?? ""} />
        <Select name="regime" defaultValue={filters.regime ?? ""}>
          <option value="">Todos os regimes</option>
          {accountingTaxRegimes.map((regime) => (
            <option key={regime} value={regime}>{accountingTaxRegimeLabels[regime]}</option>
          ))}
        </Select>
        <Select name="status" defaultValue={filters.status ?? ""}>
          <option value="">Todas as situações</option>
          {clientProjectStatuses.map((status) => (
            <option key={status} value={status}>{clientProjectStatusLabels[status]}</option>
          ))}
        </Select>
        <Button type="submit" variant="outline">
          <Search className="h-4 w-4" />
          Filtrar
        </Button>
      </form>

      {items.length ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3 text-right">Cod</th>
                <th className="px-3 py-3 text-left">Empresa</th>
                <th className="px-3 py-3 text-left">CNPJ</th>
                <th className="px-3 py-3 text-left">Ativ</th>
                <th className="px-3 py-3 text-left">UF</th>
                <th className="px-3 py-3 text-left">Regime</th>
                <th className="px-3 py-3 text-right">Func</th>
                <th className="px-3 py-3 text-left">Módulos</th>
                <th className="px-3 py-3 text-left">Situação</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">{item.code ?? "-"}</td>
                  <td className="px-3 py-2.5">
                    <Link href={`/empresas/${item.id}`} className="font-medium text-sky-800 hover:underline">{item.name}</Link>
                    {item.mainResponsible ? <p className="text-xs text-slate-500">{item.mainResponsible.name}</p> : null}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-slate-600">{formatCnpj(item.document)}</td>
                  <td className="px-3 py-2.5">{item.accountingActivity ? accountingActivityShortLabels[item.accountingActivity] : "-"}</td>
                  <td className="px-3 py-2.5">{item.accountingState ?? "-"}</td>
                  <td className="px-3 py-2.5">{item.accountingTaxRegime ? accountingTaxRegimeShortLabels[item.accountingTaxRegime] : "-"}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{item.employeesCount ?? "-"}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {item.modules.length ? item.modules.map((module) => <Badge key={module} variant="blue">{closingModuleLabels[module]}</Badge>) : <span className="text-slate-400">-</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant={item.status === "ATIVO" ? "green" : "default"}>{clientProjectStatusLabels[item.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="Nenhuma empresa cadastrada"
          description="Cadastre a primeira empresa ou cole as linhas da planilha em Importar da planilha."
        />
      )}
    </div>
  );
}
