import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { cellStatusClasses, cellLegend } from "@/components/closing/cell-style";
import { ClosingBoard } from "@/components/closing/closing-board";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { accountingTaxRegimeLabels, accountingTaxRegimes } from "@/lib/accounting";
import { closingModuleLabels, shiftCompetence, type ClosingModule } from "@/lib/closing";
import { getClosingBoard, getCurrentContext } from "@/lib/data";
import { readSearchParams, type SearchParams } from "@/lib/search-params";
import { cn } from "@/lib/utils";

const descriptions: Record<ClosingModule, string> = {
  FISCAL: "Apuração e obrigações por empresa e competência. Clique na célula para marcar; clique na empresa para ações da linha.",
  FOLHA: "Fechamento da folha por empresa e competência. Clique na célula para marcar; clique na empresa para ações da linha.",
};

function buildHref(basePath: string, params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export async function ClosingPage({ module, searchParams }: { module: ClosingModule; searchParams: SearchParams }) {
  const params = await readSearchParams(searchParams);
  const [board, context] = await Promise.all([getClosingBoard(module, params), getCurrentContext()]);
  const basePath = `/${module.toLowerCase()}`;
  const preserved = { q: params.q, regime: params.regime, state: params.state, pending: params.pending };
  const readOnly = context.user.role === "CONSULTA";
  const activeFilters = Object.values(preserved).filter(Boolean).length;
  const filtersForm = (
    <form action={basePath} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_180px_120px_auto_auto]">
      <input type="hidden" name="competence" value={board.competence} />
      <Input name="q" placeholder="Buscar por código, nome ou CNPJ" defaultValue={params.q ?? ""} />
      <Select name="regime" defaultValue={params.regime ?? ""}>
        <option value="">Todos os regimes</option>
        {accountingTaxRegimes.map((regime) => (
          <option key={regime} value={regime}>{accountingTaxRegimeLabels[regime]}</option>
        ))}
      </Select>
      <Select name="state" defaultValue={params.state ?? ""}>
        <option value="">Todas UF</option>
        {board.stateOptions.map((state) => (
          <option key={state} value={state}>{state}</option>
        ))}
      </Select>
      <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700">
        <input type="checkbox" name="pending" value="1" defaultChecked={params.pending === "1"} className="h-4 w-4 rounded border-slate-300" />
        Só pendentes
      </label>
      <Button type="submit" variant="outline">
        <Search className="h-4 w-4" />
        Filtrar
      </Button>
    </form>
  );

  return (
    <div className="grid gap-4">
      <PageHeader title={`Fechamento ${closingModuleLabels[module]}`} description={descriptions[module]} />

      <Card>
        <CardContent className="grid gap-3 p-3 md:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="icon" aria-label="Competência anterior">
              <Link href={buildHref(basePath, { ...preserved, competence: shiftCompetence(board.competence, -1) })}><ChevronLeft className="h-4 w-4" /></Link>
            </Button>
            <form action={basePath} className="flex items-center gap-2">
              {Object.entries(preserved).map(([key, value]) => (value ? <input key={key} type="hidden" name={key} value={value} /> : null))}
              <Input name="competence" type="month" defaultValue={board.competence} className="w-[170px]" aria-label="Competência" />
              <Button type="submit" variant="outline" size="sm">Ir</Button>
            </form>
            <Button asChild variant="outline" size="icon" aria-label="Próxima competência">
              <Link href={buildHref(basePath, { ...preserved, competence: shiftCompetence(board.competence, 1) })}><ChevronRight className="h-4 w-4" /></Link>
            </Button>
            <span className="text-sm font-semibold text-slate-700">Competência {board.competenceLabel}</span>
          </div>

          {/* No celular os filtros ficam recolhidos para a matriz aparecer logo. */}
          <details className="md:hidden">
            <summary className="cursor-pointer select-none text-sm font-semibold text-slate-700">Filtros{activeFilters ? ` (${activeFilters})` : ""}</summary>
            <div className="mt-3">{filtersForm}</div>
          </details>
          <div className="hidden md:block">{filtersForm}</div>
        </CardContent>
      </Card>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card><CardContent className="p-3 md:p-4"><p className="text-xs text-slate-500">Empresas</p><p className="mt-1 text-xl font-semibold text-slate-950">{board.rows.length}<span className="text-sm font-normal text-slate-400">/{board.totalCompanies}</span></p></CardContent></Card>
        <Card><CardContent className="p-3 md:p-4"><p className="text-xs text-slate-500">Etapas aplicáveis</p><p className="mt-1 text-xl font-semibold text-slate-950">{board.totals.applicable}</p></CardContent></Card>
        <Card><CardContent className="p-3 md:p-4"><p className="text-xs text-slate-500">Concluídas</p><p className="mt-1 text-xl font-semibold text-emerald-700">{board.totals.done}<span className="text-sm font-normal text-slate-400"> · {board.totals.percent}%</span></p></CardContent></Card>
        <Card className={board.totals.open ? "border-slate-300" : undefined}><CardContent className="p-3 md:p-4"><p className="text-xs text-slate-500">Pendentes</p><p className="mt-1 text-xl font-semibold text-slate-950">{board.totals.open}</p></CardContent></Card>
        <Card className={board.totals.attention ? "border-amber-300 bg-amber-50/50" : undefined}><CardContent className="p-3 md:p-4"><p className="text-xs text-slate-500">Atenção</p><p className="mt-1 text-xl font-semibold text-amber-700">{board.totals.attention}</p></CardContent></Card>
      </section>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        {cellLegend.map((item) => (
          <span key={item.status} className="flex items-center gap-1.5">
            <span className={cn("inline-block h-3.5 w-5 rounded-sm border", cellStatusClasses[item.status])} />
            {item.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3.5 w-5 rounded-sm border border-rose-700 bg-rose-600" />
          Marcador pendente (ex.: IRRF)
        </span>
      </div>

      <ClosingBoard
        key={`${module}-${board.competence}`}
        module={module}
        competence={board.competence}
        competenceLabel={board.competenceLabel}
        steps={board.steps}
        rows={board.rows}
        readOnly={readOnly}
      />
    </div>
  );
}
