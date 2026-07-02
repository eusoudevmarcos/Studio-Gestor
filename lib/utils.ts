import { type ClassValue, clsx } from "clsx";
import { format, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "-";
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "-";
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function isOverdue(date: Date | string, status?: string) {
  if (status === "CONCLUIDO" || status === "CANCELADO") return false;
  return isBefore(startOfDay(new Date(date)), startOfDay(new Date()));
}

export function getInitials(name?: string | null) {
  if (!name) return "SG";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function toDateInputValue(date?: Date | string | null) {
  if (!date) return "";
  return format(new Date(date), "yyyy-MM-dd");
}

export function normalizeFormValue(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}
