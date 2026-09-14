"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  title: string;
  description: string;
  trigger: React.ReactNode;
  actionLabel?: string;
  actionVariant?: "destructive" | "default";
  onConfirm?: () => void;
  children?: React.ReactNode;
};

export function ConfirmDialog({ title, description, trigger, actionLabel = "Confirmar", actionVariant = "destructive", onConfirm, children }: ConfirmDialogProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-base font-semibold text-slate-950">{title}</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-slate-500">{description}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-md p-1 text-slate-400 hover:bg-slate-100" aria-label="Fechar">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          {children ? <div className="mt-4">{children}</div> : null}
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </Dialog.Close>
            <Dialog.Close asChild>
              <Button type="button" variant={actionVariant} onClick={onConfirm}>{actionLabel}</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
