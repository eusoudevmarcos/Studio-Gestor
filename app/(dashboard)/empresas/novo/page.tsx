import { CompanyForm } from "@/components/forms/company-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createCompany } from "@/lib/actions/companies";
import { getFormOptions } from "@/lib/data";

export default async function NewCompanyPage() {
  const options = await getFormOptions();

  return (
    <div className="mx-auto grid max-w-5xl gap-5">
      <PageHeader title="Nova empresa" description="Informe o perfil e as obrigações da matriz são calculadas automaticamente." />
      <Card>
        <CardContent>
          <CompanyForm action={createCompany} users={options.users} />
        </CardContent>
      </Card>
    </div>
  );
}
