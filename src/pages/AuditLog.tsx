import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Async, Details, PageHeader, Pager, SearchBox } from "@/components/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { fmtDateTime, humanize, isEmptyPage } from "@/lib/format";
import { useListParams } from "@/lib/hooks";
import type { AuditLogRow, Paged } from "@/lib/types";

// Actions whose USER target is always a tradesperson, so the detail page exists.
const TRADE_ACTIONS = /^(verification|credits)\./;

export default function AuditLog() {
  const p = useListParams();
  const query = { q: p.get("q"), page: p.page, perPage: 50 };
  const q = useQuery({
    queryKey: ["audit-log", query],
    queryFn: () => api<Paged<AuditLogRow>>("/admin/audit-log", { query }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title="Audit log" description="Every admin action, newest first.">
        <SearchBox value={p.get("q")} onSearch={(v) => p.set({ q: v })} placeholder="Action (e.g. verification) or target ID" />
      </PageHeader>
      <Async q={q} isEmpty={isEmptyPage} empty="No audit entries.">
        {(d) => (
          <>
            <div className="rounded-lg border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.data.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="whitespace-nowrap">{fmtDateTime(a.createdAt)}</TableCell>
                      <TableCell>{a.admin.name}</TableCell>
                      <TableCell className="whitespace-nowrap font-medium">{a.action}</TableCell>
                      <TableCell className="text-xs">
                        {humanize(a.targetType)}{" "}
                        {a.targetType === "USER" && TRADE_ACTIONS.test(a.action) ? (
                          <Link to={`/tradespeople/${a.targetId}`} className="font-mono text-primary hover:underline">
                            {a.targetId}
                          </Link>
                        ) : (
                          <span className="font-mono">{a.targetId}</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <Details details={a.details} />
                      </TableCell>
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
