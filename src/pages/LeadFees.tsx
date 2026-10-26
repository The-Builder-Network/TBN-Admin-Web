import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Async, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { useAction } from "@/lib/hooks";
import type { ServiceRow } from "@/lib/types";

export default function LeadFees() {
  const q = useQuery({ queryKey: ["services"], queryFn: () => api<ServiceRow[]>("/admin/services") });
  const [filter, setFilter] = useState("");

  return (
    <>
      <PageHeader
        title="Lead fees"
        description="Credits charged when a tradesperson is shortlisted. Changes apply to newly posted jobs only; existing jobs keep their fee."
      >
        <Input
          type="search"
          aria-label="Filter services"
          placeholder="Filter services"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-background sm:w-72"
        />
      </PageHeader>
      <Async q={q} isEmpty={(d) => d.length === 0} empty="No services found.">
        {(d) => (
          <div className="rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead className="w-64">Lead fee (credits)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d
                  .filter((s) => s.name.toLowerCase().includes(filter.toLowerCase()))
                  .map((s) => (
                    <FeeRow key={s.slug} service={s} />
                  ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Async>
    </>
  );
}

function FeeRow({ service }: { service: ServiceRow }) {
  const [value, setValue] = useState(String(service.leadFeeCredits));
  const save = useAction((fee: number) => api(`/admin/services/${service.slug}`, { method: "PATCH", body: { leadFeeCredits: fee } }), {
    success: (fee) => `${service.name}: lead fee set to ${fee}`,
    invalidate: ["services", "audit-log"],
  });
  const n = Number(value);
  const valid = value !== "" && Number.isInteger(n) && n >= 0 && n <= 500;
  const dirty = n !== service.leadFeeCredits;
  const id = `fee-${service.slug}`;

  return (
    <TableRow>
      <TableCell>
        <label htmlFor={id} className="font-medium">
          {service.name}
        </label>
        <div className="text-xs text-muted-foreground">{service.slug}</div>
      </TableCell>
      <TableCell>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid && dirty) save.mutate(n);
          }}
        >
          <Input
            id={id}
            type="number"
            min={0}
            max={500}
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={!valid}
            className="w-24"
          />
          {dirty && (
            <>
              <Button type="submit" size="sm" disabled={!valid || save.isPending}>
                {save.isPending && <Loader2 className="animate-spin" />}
                Save
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setValue(String(service.leadFeeCredits))}>
                Cancel
              </Button>
            </>
          )}
        </form>
      </TableCell>
    </TableRow>
  );
}
