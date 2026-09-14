import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { clientProjectStatusLabels, recurrenceLabels, taskStatusLabels } from "@/lib/labels";
import { clientProjectStatuses, routineRecurrences, taskStatuses } from "@/lib/validations/entities";

type Option = { id: string; name: string | null };

export function ClientProjectFilters({ segments }: { segments: Option[] }) {
  return (
    <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[1fr_180px_220px_auto]">
      <Input name="q" placeholder="Buscar por nome ou documento" />
      <Select name="status" defaultValue="">
        <option value="">Todos os status</option>
        {clientProjectStatuses.map((status) => (
          <option key={status} value={status}>{clientProjectStatusLabels[status]}</option>
        ))}
      </Select>
      <Select name="segmentId" defaultValue="">
        <option value="">Todos os segmentos</option>
        {segments.map((segment) => (
          <option key={segment.id} value={segment.id}>{segment.name}</option>
        ))}
      </Select>
      <Button type="submit" variant="outline">
        <Search className="h-4 w-4" />
        Filtrar
      </Button>
    </form>
  );
}

export function TaskFilters({ segments, departments, users, clients }: { segments: Option[]; departments: Option[]; users: Option[]; clients: Option[] }) {
  return (
    <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 lg:grid-cols-[1fr_repeat(5,170px)_auto]">
      <Input name="q" placeholder="Buscar tarefa, empresa ou descrição" />
      <Select name="status" defaultValue="">
        <option value="">Status</option>
        {taskStatuses.map((status) => (
          <option key={status} value={status}>{taskStatusLabels[status]}</option>
        ))}
      </Select>
      <Select name="segmentId" defaultValue="">
        <option value="">Segmento</option>
        {segments.map((segment) => (
          <option key={segment.id} value={segment.id}>{segment.name}</option>
        ))}
      </Select>
      <Select name="departmentId" defaultValue="">
        <option value="">Setor</option>
        {departments.map((department) => (
          <option key={department.id} value={department.id}>{department.name}</option>
        ))}
      </Select>
      <Select name="responsibleId" defaultValue="">
        <option value="">Responsável</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>{user.name}</option>
        ))}
      </Select>
      <Select name="clientProjectId" defaultValue="">
        <option value="">Empresa</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>{client.name}</option>
        ))}
      </Select>
      <Button type="submit" variant="outline">
        <Search className="h-4 w-4" />
        Filtrar
      </Button>
    </form>
  );
}

export function RoutineFilters({ segments, departments }: { segments: Option[]; departments: Option[] }) {
  return (
    <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[1fr_200px_200px_180px_auto]">
      <Input name="q" placeholder="Buscar rotina" />
      <Select name="segmentId" defaultValue="">
        <option value="">Segmento</option>
        {segments.map((segment) => (
          <option key={segment.id} value={segment.id}>{segment.name}</option>
        ))}
      </Select>
      <Select name="departmentId" defaultValue="">
        <option value="">Setor</option>
        {departments.map((department) => (
          <option key={department.id} value={department.id}>{department.name}</option>
        ))}
      </Select>
      <Select name="recurrence" defaultValue="">
        <option value="">Recorrência</option>
        {routineRecurrences.map((recurrence) => (
          <option key={recurrence} value={recurrence}>{recurrenceLabels[recurrence]}</option>
        ))}
      </Select>
      <Button type="submit" variant="outline">
        <Search className="h-4 w-4" />
        Filtrar
      </Button>
    </form>
  );
}
