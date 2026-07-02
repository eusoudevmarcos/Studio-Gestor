import { Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSegments } from "@/lib/data";
import { type SearchParams, readSearchParams } from "@/lib/search-params";

export default async function SegmentsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await readSearchParams(searchParams);
  const segments = await getSegments(filters);

  return (
    <div className="grid gap-5">
      <PageHeader title="Segmentos" description="Modelos de operação por mercado ou área de atuação." actionHref="/segmentos/novo" actionLabel="Novo segmento" actionIcon={Plus} />
      <form className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3">
        <Input name="q" placeholder="Buscar segmento" />
        <Button type="submit" variant="outline">Filtrar</Button>
      </form>
      {segments.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {segments.map((segment) => (
            <Link key={segment.id} href={`/segmentos/${segment.id}/editar`} className="rounded-lg border border-slate-200 bg-white p-4 hover:border-sky-200 hover:bg-sky-50/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-950">{segment.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{segment.description ?? "Sem descrição"}</p>
                </div>
                <Badge variant={segment.active ? "green" : "default"}>{segment.active ? "Ativo" : "Inativo"}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-slate-500">
                <div className="rounded-md bg-slate-50 p-2"><strong className="block text-base text-slate-950">{segment._count.departments}</strong>setores</div>
                <div className="rounded-md bg-slate-50 p-2"><strong className="block text-base text-slate-950">{segment._count.routines}</strong>rotinas</div>
                <div className="rounded-md bg-slate-50 p-2"><strong className="block text-base text-slate-950">{segment._count.clientProjects}</strong>clientes</div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="Nenhum segmento encontrado" description="Cadastre segmentos para adaptar a operação a diferentes mercados." />
      )}
    </div>
  );
}
