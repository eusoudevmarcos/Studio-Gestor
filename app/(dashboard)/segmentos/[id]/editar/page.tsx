import { notFound } from "next/navigation";
import { SegmentForm } from "@/components/forms/segment-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { updateSegment } from "@/lib/actions/segments";
import { getSegment } from "@/lib/data";
import type { RouteParams } from "@/lib/search-params";

export default async function EditSegmentPage({ params }: { params: RouteParams<{ id: string }> }) {
  const { id } = await params;
  const segment = await getSegment(id);

  if (!segment) notFound();

  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      <PageHeader title="Editar segmento" description={segment.name} />
      <Card>
        <CardContent>
          <SegmentForm
            action={updateSegment.bind(null, segment.id)}
            defaultValues={{ name: segment.name, description: segment.description ?? "", active: segment.active }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
