import { ClosingPage } from "@/components/closing/closing-page";
import type { SearchParams } from "@/lib/search-params";

export default function FiscalPage({ searchParams }: { searchParams: SearchParams }) {
  return <ClosingPage module="FISCAL" searchParams={searchParams} />;
}
