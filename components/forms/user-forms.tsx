"use client";

import { KeyRound, Loader2, UserPlus } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { changeOwnPasswordAction, createUserAction, setUserPassword, type ActionResult } from "@/lib/actions/users";
import { roleLabels } from "@/lib/labels";
import { userRoles } from "@/lib/validations/entities";

type Option = { id: string; name: string | null };

function Feedback({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return result.ok ? (
    <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{result.message ?? "Salvo."}</p>
  ) : (
    <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{result.error}</p>
  );
}

const roleHints: Record<(typeof userRoles)[number], string> = {
  ADMIN: "tudo, inclusive equipe e senhas",
  GESTOR: "tudo, exceto gerenciar a equipe",
  COORDENADOR: "cadastra empresas e marca o fechamento",
  COLABORADOR: "cadastra empresas e marca o fechamento",
  CONSULTA: "somente visualiza",
};

// Os formulários usam a server action direto no <form> (method POST): mesmo antes da
// hidratação o envio nunca cai num GET com a senha na URL.
export function CreateUserForm({ departments }: { departments: Option[] }) {
  const [result, formAction, pending] = useActionState(createUserAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (result?.ok) formRef.current?.reset();
  }, [result]);

  return (
    <form ref={formRef} className="grid gap-4" action={formAction}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="grid gap-2">
          <Label htmlFor="new-name">Nome</Label>
          <Input id="new-name" name="name" required autoComplete="off" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="new-email">E-mail (login)</Label>
          <Input id="new-email" name="email" type="email" required autoComplete="off" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="new-role">Perfil</Label>
          <Select id="new-role" name="role" defaultValue="COLABORADOR">
            {userRoles.map((role) => (
              <option key={role} value={role}>{roleLabels[role]} · {roleHints[role]}</option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="new-department">Setor</Label>
          <Select id="new-department" name="departmentId" defaultValue="">
            <option value="">Sem setor</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="new-password">Senha inicial</Label>
          <Input id="new-password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        </div>
      </div>
      <Feedback result={result} />
      <Button type="submit" className="w-fit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Criar acesso
      </Button>
    </form>
  );
}

export function ResetPasswordButton({ userId, userName }: { userId: string; userName: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [password, setPassword] = useState("");

  return (
    <div className="grid gap-1">
      <ConfirmDialog
        title={`Nova senha para ${userName}`}
        description="Digite a nova senha abaixo. O colaborador deve trocá-la em Configurações depois de entrar."
        actionLabel="Redefinir"
        actionVariant="default"
        onConfirm={() => {
          const formData = new FormData();
          formData.append("password", password);
          startTransition(async () => {
            setResult(await setUserPassword(userId, formData));
            setPassword("");
          });
        }}
        trigger={
          <Button type="button" variant="ghost" size="sm" disabled={pending}>
            <KeyRound className="h-4 w-4" />
            Senha
          </Button>
        }
      >
        <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" minLength={8} autoComplete="new-password" />
      </ConfirmDialog>
      {result ? <span className={result.ok ? "text-xs text-emerald-700" : "text-xs text-rose-700"}>{result.ok ? result.message : result.error}</span> : null}
    </div>
  );
}

export function ChangePasswordForm() {
  const [result, formAction, pending] = useActionState(changeOwnPasswordAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (result?.ok) formRef.current?.reset();
  }, [result]);

  return (
    <form ref={formRef} className="grid gap-3" action={formAction}>
      <div className="grid gap-2">
        <Label htmlFor="currentPassword">Senha atual</Label>
        <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      <Feedback result={result} />
      <Button type="submit" className="w-fit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        Alterar senha
      </Button>
    </form>
  );
}
