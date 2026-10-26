import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Ban, Check, ExternalLink, FileText, HelpCircle, Loader2, RefreshCw, RotateCcw, X } from "lucide-react";
import { ActionButton, Async, Details, Field, Pager, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { fmtDate, fmtDateTime, humanize } from "@/lib/format";
import { useAction } from "@/lib/hooks";
import type { CreditTx, Paged, TradespersonDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

const INVALIDATE = ["tradesperson", "verifications", "users", "stats", "audit-log"];

export default function Tradesperson() {
  const { userId = "" } = useParams();
  const q = useQuery({
    queryKey: ["tradesperson", userId],
    queryFn: () => api<TradespersonDetail>(`/admin/tradespeople/${userId}`),
    staleTime: 0, // presigned ID URLs expire after 5 minutes
  });

  return (
    <>
      <Link to="/verifications" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Verification queue
      </Link>
      <Async q={q}>{(d) => <Detail d={d} fetchedAt={q.dataUpdatedAt} refetching={q.isFetching} refetch={() => q.refetch()} />}</Async>
    </>
  );
}

function Detail({ d, fetchedAt, refetching, refetch }: { d: TradespersonDetail; fetchedAt: number; refetching: boolean; refetch: () => void }) {
  const { user, profile } = d;
  const id = user.id;
  const vs = profile.verificationStatus;
  const locked = vs === "SUSPENDED" || user.accountStatus !== "ACTIVE";

  const verify = useAction(
    ({ action, note }: { action: "approve" | "reject" | "request-info"; note: string }) =>
      api(`/admin/tradespeople/${id}/${action}`, { body: action === "approve" && !note ? {} : { note } }),
    {
      success: ({ action }) => ({ approve: "Tradesperson approved", reject: "Verification rejected", "request-info": "Information requested" })[action],
      invalidate: INVALIDATE,
    },
  );
  const suspend = useAction((note: string) => api(`/admin/users/${id}/suspend`, { body: { note } }), {
    success: "Account suspended",
    invalidate: INVALIDATE,
  });
  const reinstate = useAction(() => api(`/admin/users/${id}/reinstate`, { body: {} }), {
    success: "Account reinstated",
    invalidate: INVALIDATE,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl">
            {user.name} <StatusBadge status={vs} />
            {user.accountStatus !== "ACTIVE" && <StatusBadge status={user.accountStatus} />}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile.companyName ?? "No company"} · {humanize(profile.trade)} · @{profile.username}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton
            label="Approve"
            icon={<Check />}
            title={`Approve ${user.name}?`}
            description="They will be notified, appear in search and can express interest in leads."
            note="optional"
            noteLabel="Message to include in the approval email"
            disabled={locked || vs === "APPROVED"}
            onConfirm={(note) => verify.mutateAsync({ action: "approve", note })}
          />
          <ActionButton
            label="Request info"
            icon={<HelpCircle />}
            variant="outline"
            title="Request more information"
            description="The tradesperson sees this note and is asked to resubmit."
            note="required"
            noteLabel="What do you need from them?"
            confirmLabel="Send request"
            disabled={locked}
            onConfirm={(note) => verify.mutateAsync({ action: "request-info", note })}
          />
          <ActionButton
            label="Reject"
            icon={<X />}
            variant="outline"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            title="Reject verification"
            description="The tradesperson is emailed this reason and can update their profile and resubmit."
            note="required"
            noteLabel="Reason"
            confirmLabel="Reject"
            destructive
            disabled={locked || vs === "REJECTED"}
            onConfirm={(note) => verify.mutateAsync({ action: "reject", note })}
          />
          {user.accountStatus === "SUSPENDED" ? (
            <ActionButton
              label="Reinstate"
              icon={<RotateCcw />}
              variant="outline"
              title={`Reinstate ${user.name}?`}
              description={profile.verifiedAt ? "They were verified before, so they return to Approved." : "They return to Not submitted and must resubmit for verification."}
              onConfirm={() => reinstate.mutateAsync(undefined)}
            />
          ) : (
            <ActionButton
              label="Suspend"
              icon={<Ban />}
              title={`Suspend ${user.name}?`}
              description="They are signed out, blocked from signing in and emailed this reason. You can reinstate later."
              note="required"
              noteLabel="Reason"
              confirmLabel="Suspend account"
              destructive
              disabled={user.accountStatus !== "ACTIVE"}
              onConfirm={(note) => suspend.mutateAsync(note)}
            />
          )}
        </div>
      </div>
      {locked && user.accountStatus !== "DELETED" && (
        <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">Reinstate the account before changing its verification.</p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Status">
                  <StatusBadge status={vs} />
                </Field>
                <Field label="Submitted">{fmtDateTime(profile.submittedAt)}</Field>
                <Field label="Verified">{fmtDateTime(profile.verifiedAt)}</Field>
                <Field label="Last reviewed">{fmtDateTime(profile.reviewedAt)}</Field>
                <Field label="Reviewed by">{profile.reviewedByName ?? "—"}</Field>
                <Field label="Note to tradesperson">{profile.verificationNote ?? "—"}</Field>
              </dl>
            </CardContent>
          </Card>

          <IdDocument profile={profile} fetchedAt={fetchedAt} refetching={refetching} refetch={refetch} />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Company">{profile.companyName ?? "—"}</Field>
                <Field label="Trade">{humanize(profile.trade)}</Field>
                <Field label="Postcode">{profile.postcode ?? "—"}</Field>
                <Field label="Work radius">{profile.workRadiusMiles} miles</Field>
                <Field label="Response time">{profile.responseTime ?? "—"}</Field>
                <Field label="Guarantee">{profile.guarantee ? "Yes" : "No"}</Field>
                <Field label="Rating">
                  {profile.reviewCount ? `${profile.avgRating.toFixed(1)} (${profile.reviewCount} reviews)` : "No reviews"}
                </Field>
                <Field label="Completed jobs">{profile.completedJobs}</Field>
              </dl>
              <Field label="Bio">
                <span className="whitespace-pre-line">{profile.bio || "—"}</span>
              </Field>
              <Field label="Services">
                {profile.services.length ? (
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {profile.services.map((s) => (
                      <li key={s.serviceSlug + s.tradeSlug} className="rounded-full bg-muted px-3 py-1 text-xs">
                        {s.serviceName}
                        {s.tradeSlug && <span className="text-muted-foreground"> · {humanize(s.tradeSlug)}</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  "None selected"
                )}
              </Field>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Insurance</h3>
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Public liability">{profile.publicLiability ?? "—"}</Field>
                  <Field label="Employers' liability">{profile.employersLiability ?? "—"}</Field>
                  <Field label="Professional indemnity">{profile.professionalIndemnity ?? "—"}</Field>
                  <Field label="Insurance verified">{profile.insuranceVerified ? "Yes" : "No"}</Field>
                  <Field label="Expires">{fmtDate(profile.insuranceExpiresAt)}</Field>
                </dl>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Qualifications</h3>
                {profile.qualifications.length ? (
                  <ul className="space-y-1 text-sm">
                    {profile.qualifications.map((qq) => (
                      <li key={qq.id}>
                        {qq.name}
                        {qq.year && <span className="text-muted-foreground"> ({qq.year})</span>}
                        {qq.verified && <span className="ml-2 text-xs text-success">verified</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">None listed.</p>
                )}
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Documents</h3>
                {profile.documents.length ? (
                  <ul className="space-y-1 text-sm">
                    {profile.documents.map((doc) => (
                      <li key={doc.id}>
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          <FileText className="h-4 w-4" /> {doc.fileName}
                        </a>
                        <span className="ml-2 text-xs text-muted-foreground">{fmtDate(doc.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">None uploaded.</p>
                )}
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Portfolio</h3>
                {profile.portfolioItems.length ? (
                  <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                    {profile.portfolioItems.map((item) => (
                      <li key={item.id}>
                        <a href={item.imageUrl} target="_blank" rel="noreferrer" title={item.title ?? undefined} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <img src={item.imageUrl} alt={item.title ?? "Portfolio image"} loading="lazy" className="aspect-square w-full rounded-md object-cover" />
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No portfolio images.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Email">
                  {user.email} {user.emailVerified ? <span className="text-xs text-success">verified</span> : <span className="text-xs text-warning">unverified</span>}
                </Field>
                <Field label="Phone">{user.phone ?? "—"}</Field>
                <Field label="Account status">
                  <StatusBadge status={user.accountStatus} />
                </Field>
                <Field label="Suspension reason">{user.suspensionReason ?? "—"}</Field>
                <Field label="Joined">{fmtDate(user.createdAt)}</Field>
                <Field label="Last login">{fmtDateTime(user.lastLoginAt)}</Field>
                <Field label="Leads">
                  {Object.keys(d.leads).length ? Object.entries(d.leads).map(([k, v]) => `${humanize(k)}: ${v}`).join(", ") : "None"}
                </Field>
              </dl>
            </CardContent>
          </Card>

          <Credits userId={id} balance={d.credits.balance} reserved={d.credits.reserved} />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Audit log</CardTitle>
            </CardHeader>
            <CardContent>
              {d.auditLog.length ? (
                <ol className="space-y-3 text-sm">
                  {d.auditLog.map((a) => (
                    <li key={a.id} className="border-l-2 pl-3">
                      <p className="font-medium">{humanize(a.action.replace(".", " "))}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.adminName} · {fmtDateTime(a.createdAt)}
                      </p>
                      <Details details={a.details} />
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">No admin actions yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|bmp)$/i;

function IdDocument({
  profile,
  fetchedAt,
  refetching,
  refetch,
}: {
  profile: TradespersonDetail["profile"];
  fetchedAt: number;
  refetching: boolean;
  refetch: () => void;
}) {
  const [broken, setBroken] = useState<string | null>(null);
  const url = profile.idDocumentUrl;
  let path = "";
  try {
    path = url ? new URL(url).pathname : "";
  } catch {
    /* relative or malformed URL */
  }
  const isImage = IMAGE_EXT.test(profile.idDocumentName ?? "") || IMAGE_EXT.test(path);
  const expiresAt = profile.idDocumentUrlExpiresInSeconds ? new Date(fetchedAt + profile.idDocumentUrlExpiresInSeconds * 1000) : null;

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-lg">ID document</CardTitle>
        {url && (
          <Button variant="outline" size="sm" onClick={() => { setBroken(null); refetch(); }} disabled={refetching}>
            {refetching ? <Loader2 className="animate-spin" /> : <RefreshCw />} Refresh link
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {!url ? (
          <p className="text-sm text-muted-foreground">No ID document uploaded.</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {profile.idDocumentName ?? "Document"} · uploaded {fmtDate(profile.idDocumentUploadedAt)}
              {expiresAt && ` · link valid until ${expiresAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`}
            </p>
            {isImage && broken !== url ? (
              <a href={url} target="_blank" rel="noreferrer" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <img src={url} alt="Uploaded ID document" onError={() => setBroken(url)} className="max-h-[480px] w-auto rounded-md border object-contain" />
              </a>
            ) : (
              broken === url && <p className="text-sm text-destructive">The preview didn't load. The link may have expired; refresh it.</p>
            )}
            <Button asChild variant="outline" size="sm">
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink /> Open document
              </a>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Credits({ userId, balance, reserved }: { userId: string; balance: number; reserved: number }) {
  const [page, setPage] = useState(1);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const ledger = useQuery({
    queryKey: ["credits", userId, page],
    queryFn: () => api<Paged<CreditTx>>(`/admin/users/${userId}/credits`, { query: { page, perPage: 10 } }),
    placeholderData: keepPreviousData,
  });
  const adjust = useAction((body: { amount: number; note: string }) => api(`/admin/users/${userId}/credits`, { body }), {
    success: ({ amount: a }) => `${a > 0 ? "Added" : "Removed"} ${Math.abs(a)} credit${Math.abs(a) === 1 ? "" : "s"}`,
    invalidate: ["tradesperson", "credits", "users", "audit-log"],
  });
  const n = Number(amount);
  const valid = Number.isInteger(n) && n !== 0 && Math.abs(n) <= 10000 && note.trim().length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Credits</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="text-2xl font-semibold tabular-nums">{balance}</p>
          </div>
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs text-muted-foreground">Reserved</p>
            <p className="text-2xl font-semibold tabular-nums">{reserved}</p>
          </div>
        </div>

        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            adjust.mutate(
              { amount: n, note: note.trim() },
              {
                onSuccess: () => {
                  setAmount("");
                  setNote("");
                },
              },
            );
          }}
        >
          <p className="text-sm font-medium">Adjust balance</p>
          <div className="flex gap-2">
            <div className="w-28 shrink-0">
              <label htmlFor="credit-amount" className="sr-only">
                Amount (negative to debit)
              </label>
              <Input id="credit-amount" type="number" step={1} min={-10000} max={10000} placeholder="±0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="flex-1">
              <label htmlFor="credit-note" className="sr-only">
                Reason
              </label>
              <Input id="credit-note" placeholder="Reason (required)" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Use a negative amount to debit.</p>
            <Button type="submit" size="sm" disabled={!valid || adjust.isPending}>
              {adjust.isPending && <Loader2 className="animate-spin" />}
              {n < 0 ? "Debit" : "Credit"}
            </Button>
          </div>
        </form>

        <div>
          <p className="mb-2 text-sm font-medium">Ledger</p>
          <Async q={ledger} isEmpty={(d) => d.data.length === 0} empty="No transactions.">
            {(d) => (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.data.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="whitespace-nowrap text-xs">{fmtDateTime(t.createdAt)}</TableCell>
                        <TableCell className="text-xs">
                          {humanize(t.type)}
                          {t.note && <div className="text-muted-foreground">{t.note}</div>}
                        </TableCell>
                        <TableCell className={cn("text-right tabular-nums", t.amount > 0 && "text-success", t.amount < 0 && "text-destructive")}>
                          {t.amount > 0 ? `+${t.amount}` : t.amount || (t.reservedChange ? `(${t.reservedChange > 0 ? "+" : ""}${t.reservedChange} res.)` : 0)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{t.balanceAfter}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Pager meta={d.meta} onPage={setPage} />
              </>
            )}
          </Async>
        </div>
      </CardContent>
    </Card>
  );
}
