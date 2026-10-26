import { useId, useState, type ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { AlertCircle, ChevronLeft, ChevronRight, Inbox, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { errMsg } from "@/lib/api";
import { humanize } from "@/lib/format";
import type { Paged } from "@/lib/types";
import { cn } from "@/lib/utils";

const tone: Record<string, string> = {
  PENDING: "bg-warning/15 text-amber-800 border-warning/30",
  INFO_REQUESTED: "bg-info/15 text-sky-800 border-info/30",
  APPROVED: "bg-success/15 text-green-800 border-success/30",
  ACTIVE: "bg-success/15 text-green-800 border-success/30",
  HIRED: "bg-primary/10 text-primary border-primary/20",
  COMPLETED: "bg-primary/10 text-primary border-primary/20",
  REJECTED: "bg-destructive/10 text-red-700 border-destructive/30",
  SUSPENDED: "bg-destructive/10 text-red-700 border-destructive/30",
  DELETED: "bg-muted text-muted-foreground",
  HIDDEN: "bg-destructive/10 text-red-700 border-destructive/30",
};

export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap font-medium", tone[status] ?? "bg-muted text-foreground")}>
      {humanize(status)}
    </Badge>
  );
}

export function PageHeader({ title, description, children }: { title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

/** Loading / error / empty states around a query; renders children only with data. */
export function Async<T>({
  q,
  isEmpty,
  empty = "Nothing here yet.",
  children,
}: {
  q: UseQueryResult<T>;
  isEmpty?: (d: T) => boolean;
  empty?: string;
  children: (d: T) => ReactNode;
}) {
  if (q.isPending)
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  if (q.isError)
    return (
      <div role="alert" className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <span className="flex-1">{errMsg(q.error)}</span>
        <Button size="sm" variant="outline" onClick={() => q.refetch()}>
          Retry
        </Button>
      </div>
    );
  if (isEmpty?.(q.data))
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-background p-10 text-sm text-muted-foreground">
        <Inbox className="h-6 w-6" />
        {empty}
      </div>
    );
  return <>{children(q.data)}</>;
}

export function Pager({ meta, onPage }: { meta: Paged<unknown>["meta"]; onPage: (p: number) => void }) {
  if (meta.totalPages <= 1) return <p className="mt-3 text-xs text-muted-foreground">{meta.total} total</p>;
  return (
    <nav className="mt-4 flex items-center justify-between gap-2 text-sm" aria-label="Pagination">
      <span className="text-muted-foreground">
        Page {meta.page} of {meta.totalPages} · {meta.total} total
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
          <ChevronLeft /> Previous
        </Button>
        <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>
          Next <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}

export function SearchBox({ value, onSearch, placeholder }: { value: string; onSearch: (q: string) => void; placeholder: string }) {
  const [draft, setDraft] = useState(value);
  return (
    <form
      role="search"
      className="relative w-full sm:w-72"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(draft.trim());
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          if (!e.target.value) onSearch(""); // clearing the box resets the filter
        }}
        className="bg-background pl-9"
      />
    </form>
  );
}

/** Native select styled like shadcn inputs. */
export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Button that opens a confirm dialog, optionally collecting a note.
 * `onConfirm` should reject on failure (the caller toasts the error) so the dialog stays open.
 */
export function ActionButton({
  label,
  icon,
  title,
  description,
  note = "none",
  noteLabel = "Note",
  confirmLabel,
  destructive,
  onConfirm,
  ...btn
}: {
  label: string;
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  note?: "required" | "optional" | "none";
  noteLabel?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: (note: string) => Promise<unknown>;
} & Omit<ButtonProps, "onClick" | "title">) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const id = useId();
  const blocked = note === "required" && !text.trim();

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (busy) return;
        setOpen(o);
        if (!o) setText("");
      }}
    >
      <DialogTrigger asChild>
        <Button variant={destructive ? "destructive" : undefined} {...btn}>
          {icon}
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (blocked) return;
            setBusy(true);
            try {
              await onConfirm(text.trim());
              setOpen(false);
              setText("");
            } catch {
              /* toasted by caller */
            } finally {
              setBusy(false);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {note !== "none" && (
            <div className="space-y-2">
              <label htmlFor={id} className="text-sm font-medium">
                {noteLabel}
                {note === "optional" && <span className="font-normal text-muted-foreground"> (optional)</span>}
              </label>
              <Textarea id={id} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} rows={4} required={note === "required"} autoFocus />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" variant={destructive ? "destructive" : "default"} disabled={busy || blocked}>
              {busy && <Loader2 className="animate-spin" />}
              {confirmLabel ?? label}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-sm">{children ?? "—"}</dd>
    </div>
  );
}

/** Compact key: value rendering of an audit-log `details` JSON object. */
export function Details({ details }: { details: unknown }) {
  if (!details || typeof details !== "object") return null;
  const entries = Object.entries(details as Record<string, unknown>).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (!entries.length) return null;
  return (
    <p className="mt-1 break-words text-xs">
      {entries.map(([k, v]) => (
        <span key={k} className="mr-3">
          <span className="text-muted-foreground">{k}:</span> {typeof v === "object" ? JSON.stringify(v) : String(v)}
        </span>
      ))}
    </p>
  );
}
