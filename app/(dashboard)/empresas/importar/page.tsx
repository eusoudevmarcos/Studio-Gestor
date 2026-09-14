import { ImportCompaniesForm } from "@/components/forms/import-companies-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function ImportCompaniesPage() {
  return (
    <div className="mx-auto grid max-w-4xl gap-5">
      <PageHeader title="Importar da planilha" description="Cole as linhas do cadastro (fiscal ou folha) para criar ou atualizar as empresas de uma vez." />
      <Card>
        <CardContent>
          <ImportCompaniesForm />
        </CardContent>
      </Card>
    </div>
  );
}
