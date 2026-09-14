import { Users } from "lucide-react";
import { CreateUserForm, ResetPasswordButton } from "@/components/forms/user-forms";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { updateUser } from "@/lib/actions/users";
import { getCurrentContext, getFormOptions, getTeam } from "@/lib/data";
import { roleLabels } from "@/lib/labels";
import { canManageUsers } from "@/lib/permissions";
import { userRoles } from "@/lib/validations/entities";

export default async function TeamPage() {
  const [team, options, context] = await Promise.all([getTeam(), getFormOptions(), getCurrentContext()]);
  const canEdit = canManageUsers(context.user.role);

  return (
    <div className="grid gap-5">
      <PageHeader title="Equipe" description="Quem pode entrar no Studio Gestor. Só colaboradores cadastrados aqui conseguem fazer login." actionIcon={Users} />

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle>Novo acesso</CardTitle>
            <CardDescription>Informe nome, e-mail, perfil e uma senha inicial. O colaborador pode trocar a senha em Configurações.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateUserForm departments={options.departments} />
          </CardContent>
        </Card>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Usuário</th>
              <th className="px-4 py-3 text-left">Perfil</th>
              <th className="px-4 py-3 text-left">Setor</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Tarefas</th>
              <th className="px-4 py-3 text-left">Edição rápida</th>
            </tr>
          </thead>
          <tbody>
            {team.map((user) => (
              <tr key={user.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-950">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </td>
                <td className="px-4 py-3">{roleLabels[user.role]}</td>
                <td className="px-4 py-3">{user.department?.name ?? "-"}</td>
                <td className="px-4 py-3"><Badge variant={user.active ? "green" : "default"}>{user.active ? "Ativo" : "Inativo"}</Badge></td>
                <td className="px-4 py-3 text-right">{user._count.responsibleTasks}</td>
                <td className="px-4 py-3">
                  {canEdit ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={updateUser.bind(null, user.id)} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="name" value={user.name} />
                        <Select name="role" defaultValue={user.role} className="h-9 w-40">
                          {userRoles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
                        </Select>
                        <Select name="departmentId" defaultValue={user.departmentId ?? ""} className="h-9 w-40">
                          <option value="">Sem setor</option>
                          {options.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                        </Select>
                        <label className="flex items-center gap-2 text-xs text-slate-700">
                          <input type="hidden" name="active" value="false" />
                          <input type="checkbox" name="active" value="true" defaultChecked={user.active} disabled={user.id === context.user.id} />
                          Ativo
                        </label>
                        <Button type="submit" variant="outline" size="sm">Salvar</Button>
                      </form>
                      <ResetPasswordButton userId={user.id} userName={user.name} />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Somente admin edita</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
