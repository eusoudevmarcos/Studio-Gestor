import { SegmentForm } from "@/components/forms/segment-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createSegment } from "@/lib/actions/segments";

export default function NewSegmentPage() {
  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      <PageHeader title="Novo segmento" description="Crie um segmento para agrupar setores, rotinas e clientes/projetos." />
      <Card><CardContent><SegmentForm action={createSegment} /></CardContent></Card>
    </div>
  );
}
