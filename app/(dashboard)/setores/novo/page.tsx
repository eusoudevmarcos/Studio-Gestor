import { DepartmentForm } from "@/components/forms/department-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createDepartment } from "@/lib/actions/departments";
import { getFormOptions } from "@/lib/data";

export default async function NewDepartmentPage() {
  const options = await getFormOptions();

  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      <PageHeader title="Novo setor" description="Crie uma área responsável pela execução de rotinas e tarefas." />
      <Card><CardContent><DepartmentForm action={createDepartment} segments={options.segments} /></CardContent></Card>
    </div>
  );
}
