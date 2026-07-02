export type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export type RouteParams<T extends Record<string, string>> = Promise<T>;

export async function readSearchParams(searchParams?: SearchParams) {
  const params = searchParams ? await searchParams : {};

  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]).filter(([, value]) => value),
  ) as Record<string, string>;
}
