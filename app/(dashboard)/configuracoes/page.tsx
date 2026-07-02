import { Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentContext } from "@/lib/data";
import { roleLabels } from "@/lib/labels";

export default async function SettingsPage() {
  const { user } = await getCurrentContext();

  return (
    <div className="grid gap-5">
      <PageHeader title="Configurações" description="Parâmetros iniciais da organização e ambiente." actionIcon={Settings} />
      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Organização</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div><span className="text-slate-500">Nome</span><p className="font-medium text-slate-950">{user.organizationName}</p></div>
            <div><span className="text-slate-500">Usuário atual</span><p className="font-medium text-slate-950">{user.name ?? user.email}</p></div>
            <div><span className="text-slate-500">Perfil</span><p className="font-medium text-slate-950">{roleLabels[user.role]}</p></div>
            <div><span className="text-slate-500">Setor</span><p className="font-medium text-slate-950">{user.departmentName ?? "-"}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Ambiente</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div><span className="text-slate-500">Banco</span><p className="font-medium text-slate-950">PostgreSQL via Prisma</p></div>
            <div><span className="text-slate-500">Autenticação</span><p className="font-medium text-slate-950">Auth.js com credenciais</p></div>
            <div><span className="text-slate-500">Variáveis</span><p className="font-medium text-slate-950">DATABASE_URL, AUTH_SECRET, AUTH_URL</p></div>
            <div><span className="text-slate-500">Próximas evoluções</span><p className="font-medium text-slate-950">Convites, auditoria avançada e integrações externas</p></div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
