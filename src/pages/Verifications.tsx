import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Check, Minus } from "lucide-react";
import { Async, PageHeader, Pager, SearchBox } from "@/components/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { fmtDate, humanize, isEmptyPage } from "@/lib/format";
import { useListParams } from "@/lib/hooks";
import type { Paged, VerificationRow } from "@/lib/types";

const STATUSES = ["PENDING", "INFO_REQUESTED", "APPROVED", "REJECTED", "SUSPENDED", "NOT_SUBMITTED"];

export default function Verifications() {
  const p = useListParams({ status: "PENDING" });
  const status = p.get("status");
  const query = { status, q: p.get("q"), page: p.page };
  const q = useQuery({
    queryKey: ["verifications", query],
    queryFn: () => api<Paged<VerificationRow>>("/admin/verifications", { query }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title="Verifications" description="Review tradesperson profiles. Oldest submissions first.">
        <SearchBox value={p.get("q")} onSearch={(v) => p.set({ q: v })} placeholder="Search name, company, email" />
      </PageHeader>
      <Tabs value={status} onValueChange={(v) => p.set({ status: v })} className="mb-4 max-w-full overflow-x-auto">
        <TabsList>
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s}>
              {humanize(s)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Async q={q} isEmpty={isEmptyPage} empty={`No ${humanize(status).toLowerCase()} tradespeople.`}>
        {(d) => (
          <>
            <div className="rounded-lg border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Trade</TableHead>
                    <TableHead>Postcode</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.data.map((r) => (
                    <TableRow key={r.userId}>
                      <TableCell>
                        <Link to={`/tradespeople/${r.userId}`} className="font-medium text-primary hover:underline">
                          {r.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">{r.email}</div>
                      </TableCell>
                      <TableCell>{r.companyName ?? "—"}</TableCell>
                      <TableCell>{humanize(r.trade)}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.postcode ?? "—"}</TableCell>
                      <TableCell className="max-w-64 text-xs">
                        {r.services.length ? r.services.map(humanize).join(", ") : "—"}
                      </TableCell>
                      <TableCell>
                        {r.hasIdDocument ? (
                          <Check className="h-4 w-4 text-success" aria-label="ID uploaded" />
                        ) : (
                          <Minus className="h-4 w-4 text-muted-foreground" aria-label="No ID" />
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{fmtDate(r.submittedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pager meta={d.meta} onPage={(page) => p.set({ page })} />
          </>
        )}
      </Async>
    </>
  );
}
