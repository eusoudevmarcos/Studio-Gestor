import { Badge } from "@/components/ui/badge";

export function SegmentBadge({ name }: { name?: string | null }) {
  return <Badge variant="violet">{name ?? "Sem segmento"}</Badge>;
}
