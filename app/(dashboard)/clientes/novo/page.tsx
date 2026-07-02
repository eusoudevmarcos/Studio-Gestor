import { ClientProjectForm } from "@/components/forms/client-project-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createClientProject } from "@/lib/actions/clients";
import { getFormOptions } from "@/lib/data";

export default async function NewClientProjectPage() {
  const options = await getFormOptions();

  return (
    <div className="mx-auto grid max-w-4xl gap-5">
      <PageHeader title="Novo cliente/projeto" description="Cadastre um cliente, projeto, processo, candidato ou operação acompanhada." />
      <Card>
        <CardContent>
          <ClientProjectForm action={createClientProject} segments={options.segments} users={options.users} />
        </CardContent>
      </Card>
    </div>
  );
}
