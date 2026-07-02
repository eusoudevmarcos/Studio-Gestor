import { notFound } from "next/navigation";
import { DepartmentForm } from "@/components/forms/department-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { updateDepartment } from "@/lib/actions/departments";
import { getDepartment, getFormOptions } from "@/lib/data";
import type { RouteParams } from "@/lib/search-params";

export default async function EditDepartmentPage({ params }: { params: RouteParams<{ id: string }> }) {
  const { id } = await params;
  const [department, options] = await Promise.all([getDepartment(id), getFormOptions()]);

  if (!department) notFound();

  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      <PageHeader title="Editar setor" description={department.name} />
      <Card>
        <CardContent>
          <DepartmentForm
            action={updateDepartment.bind(null, department.id)}
            segments={options.segments}
            defaultValues={{
              name: department.name,
              description: department.description ?? "",
              segmentId: department.segmentId ?? "",
              active: department.active,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
