"use client";

import { Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { importCompanies, type ImportResult } from "@/lib/actions/companies";

const example = `COD\tEMPRESA\tCNPJ\tINSC. ESTAD.\tCF/DF\tATIV\tUF\tREGIME\tFUNC
1\tEXEMPLO RESTAURANTE\t12345678000199\t12345678\t\tICMS\tRJ\tLP\t6
2\tEXEMPLO SERVICOS\t98765432000111\t\t0712345678901\tISS\tDF\tSN\t0`;

export function ImportCompaniesForm() {
  const [pending, startTransition] = useTransition();
  const [rows, setRows] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.append("rows", rows);
    startTransition(async () => {
      try {
        const outcome = await importCompanies(formData);
        setResult(outcome);
        if (outcome.created + outcome.updated > 0) setRows("");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Falha ao importar.");
      }
    });
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="rows">Linhas da planilha</Label>
        <Textarea
          id="rows"
          value={rows}
          onChange={(event) => setRows(event.target.value)}
          rows={14}
          placeholder={example}
          className="font-mono text-xs"
        />
        <p className="text-xs text-slate-500">
          Copie as colunas <strong>COD, EMPRESA, CNPJ, INSC. ESTAD., CF/DF, ATIV, UF, REGIME, FUNC, DW NF</strong> (as duas últimas opcionais) direto do Excel e cole aqui
          (separadas por TAB ou &quot;;&quot;). Aceita ATIV como ISS / ICMS / ICMS/ISS e REGIME como SN / LP / LR / MEI. Empresas com o mesmo
          código ou nome são atualizadas, não duplicadas.
        </p>
      </div>
      {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {result ? (
        <div className="grid gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <p>
            <strong>{result.created}</strong> criadas · <strong>{result.updated}</strong> atualizadas · <strong>{result.skipped.length}</strong> ignoradas
          </p>
          {result.skipped.length ? (
            <ul className="grid gap-1 text-xs text-rose-700">
              {result.skipped.map((item) => (
                <li key={item.line}>Linha {item.line}: {item.reason}</li>
              ))}
            </ul>
          ) : null}
          <Link href="/empresas" className="text-xs font-semibold text-emerald-800 underline">Ver empresas</Link>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending || !rows.trim()}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Importar
        </Button>
        <Button type="button" variant="outline" onClick={() => setRows(example)}>Usar exemplo</Button>
      </div>
    </form>
  );
}
