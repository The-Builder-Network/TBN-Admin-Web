import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ActionButton, Async, PageHeader, Pager, SearchBox, Select, StatusBadge } from "@/components/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { fmtDate, humanize, isEmptyPage } from "@/lib/format";
import { useAction, useListParams } from "@/lib/hooks";
import type { Paged, UserRow } from "@/lib/types";

const INVALIDATE = ["users", "tradesperson", "verifications", "stats", "audit-log"];

export default function Users() {
  const p = useListParams();
  const query = { q: p.get("q"), role: p.get("role"), status: p.get("status"), page: p.page };
  const q = useQuery({
    queryKey: ["users", query],
    queryFn: () => api<Paged<UserRow>>("/admin/users", { query }),
    placeholderData: keepPreviousData,
  });
  const suspend = useAction(({ id, note }: { id: string; note: string }) => api(`/admin/users/${id}/suspend`, { body: { note } }), {
    success: "Account suspended",
    invalidate: INVALIDATE,
  });
  const reinstate = useAction((id: string) => api(`/admin/users/${id}/reinstate`, { body: {} }), {
    success: "Account reinstated",
    invalidate: INVALIDATE,
  });

  return (
    <>
      <PageHeader title="Users" description="Homeowners, tradespeople and admins, newest first." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchBox value={p.get("q")} onSearch={(v) => p.set({ q: v })} placeholder="Search name, email, phone" />
        <Select
          label="Role"
          value={p.get("role")}
          onChange={(v) => p.set({ role: v })}
          options={[["", "All"], ["HOMEOWNER", "Homeowner"], ["TRADESPERSON", "Tradesperson"], ["ADMIN", "Admin"]]}
        />
        <Select
          label="Status"
          value={p.get("status")}
          onChange={(v) => p.set({ status: v })}
          options={[["", "All"], ["ACTIVE", "Active"], ["SUSPENDED", "Suspended"], ["DELETED", "Deleted"]]}
        />
      </div>
      <Async q={q} isEmpty={isEmptyPage} empty="No users match these filters.">
        {(d) => (
          <>
            <div className="rounded-lg border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                    <TableHead className="text-right">Jobs</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last login</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.data.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        {u.role === "TRADESPERSON" ? (
                          <Link to={`/tradespeople/${u.id}`} className="font-medium text-primary hover:underline">
                            {u.name}
                          </Link>
                        ) : (
                          <span className="font-medium">{u.name}</span>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {u.email}
                          {!u.emailVerified && " (unverified)"}
                          {u.phone && ` · ${u.phone}`}
                        </div>
                      </TableCell>
                      <TableCell>{humanize(u.role)}</TableCell>
                      <TableCell>
                        <StatusBadge status={u.accountStatus} />
                      </TableCell>
                      <TableCell>{u.role === "TRADESPERSON" ? <StatusBadge status={u.verificationStatus} /> : "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {u.credits ? `${u.credits.balance}${u.credits.reserved ? ` (+${u.credits.reserved} res.)` : ""}` : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{u.role === "HOMEOWNER" ? u.jobsPosted : "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{fmtDate(u.createdAt)}</TableCell>
                      <TableCell className="whitespace-nowrap">{fmtDate(u.lastLoginAt)}</TableCell>
                      <TableCell className="text-right">
                        {u.role !== "ADMIN" && u.accountStatus === "ACTIVE" && (
                          <ActionButton
                            label="Suspend"
                            size="sm"
                            variant="outline"
                            title={`Suspend ${u.name}?`}
                            description="They are signed out, blocked from signing in and emailed this reason."
                            note="required"
                            noteLabel="Reason"
                            confirmLabel="Suspend account"
                            destructive
                            onConfirm={(note) => suspend.mutateAsync({ id: u.id, note })}
                          />
                        )}
                        {u.accountStatus === "SUSPENDED" && (
                          <ActionButton
                            label="Reinstate"
                            size="sm"
                            variant="outline"
                            title={`Reinstate ${u.name}?`}
                            onConfirm={() => reinstate.mutateAsync(u.id)}
                          />
                        )}
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
