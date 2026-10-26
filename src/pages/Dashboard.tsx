import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Async, PageHeader } from "@/components/shared";
import { api } from "@/lib/api";
import { fmtPence } from "@/lib/format";
import type { Stats } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const q = useQuery({ queryKey: ["stats"], queryFn: () => api<Stats>("/admin/stats") });

  return (
    <>
      <PageHeader title="Dashboard" description="What needs attention today." />
      <Async q={q}>
        {(s) => {
          const cards: { label: string; value: string | number; to?: string; urgent?: boolean }[] = [
            { label: "Pending verifications", value: s.pendingVerifications, to: "/verifications", urgent: s.pendingVerifications > 0 },
            { label: "Info requested", value: s.infoRequested, to: "/verifications?status=INFO_REQUESTED" },
            { label: "Pending credit requests", value: s.pendingCreditRequests, to: "/credit-requests", urgent: s.pendingCreditRequests > 0 },
            { label: "Approved trades", value: s.approvedTrades, to: "/verifications?status=APPROVED" },
            { label: "Tradespeople", value: s.tradespeople, to: "/users?role=TRADESPERSON" },
            { label: "Homeowners", value: s.homeowners, to: "/users?role=HOMEOWNER" },
            { label: "Active jobs", value: s.activeJobs, to: "/jobs?status=ACTIVE" },
            { label: "Total jobs", value: s.totalJobs, to: "/jobs" },
            { label: "Revenue (completed payments)", value: fmtPence(s.revenuePence) },
          ];
          return (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map((c) => {
                const body = (
                  <>
                    <p className="text-sm text-muted-foreground">{c.label}</p>
                    <p className={cn("mt-2 text-3xl font-semibold tabular-nums", c.urgent && "text-primary")}>{c.value}</p>
                    {c.to && <ArrowRight className="absolute right-4 top-4 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />}
                  </>
                );
                const cls = cn("group relative block rounded-lg border bg-card p-5 shadow-card", c.urgent && "border-primary/40");
                return c.to ? (
                  <Link
                    key={c.label}
                    to={c.to}
                    className={cn(cls, "transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
                  >
                    {body}
                  </Link>
                ) : (
                  <div key={c.label} className={cls}>
                    {body}
                  </div>
                );
              })}
            </div>
          );
        }}
      </Async>
    </>
  );
}
