import { SignOutButton } from "@/components/layout/sign-out-button";
import { roleLabels } from "@/lib/labels";
import { getInitials } from "@/lib/utils";
import type { AppUser } from "@/lib/auth/session";

type AppHeaderProps = {
  user: AppUser;
};

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">{user.organizationName ?? "Escritório"}</p>
          <h1 className="text-lg font-semibold text-slate-950">Studio Gestor</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-950">{user.name ?? user.email}</p>
            <p className="text-xs text-slate-500">{user.departmentName ?? roleLabels[user.role]}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-700 text-sm font-semibold text-white">
            {getInitials(user.name ?? user.email)}
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
