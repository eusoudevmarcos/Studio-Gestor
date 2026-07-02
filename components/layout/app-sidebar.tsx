"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ClipboardList,
  FolderKanban,
  Gauge,
  Layers3,
  ReceiptText,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/clientes", label: "Clientes/Projetos", icon: BriefcaseBusiness },
  { href: "/fiscal", label: "Fiscal mensal", icon: ReceiptText },
  { href: "/tarefas", label: "Tarefas", icon: ClipboardList },
  { href: "/rotinas", label: "Rotinas", icon: FolderKanban },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/setores", label: "Setores", icon: Building2 },
  { href: "/segmentos", label: "Segmentos", icon: Layers3 },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white md:block">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-700 text-white">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">Studio Gestor</p>
          <p className="text-xs text-slate-500">Gestão operacional</p>
        </div>
      </div>
      <nav className="grid gap-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                active && "bg-sky-50 text-sky-800",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
