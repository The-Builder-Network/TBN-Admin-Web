import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import { ActionButton, Async, PageHeader, Pager, StatusBadge } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { fmtDateTime, humanize, isEmptyPage } from "@/lib/format";
import { useAction, useListParams } from "@/lib/hooks";
import type { CreditRequestRow, Paged } from "@/lib/types";

const INVALIDATE = ["credit-requests", "stats", "credits", "tradesperson", "audit-log"];

export default function CreditRequests() {
  const p = useListParams({ status: "PENDING" });
  const status = p.get("status");
  const query = { status, page: p.page };
  const q = useQuery({
    queryKey: ["credit-requests", query],
    queryFn: () => api<Paged<CreditRequestRow>>("/admin/credit-requests", { query }),
    placeholderData: keepPreviousData,
  });
  const resolve = useAction(
    ({ id, approve, note }: { id: string; approve: boolean; note: string }) =>
      api(`/admin/credit-requests/${id}/${approve ? "approve" : "reject"}`, { body: note ? { note } : {} }),
    { success: ({ approve }) => (approve ? "Credits returned" : "Request rejected"), invalidate: INVALIDATE },
  );

  return (
    <>
      <PageHeader title="Credit requests" description="Tradespeople asking for a lead fee back. Pending requests show oldest first." />
      <Tabs value={status} onValueChange={(v) => p.set({ status: v })} className="mb-4">
        <TabsList>
          {["PENDING", "APPROVED", "REJECTED"].map((s) => (
            <TabsTrigger key={s} value={s}>
              {humanize(s)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Async q={q} isEmpty={isEmptyPage} empty={`No ${status.toLowerCase()} credit requests.`}>
        {(d) => (
          <>
            <ul className="space-y-4">
              {d.data.map((r) => (
                <li key={r.id}>
                  <Card>
                    <CardContent className="space-y-3 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            {humanize(r.reason)} · {r.credits} credits
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <Link to={`/tradespeople/${r.tradesperson.id}`} className="text-primary hover:underline">
                              {r.tradesperson.name}
                            </Link>{" "}
                            ({r.tradesperson.email}) · {fmtDateTime(r.createdAt)}
                          </p>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="rounded-md bg-muted p-3 text-sm">
                        <p>
                          <span className="font-medium">Job #{r.job.jobNumber}</span> {r.job.title} <StatusBadge status={r.job.status} />
                        </p>
                        <p className="text-muted-foreground">
                          Homeowner: {r.job.homeowner.name} ({r.job.homeowner.email}) · Lead {humanize(r.lead.status).toLowerCase()}
                          {r.lead.shortlistedAt && `, shortlisted ${fmtDateTime(r.lead.shortlistedAt)}`}
                        </p>
                      </div>
                      <p className="whitespace-pre-line text-sm">{r.details}</p>
                      {r.status !== "PENDING" && (
                        <p className="text-xs text-muted-foreground">
                          {humanize(r.status)} by {r.reviewedByName ?? "—"} on {fmtDateTime(r.reviewedAt)}
                          {r.adminNote && ` · “${r.adminNote}”`}
                        </p>
                      )}
                      {r.status === "PENDING" && (
                        <div className="flex flex-wrap gap-2">
                          <ActionButton
                            label="Approve"
                            icon={<Check />}
                            size="sm"
                            title={`Return ${r.credits} credits to ${r.tradesperson.name}?`}
                            note="optional"
                            noteLabel="Note to the tradesperson"
                            onConfirm={(note) => resolve.mutateAsync({ id: r.id, approve: true, note })}
                          />
                          <ActionButton
                            label="Reject"
                            icon={<X />}
                            size="sm"
                            variant="outline"
                            title="Reject credit request"
                            note="required"
                            noteLabel="Reason (sent to the tradesperson)"
                            destructive
                            onConfirm={(note) => resolve.mutateAsync({ id: r.id, approve: false, note })}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
            <Pager meta={d.meta} onPage={(page) => p.set({ page })} />
          </>
        )}
      </Async>
    </>
  );
}
