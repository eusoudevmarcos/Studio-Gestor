import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      <PageHeader title="Equipe" description="Usuários, perfis, setores e status de acesso." actionIcon={Users} />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[920px] border-collapse text-sm">
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
                  <form action={updateUser.bind(null, user.id)} className="grid gap-2 md:grid-cols-[160px_180px_110px_auto]">
                    <input type="hidden" name="name" value={user.name ?? ""} />
                    <Select name="role" defaultValue={user.role} disabled={!canEdit}>
                      {userRoles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
                    </Select>
                    <Select name="departmentId" defaultValue={user.departmentId ?? ""} disabled={!canEdit}>
                      <option value="">Sem setor</option>
                      {options.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                    </Select>
                    <label className="flex items-center gap-2 text-xs text-slate-700">
                      <input type="hidden" name="active" value="false" />
                      <input type="checkbox" name="active" value="true" defaultChecked={user.active} disabled={!canEdit} />
                      Ativo
                    </label>
                    <Button type="submit" variant="outline" size="sm" disabled={!canEdit}>Salvar</Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
