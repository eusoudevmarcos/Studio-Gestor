import { ClosingPage } from "@/components/closing/closing-page";
import type { SearchParams } from "@/lib/search-params";

export default function PayrollPage({ searchParams }: { searchParams: SearchParams }) {
  return <ClosingPage module="FOLHA" searchParams={searchParams} />;
}
