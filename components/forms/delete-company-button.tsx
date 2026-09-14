"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteCompany } from "@/lib/actions/companies";

export function DeleteCompanyButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <ConfirmDialog
      title="Excluir empresa"
      description={`Remove "${name}" e todo o histórico de fechamento dela. Prefira marcar como Inativa se a empresa apenas saiu do escritório.`}
      actionLabel="Excluir"
      onConfirm={() => startTransition(() => void deleteCompany(id))}
      trigger={
        <Button type="button" variant="ghost" className="text-rose-700 hover:bg-rose-50" disabled={pending}>
          <Trash2 className="h-4 w-4" />
          Excluir
        </Button>
      }
    />
  );
}
