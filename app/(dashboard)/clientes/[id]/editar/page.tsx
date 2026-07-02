import { notFound } from "next/navigation";
import { ClientProjectForm } from "@/components/forms/client-project-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { updateClientProject } from "@/lib/actions/clients";
import { getClientProject, getFormOptions } from "@/lib/data";
import type { RouteParams } from "@/lib/search-params";

export default async function EditClientProjectPage({ params }: { params: RouteParams<{ id: string }> }) {
  const { id } = await params;
  const [item, options] = await Promise.all([getClientProject(id), getFormOptions()]);

  if (!item) notFound();

  return (
    <div className="mx-auto grid max-w-4xl gap-5">
      <PageHeader title="Editar cliente/projeto" description={item.name} />
      <Card>
        <CardContent>
          <ClientProjectForm
            action={updateClientProject.bind(null, item.id)}
            segments={options.segments}
            users={options.users}
            defaultValues={{
              name: item.name,
              document: item.document ?? "",
              type: item.type,
              status: item.status,
              segmentId: item.segmentId ?? "",
              mainResponsibleUserId: item.mainResponsibleUserId ?? "",
              notes: item.notes ?? "",
              accountingTaxRegime: item.accountingTaxRegime ?? "",
              accountingActivity: item.accountingActivity ?? "",
              accountingState: item.accountingState ?? "",
              hasMonthlyMovement: item.hasMonthlyMovement ?? undefined,
              issuesInvoices: item.issuesInvoices ?? undefined,
              invoiceModels: item.invoiceModels ?? [],
              hasRentalIrrf: item.hasRentalIrrf ?? false,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
