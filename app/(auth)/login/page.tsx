import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/login-form";
import { getSession } from "@/lib/auth/session";
import { organizationName } from "@/lib/auth/bootstrap";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session?.user?.id) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-700 text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">Studio Gestor</p>
            <p className="text-xs text-slate-500">{organizationName()} · acesso da equipe</p>
          </div>
        </div>
        <LoginForm />
        <p className="mt-5 text-center text-xs text-slate-500">Acesso restrito aos colaboradores cadastrados pelo escritório.</p>
      </div>
    </main>
  );
}
