import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { ActionButton, Async, PageHeader, Pager, SearchBox, Select, StatusBadge } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { fmtDate, isEmptyPage } from "@/lib/format";
import { useAction, useListParams } from "@/lib/hooks";
import type { Paged, ReviewRow } from "@/lib/types";

export default function Reviews() {
  const p = useListParams();
  const query = { q: p.get("q"), status: p.get("status"), page: p.page };
  const q = useQuery({
    queryKey: ["reviews", query],
    queryFn: () => api<Paged<ReviewRow>>("/admin/reviews", { query }),
    placeholderData: keepPreviousData,
  });
  const setHidden = useAction(
    ({ id, hide, note }: { id: string; hide: boolean; note?: string }) =>
      api(`/admin/reviews/${id}/${hide ? "hide" : "unhide"}`, { body: hide ? { note } : {} }),
    { success: ({ hide }) => (hide ? "Review hidden" : "Review restored"), invalidate: ["reviews", "audit-log"] },
  );

  return (
    <>
      <PageHeader title="Reviews" description="Hidden reviews are removed from profiles and the rating average." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchBox value={p.get("q")} onSearch={(v) => p.set({ q: v })} placeholder="Search review text" />
        <Select
          label="Show"
          value={p.get("status")}
          onChange={(v) => p.set({ status: v })}
          options={[["", "All"], ["visible", "Visible"], ["hidden", "Hidden"]]}
        />
      </div>
      <Async q={q} isEmpty={isEmptyPage} empty="No reviews match these filters.">
        {(d) => (
          <>
            <ul className="space-y-4">
              {d.data.map((r) => (
                <li key={r.id}>
                  <Card className={r.hiddenAt ? "opacity-80" : undefined}>
                    <CardContent className="space-y-2 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="flex items-center gap-1 font-semibold" aria-label={`${r.rating} out of 5 stars`}>
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} className={i < r.rating ? "h-4 w-4 fill-star text-star" : "h-4 w-4 text-border"} aria-hidden />
                            ))}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {r.author.name} →{" "}
                            <Link to={`/tradespeople/${r.subject.id}`} className="text-primary hover:underline">
                              {r.subject.name}
                            </Link>
                            {r.job && ` · Job #${r.job.jobNumber} ${r.job.title}`} · {fmtDate(r.createdAt)}
                          </p>
                        </div>
                        {r.hiddenAt ? (
                          <ActionButton
                            label="Unhide"
                            size="sm"
                            variant="outline"
                            title="Restore this review?"
                            description="It will show on the profile again and count towards the rating."
                            onConfirm={() => setHidden.mutateAsync({ id: r.id, hide: false })}
                          />
                        ) : (
                          <ActionButton
                            label="Hide"
                            size="sm"
                            variant="outline"
                            title="Hide this review?"
                            description="It is removed from the profile and the rating average."
                            note="required"
                            noteLabel="Reason"
                            destructive
                            onConfirm={(note) => setHidden.mutateAsync({ id: r.id, hide: true, note })}
                          />
                        )}
                      </div>
                      <p className="whitespace-pre-line text-sm">{r.comment}</p>
                      {r.hiddenAt && (
                        <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <StatusBadge status="HIDDEN" /> {fmtDate(r.hiddenAt)}
                          {r.hiddenReason && ` · ${r.hiddenReason}`}
                        </p>
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
