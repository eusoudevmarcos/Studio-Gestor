import { Plus } from "lucide-react";
import Link from "next/link";
import { DepartmentBadge } from "@/components/badges/department-badge";
import { SegmentBadge } from "@/components/badges/segment-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getDepartments, getFormOptions } from "@/lib/data";
import { type SearchParams, readSearchParams } from "@/lib/search-params";

export default async function DepartmentsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await readSearchParams(searchParams);
  const [departments, options] = await Promise.all([getDepartments(filters), getFormOptions()]);

  return (
    <div className="grid gap-5">
      <PageHeader title="Setores" description="Departamentos e áreas responsáveis pela execução das rotinas." actionHref="/setores/novo" actionLabel="Novo setor" actionIcon={Plus} />
      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[1fr_220px_auto]">
        <Input name="q" placeholder="Buscar setor" />
        <Select name="segmentId" defaultValue="">
          <option value="">Todos os segmentos</option>
          {options.segments.map((segment) => <option key={segment.id} value={segment.id}>{segment.name}</option>)}
        </Select>
        <Button type="submit" variant="outline">Filtrar</Button>
      </form>
      {departments.length ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Setor</th>
                <th className="px-4 py-3 text-left">Segmento</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Usuários</th>
                <th className="px-4 py-3 text-right">Rotinas</th>
                <th className="px-4 py-3 text-right">Tarefas</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((department) => (
                <tr key={department.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <Link href={`/setores/${department.id}/editar`} className="font-medium text-sky-800 hover:underline">
                      <DepartmentBadge name={department.name} />
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">{department.description ?? "Sem descrição"}</p>
                  </td>
                  <td className="px-4 py-3">{department.segment ? <SegmentBadge name={department.segment.name} /> : "-"}</td>
                  <td className="px-4 py-3"><Badge variant={department.active ? "green" : "default"}>{department.active ? "Ativo" : "Inativo"}</Badge></td>
                  <td className="px-4 py-3 text-right">{department._count.users}</td>
                  <td className="px-4 py-3 text-right">{department._count.routines}</td>
                  <td className="px-4 py-3 text-right">{department._count.tasks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Nenhum setor encontrado" description="Crie setores para organizar responsáveis, rotinas e tarefas." />
      )}
    </div>
  );
}
