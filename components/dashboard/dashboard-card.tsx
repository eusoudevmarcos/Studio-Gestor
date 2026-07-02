import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type DashboardCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
};

export function DashboardCard({ title, value, description, icon: Icon }: DashboardCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">{title}</p>
          <strong className="mt-2 block text-2xl font-semibold text-slate-950">{value}</strong>
          {description ? <span className="mt-1 block text-xs text-slate-500">{description}</span> : null}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-50 text-sky-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  );
}
