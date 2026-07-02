export type FormAction = (formData: FormData) => Promise<void>;

export function toFormData(values: Record<string, unknown>) {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      formData.append(key, "");
      return;
    }

    if (value instanceof Date) {
      formData.append(key, value.toISOString().slice(0, 10));
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-rose-600">{message}</p>;
}
