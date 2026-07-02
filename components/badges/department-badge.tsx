import { Badge } from "@/components/ui/badge";

export function DepartmentBadge({ name }: { name?: string | null }) {
  return <Badge variant="outline">{name ?? "Sem setor"}</Badge>;
}
