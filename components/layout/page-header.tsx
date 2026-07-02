import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type PageHeaderProps = {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
};

export function PageHeader({ title, description, actionHref, actionLabel, actionIcon: ActionIcon }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {actionHref && actionLabel ? (
        <Button asChild>
          <Link href={actionHref}>
            {ActionIcon ? <ActionIcon className="h-4 w-4" /> : null}
            {actionLabel}
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
