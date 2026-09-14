import { Settings } from "lucide-react";
import { ChangePasswordForm } from "@/components/forms/user-forms";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentContext } from "@/lib/data";
import { roleLabels } from "@/lib/labels";

export default async function SettingsPage() {
  const { user } = await getCurrentContext();

  return (
    <div className="grid gap-5">
      <PageHeader title="Configurações" description="Sua conta e informações do ambiente." actionIcon={Settings} />
      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Minha conta</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div><span className="text-slate-500">Escritório</span><p className="font-medium text-slate-950">{user.organizationName}</p></div>
            <div><span className="text-slate-500">Nome</span><p className="font-medium text-slate-950">{user.name ?? "-"}</p></div>
            <div><span className="text-slate-500">E-mail</span><p className="font-medium text-slate-950">{user.email}</p></div>
            <div><span className="text-slate-500">Perfil</span><p className="font-medium text-slate-950">{roleLabels[user.role]}</p></div>
            <div><span className="text-slate-500">Setor</span><p className="font-medium text-slate-950">{user.departmentName ?? "-"}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Alterar senha</CardTitle>
            <CardDescription>Use pelo menos 8 caracteres. Se esqueceu a senha, peça a um administrador para redefinir em Equipe.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
