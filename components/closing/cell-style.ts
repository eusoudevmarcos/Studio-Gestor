import { format } from "date-fns";
import { cellStatusShortLabels, type CellStatus, type ClosingCellView } from "@/lib/closing";

// Cores iguais às da planilha: verde = feito, branco = pendente, preto = não se aplica,
// amarelo = atenção, vermelho = marcador (ex.: IRRF) ainda pendente.
export const cellStatusClasses: Record<CellStatus, string> = {
  NAO_APLICA: "bg-slate-900 text-slate-900 border-slate-900",
  PENDENTE: "bg-white text-slate-400 border-slate-200 hover:bg-slate-50",
  OK: "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600",
  SEM_MOVIMENTO: "bg-emerald-200 text-emerald-900 border-emerald-300 hover:bg-emerald-300",
  NAO_DEVIDO: "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200",
  ATENCAO: "bg-amber-400 text-amber-950 border-amber-500 hover:bg-amber-500",
};

export const flaggedPendingClasses = "bg-rose-600 text-white border-rose-700 hover:bg-rose-700";

export const cellLegend: { status: CellStatus; label: string }[] = [
  { status: "OK", label: "Concluído" },
  { status: "SEM_MOVIMENTO", label: "Sem movimento" },
  { status: "NAO_DEVIDO", label: "Não devido no mês" },
  { status: "PENDENTE", label: "Pendente" },
  { status: "ATENCAO", label: "Atenção" },
  { status: "NAO_APLICA", label: "Não se aplica" },
];

export function cellClasses(cell: Pick<ClosingCellView, "status" | "flag">) {
  if (cell.status === "PENDENTE" && cell.flag) return flaggedPendingClasses;
  return cellStatusClasses[cell.status];
}

// Texto exibido dentro da célula, imitando a planilha ("ok", "20.08", "S. Mov.", "Não", "IRRF"...).
export function cellText(cell: Pick<ClosingCellView, "status" | "flag" | "note" | "doneAt">) {
  if (cell.status === "NAO_APLICA") return "";
  if (cell.note) return cell.note.length > 10 ? `${cell.note.slice(0, 9)}…` : cell.note;
  if (cell.status === "OK" && cell.doneAt) return format(new Date(cell.doneAt), "dd.MM");
  if (cell.status === "PENDENTE" && cell.flag) return cell.flag;
  return cellStatusShortLabels[cell.status];
}
