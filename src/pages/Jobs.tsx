import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Async, PageHeader, Pager, SearchBox, Select, StatusBadge } from "@/components/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { fmtDate, humanize, isEmptyPage } from "@/lib/format";
import { useListParams } from "@/lib/hooks";
import type { JobRow, Paged } from "@/lib/types";

export default function Jobs() {
  const p = useListParams();
  const query = { q: p.get("q"), status: p.get("status"), page: p.page };
  const q = useQuery({
    queryKey: ["jobs", query],
    queryFn: () => api<Paged<JobRow>>("/admin/jobs", { query }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title="Jobs" description="All posted jobs, newest first." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchBox value={p.get("q")} onSearch={(v) => p.set({ q: v })} placeholder="Title, postcode, email or job #" />
        <Select
          label="Status"
          value={p.get("status")}
          onChange={(v) => p.set({ status: v })}
          options={[["", "All"], ...["ACTIVE", "HIRED", "COMPLETED", "CLOSED", "EXPIRED"].map((s): [string, string] => [s, humanize(s)])]}
        />
      </div>
      <Async q={q} isEmpty={isEmptyPage} empty="No jobs match these filters.">
        {(d) => (
          <>
            <div className="rounded-lg border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Homeowner</TableHead>
                    <TableHead className="text-right">Leads / interested</TableHead>
                    <TableHead className="text-right">Fee</TableHead>
                    <TableHead>Hired</TableHead>
                    <TableHead>Posted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.data.map((j) => (
                    <TableRow key={j.id}>
                      <TableCell className="tabular-nums text-muted-foreground">{j.jobNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium">{j.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {humanize(j.serviceSlug)} · {j.postcode}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={j.status} />
                        {j.closeReason && <div className="mt-1 text-xs text-muted-foreground">{humanize(j.closeReason)}</div>}
                      </TableCell>
                      <TableCell>
                        {j.homeowner.name}
                        <div className="text-xs text-muted-foreground">{j.homeowner.email}</div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {j.leadsSent} / {j.interested}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{j.leadFeeCredits}</TableCell>
                      <TableCell>
                        {j.hiredTradesperson ? (
                          <Link to={`/tradespeople/${j.hiredTradesperson.id}`} className="text-primary hover:underline">
                            {j.hiredTradesperson.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{fmtDate(j.createdAt)}</TableCell>
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
