"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ClipboardList, Gauge, ReceiptText, Settings, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileItems = [
  { href: "/dashboard", label: "Painel", icon: Gauge },
  { href: "/fiscal", label: "Fiscal", icon: ReceiptText },
  { href: "/folha", label: "Folha", icon: UsersRound },
  { href: "/empresas", label: "Empresas", icon: Building2 },
  { href: "/tarefas", label: "Tarefas", icon: ClipboardList },
  { href: "/configuracoes", label: "Mais", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-6 border-t border-slate-200 bg-white md:hidden">
      {mobileItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            href={item.href}
            key={item.href}
            className={cn("flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium text-slate-500", active && "text-sky-800")}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
