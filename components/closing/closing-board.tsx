"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { CheckCheck, Loader2, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { cellClasses, cellStatusClasses, cellText } from "@/components/closing/cell-style";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { bulkClosingRow, saveClosingCell, saveClosingRow } from "@/lib/actions/closing";
import { cellStatusLabels, closingModuleLabels, type CellStatus, type ClosingModule, type ClosingStep } from "@/lib/closing";
import type { ClosingBoardRow } from "@/lib/data";
import { cn, toDateInputValue } from "@/lib/utils";

type ClosingBoardProps = {
  module: ClosingModule;
  competence: string;
  competenceLabel: string;
  steps: ClosingStep[];
  rows: ClosingBoardRow[];
  readOnly: boolean;
};

type CellSelection = { rowId: string; stepKey: string };

type OptimisticAction =
  | { type: "cell"; rowId: string; stepKey: string; status: CellStatus; note: string | null; doneAt: Date | null }
  | { type: "row"; rowId: string; noMovement?: boolean | null; note?: string | null }
  | { type: "bulk"; rowId: string; action: "CONCLUIR" | "REABRIR" };

const selectableStatuses: CellStatus[] = ["OK", "SEM_MOVIMENTO", "NAO_DEVIDO", "ATENCAO", "PENDENTE"];

function isDone(status: CellStatus) {
  return status === "OK" || status === "SEM_MOVIMENTO" || status === "NAO_DEVIDO";
}

function recount(row: ClosingBoardRow): ClosingBoardRow {
  const applicable = row.cells.filter((cell) => cell.applicable);
  return {
    ...row,
    applicable: applicable.length,
    done: applicable.filter((cell) => isDone(cell.status)).length,
    open: applicable.filter((cell) => cell.status === "PENDENTE").length,
    attention: applicable.filter((cell) => cell.status === "ATENCAO").length,
  };
}

function applyOptimistic(rows: ClosingBoardRow[], action: OptimisticAction): ClosingBoardRow[] {
  return rows.map((row) => {
    if (row.company.id !== action.rowId) return row;

    if (action.type === "cell") {
      return recount({
        ...row,
        cells: row.cells.map((cell) =>
          cell.stepKey === action.stepKey ? { ...cell, status: action.status, note: action.note, doneAt: action.doneAt, isDefault: false } : cell,
        ),
      });
    }

    if (action.type === "row") {
      const noMovement = action.noMovement === undefined ? row.noMovement : action.noMovement;
      return recount({
        ...row,
        noMovement,
        note: action.note === undefined ? row.note : action.note,
        cells: row.cells.map((cell) => {
          if (!cell.applicable || !cell.isDefault || action.noMovement === undefined) return cell;
          if (cell.status === "PENDENTE" && noMovement) return { ...cell, status: "SEM_MOVIMENTO" };
          if (cell.status === "SEM_MOVIMENTO" && !noMovement) return { ...cell, status: "PENDENTE" };
          return cell;
        }),
      });
    }

    return recount({
      ...row,
      cells: row.cells.map((cell) => {
        if (!cell.applicable) return cell;
        if (action.action === "CONCLUIR" && (cell.status === "PENDENTE" || cell.status === "ATENCAO")) {
          return { ...cell, status: "OK", doneAt: new Date(), isDefault: false };
        }
        if (action.action === "REABRIR" && !cell.isDefault) {
          return { ...cell, status: "PENDENTE", note: null, doneAt: null, isDefault: true };
        }
        return cell;
      }),
    });
  });
}

export function ClosingBoard({ module, competence, competenceLabel, steps, rows, readOnly }: ClosingBoardProps) {
  const [pending, startTransition] = useTransition();
  const [optimisticRows, pushOptimistic] = useOptimistic(rows, applyOptimistic);
  const [selectedCell, setSelectedCell] = useState<CellSelection | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groups = steps.reduce<{ name: string; count: number }[]>((acc, step) => {
    const last = acc[acc.length - 1];
    if (last && last.name === step.group) last.count += 1;
    else acc.push({ name: step.group, count: 1 });
    return acc;
  }, []);

  const openByStep = steps.map((step) => optimisticRows.filter((row) => row.cells.find((cell) => cell.stepKey === step.key)?.status === "PENDENTE").length);

  function run(action: OptimisticAction, request: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      pushOptimistic(action);
      try {
        await request();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Não foi possível salvar.");
      }
    });
  }

  const selectedRow = optimisticRows.find((row) => row.company.id === (selectedCell?.rowId ?? selectedRowId)) ?? null;
  const selectedStep = selectedCell ? steps.find((step) => step.key === selectedCell.stepKey) ?? null : null;
  const selectedCellView = selectedRow && selectedCell ? selectedRow.cells.find((cell) => cell.stepKey === selectedCell.stepKey) ?? null : null;

  return (
    <div className="grid gap-3">
      {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      <div className="relative overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full border-separate border-spacing-0 text-xs">
          <thead className="sticky top-0 z-20">
            <tr className="bg-amber-400 text-[11px] font-bold uppercase text-slate-900">
              <th className="sticky left-0 z-30 border-b border-r border-amber-500 bg-amber-400 px-3 py-1.5 text-left" colSpan={1}>
                Cadastro
              </th>
              {groups.map((group) => (
                <th key={group.name} colSpan={group.count} className="border-b border-r border-amber-500 px-2 py-1.5 text-center">
                  {group.name}
                </th>
              ))}
              <th className="border-b border-amber-500 px-2 py-1.5 text-center">Importante</th>
            </tr>
            <tr className="bg-slate-900 text-[11px] font-semibold uppercase text-white">
              <th className="sticky left-0 z-30 min-w-[168px] max-w-[168px] border-b border-r border-slate-700 bg-slate-900 px-2 py-2 text-left md:min-w-[230px] md:max-w-none md:px-3">Empresa</th>
              {steps.map((step) => (
                <th key={step.key} title={step.description} className="min-w-[56px] border-b border-r border-slate-700 px-1 py-2 text-center md:min-w-[64px]">
                  {step.label}
                </th>
              ))}
              <th className="min-w-[180px] border-b border-slate-700 px-3 py-2 text-left">Observações</th>
            </tr>
          </thead>
          <tbody>
            {optimisticRows.length ? (
              optimisticRows.map((row) => {
                const complete = row.applicable > 0 && row.open + row.attention === 0;
                return (
                  <tr key={row.company.id} className="group">
                    <td className="sticky left-0 z-10 max-w-[168px] border-b border-r border-slate-200 bg-white px-2 py-1 group-hover:bg-slate-50 md:max-w-none md:px-3">
                      <button
                        type="button"
                        onClick={() => !readOnly && setSelectedRowId(row.company.id)}
                        className="flex w-full items-center gap-2 text-left"
                        title="Abrir ações da linha"
                      >
                        <span className="hidden w-7 shrink-0 text-right tabular-nums text-slate-400 sm:inline">{row.company.code ?? ""}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-slate-900">{row.company.name}</span>
                          <span className="hidden text-[10px] uppercase text-slate-500 sm:block">
                            {row.company.activityShort} · {row.company.state ?? "-"} · {row.company.regimeShort}
                            {module === "FOLHA" && row.company.employeesCount !== null ? ` · ${row.company.employeesCount} func` : ""}
                            {row.noMovement ? " · S. MOV." : ""}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                            complete ? "bg-emerald-100 text-emerald-800" : row.attention ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600",
                          )}
                        >
                          {row.done}/{row.applicable}
                        </span>
                      </button>
                    </td>
                    {row.cells.map((cell) => (
                      <td key={cell.stepKey} className="border-b border-r border-slate-200 p-0">
                        <button
                          type="button"
                          disabled={!cell.applicable || readOnly}
                          onClick={() => setSelectedCell({ rowId: row.company.id, stepKey: cell.stepKey })}
                          title={cell.applicable ? `${cellStatusLabels[cell.status]}${cell.note ? ` · ${cell.note}` : ""}` : cell.reason}
                          className={cn(
                            "flex h-9 w-full min-w-[56px] items-center justify-center border px-1 text-[11px] font-semibold transition-colors disabled:cursor-default md:min-w-[64px]",
                            cellClasses(cell),
                          )}
                        >
                          {cellText(cell)}
                        </button>
                      </td>
                    ))}
                    <td className="border-b border-slate-200 px-3 py-1 text-slate-600">
                      <button type="button" onClick={() => !readOnly && setSelectedRowId(row.company.id)} className="block w-full truncate text-left" title={row.note ?? "Adicionar observação"}>
                        {row.note ?? <span className="text-slate-300">—</span>}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={steps.length + 2} className="px-4 py-10 text-center text-sm text-slate-500">
                  Nenhuma empresa para exibir. Cadastre empresas em <Link href="/empresas" className="font-semibold text-sky-800 underline">Empresas</Link> ou ajuste os filtros.
                </td>
              </tr>
            )}
          </tbody>
          {optimisticRows.length ? (
            <tfoot>
              <tr className="bg-slate-50 text-[11px] text-slate-600">
                <td className="sticky left-0 z-10 border-r border-t border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold">Pendentes por etapa</td>
                {openByStep.map((count, index) => (
                  <td key={steps[index].key} className={cn("border-r border-t border-slate-200 px-1 py-1.5 text-center tabular-nums", count ? "font-semibold text-rose-700" : "")}>
                    {count || ""}
                  </td>
                ))}
                <td className="border-t border-slate-200" />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      <Dialog.Root open={Boolean(selectedCell)} onOpenChange={(open) => !open && setSelectedCell(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-24px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
            {selectedRow && selectedStep && selectedCellView ? (
              <CellEditor
                key={`${selectedRow.company.id}:${selectedStep.key}`}
                module={module}
                competence={competence}
                competenceLabel={competenceLabel}
                row={selectedRow}
                step={selectedStep}
                cell={selectedCellView}
                pending={pending}
                onClose={() => setSelectedCell(null)}
                onSave={(status, note, doneAt) => {
                  run(
                    { type: "cell", rowId: selectedRow.company.id, stepKey: selectedStep.key, status, note, doneAt: doneAt ? new Date(`${doneAt}T12:00:00`) : status === "OK" ? new Date() : null },
                    () => saveClosingCell({ clientProjectId: selectedRow.company.id, module, competence, stepKey: selectedStep.key, status, note, doneAt }),
                  );
                  setSelectedCell(null);
                }}
              />
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={Boolean(selectedRowId)} onOpenChange={(open) => !open && setSelectedRowId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-24px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
            {selectedRow && !selectedCell ? (
              <RowEditor
                key={selectedRow.company.id}
                module={module}
                competenceLabel={competenceLabel}
                row={selectedRow}
                pending={pending}
                onClose={() => setSelectedRowId(null)}
                onSaveRow={(noMovement, note) => {
                  run({ type: "row", rowId: selectedRow.company.id, noMovement, note }, () =>
                    saveClosingRow({ clientProjectId: selectedRow.company.id, module, competence, noMovement, note }),
                  );
                  setSelectedRowId(null);
                }}
                onBulk={(action) => {
                  run({ type: "bulk", rowId: selectedRow.company.id, action }, () => bulkClosingRow({ clientProjectId: selectedRow.company.id, module, competence, action }));
                  setSelectedRowId(null);
                }}
              />
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

type CellEditorProps = {
  module: ClosingModule;
  competence: string;
  competenceLabel: string;
  row: ClosingBoardRow;
  step: ClosingStep;
  cell: ClosingBoardRow["cells"][number];
  pending: boolean;
  onClose: () => void;
  onSave: (status: CellStatus, note: string | null, doneAt: string | null) => void;
};

function CellEditor({ module, competenceLabel, row, step, cell, pending, onClose, onSave }: CellEditorProps) {
  const [note, setNote] = useState(cell.note ?? "");
  const [doneAt, setDoneAt] = useState(toDateInputValue(cell.doneAt));

  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Dialog.Title className="text-base font-semibold text-slate-950">
            {step.label} · {row.company.name}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-slate-500">
            {closingModuleLabels[module]} · competência {competenceLabel}. {step.description}
          </Dialog.Description>
        </div>
        <Dialog.Close asChild>
          <button className="rounded-md p-1 text-slate-400 hover:bg-slate-100" aria-label="Fechar" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </Dialog.Close>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {selectableStatuses.map((status) => (
          <button
            key={status}
            type="button"
            disabled={pending}
            onClick={() => onSave(status, note.trim() || null, doneAt || null)}
            className={cn(
              "rounded-md border px-2 py-2 text-xs font-semibold transition-colors",
              cellStatusClasses[status],
              status === "PENDENTE" && "text-slate-700",
              cell.status === status && "ring-2 ring-sky-500 ring-offset-1",
            )}
          >
            {cellStatusLabels[status]}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
        <label className="grid gap-1 text-xs font-medium text-slate-700">
          Texto da célula / observação
          <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder='Ex.: "Sem certificado", "Dominio", "01.09 Sub."' />
        </label>
        <label className="grid gap-1 text-xs font-medium text-slate-700">
          Data (quando concluído)
          <Input type="date" value={doneAt} onChange={(event) => setDoneAt(event.target.value)} />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          {cell.updatedByName ? `Última alteração: ${cell.updatedByName}` : `Padrão do perfil: ${cell.reason}`}
        </span>
        <Button type="button" size="sm" disabled={pending} onClick={() => onSave(cell.status, note.trim() || null, doneAt || null)}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Salvar texto
        </Button>
      </div>
    </div>
  );
}

type RowEditorProps = {
  module: ClosingModule;
  competenceLabel: string;
  row: ClosingBoardRow;
  pending: boolean;
  onClose: () => void;
  onSaveRow: (noMovement: boolean | null | undefined, note: string | null) => void;
  onBulk: (action: "CONCLUIR" | "REABRIR") => void;
};

function RowEditor({ module, competenceLabel, row, pending, onClose, onSaveRow, onBulk }: RowEditorProps) {
  const [note, setNote] = useState(row.note ?? "");
  const [noMovement, setNoMovement] = useState(Boolean(row.noMovement));

  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Dialog.Title className="text-base font-semibold text-slate-950">
            {row.company.code ? `${row.company.code} · ` : ""}{row.company.name}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-slate-500">
            {closingModuleLabels[module]} · competência {competenceLabel} · {row.done}/{row.applicable} etapas concluídas.{" "}
            <Link href={`/empresas/${row.company.id}`} className="font-semibold text-sky-800 underline">Ver cadastro</Link>
          </Dialog.Description>
        </div>
        <Dialog.Close asChild>
          <button className="rounded-md p-1 text-slate-400 hover:bg-slate-100" aria-label="Fechar" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </Dialog.Close>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={pending || row.open + row.attention === 0} onClick={() => onBulk("CONCLUIR")}>
          <CheckCheck className="h-4 w-4" />
          Concluir pendentes
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => onBulk("REABRIR")}>
          <RotateCcw className="h-4 w-4" />
          Reabrir tudo
        </Button>
      </div>

      {module === "FISCAL" ? (
        <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={noMovement} onChange={(event) => setNoMovement(event.target.checked)} />
          Sem movimento nesta competência (marca as etapas como &quot;S. Mov.&quot;)
        </label>
      ) : null}

      <label className="grid gap-1 text-xs font-medium text-slate-700">
        Observações da linha
        <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Ex.: aguardando certificado, cliente enviou eventos atrasados..." />
      </label>

      <div className="flex justify-end">
        <Button type="button" size="sm" disabled={pending} onClick={() => onSaveRow(module === "FISCAL" ? noMovement : undefined, note.trim() || null)}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Salvar
        </Button>
      </div>
    </div>
  );
}
