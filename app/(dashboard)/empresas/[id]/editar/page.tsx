import { notFound } from "next/navigation";
import { CompanyForm } from "@/components/forms/company-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { updateCompany } from "@/lib/actions/companies";
import { formatCnpj } from "@/lib/accounting";
import { getCompany, getFormOptions } from "@/lib/data";
import type { RouteParams } from "@/lib/search-params";

export default async function EditCompanyPage({ params }: { params: RouteParams<{ id: string }> }) {
  const { id } = await params;
  const [item, options] = await Promise.all([getCompany(id), getFormOptions()]);

  if (!item) notFound();

  return (
    <div className="mx-auto grid max-w-5xl gap-5">
      <PageHeader title="Editar empresa" description={item.name} />
      <Card>
        <CardContent>
          <CompanyForm
            action={updateCompany.bind(null, item.id)}
            users={options.users}
            defaultValues={{
              code: item.code ?? "",
              name: item.name,
              document: item.document ? formatCnpj(item.document) : "",
              stateRegistration: item.stateRegistration ?? "",
              districtRegistration: item.districtRegistration ?? "",
              status: item.status,
              mainResponsibleUserId: item.mainResponsibleUserId ?? "",
              notes: item.notes ?? "",
              accountingTaxRegime: item.accountingTaxRegime ?? undefined,
              accountingActivity: item.accountingActivity ?? undefined,
              accountingState: (item.accountingState as never) ?? undefined,
              hasMonthlyMovement: item.hasMonthlyMovement ?? true,
              issuesInvoices: item.issuesInvoices,
              hasRentalIrrf: item.hasRentalIrrf,
              employeesCount: item.employeesCount ?? undefined,
              modules: item.modules,
              stepOverrides: item.stepOverrides,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
