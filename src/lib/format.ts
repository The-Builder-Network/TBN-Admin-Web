const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

export const fmtDate = (d?: string | null) => (d ? dateFmt.format(new Date(d)) : "—");
export const fmtDateTime = (d?: string | null) => (d ? dateTimeFmt.format(new Date(d)) : "—");
export const fmtPence = (p: number) => gbp.format(p / 100);

/** "INFO_REQUESTED" / "kitchen-fitting" → "Info requested" / "Kitchen fitting" */
export function humanize(s?: string | null) {
  if (!s) return "—";
  const t = s.replace(/[_-]+/g, " ").toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export const isEmptyPage = (d: { data: unknown[] }) => d.data.length === 0;
