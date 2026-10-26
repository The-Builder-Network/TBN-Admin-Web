import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { errMsg } from "./api";

/** List filters live in the URL so back/forward and shared links keep them. */
export function useListParams(defaults: Record<string, string> = {}) {
  const [params, setParams] = useSearchParams();
  const get = (k: string) => params.get(k) ?? defaults[k] ?? "";
  const set = (patch: Record<string, string | number | undefined>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (!("page" in patch)) next.delete("page"); // new filter → back to page 1
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined || v === "" || String(v) === defaults[k]) next.delete(k);
          else next.set(k, String(v));
        }
        return next;
      },
      { replace: true },
    );
  return { get, set, page: Number(params.get("page") ?? 1) || 1 };
}

/** Mutation with success/error toasts and cache invalidation of the given query-key prefixes. */
export function useAction<V>(
  fn: (vars: V) => Promise<unknown>,
  opts: { success: string | ((vars: V) => string); invalidate: string[] },
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (_d, vars) => {
      toast.success(typeof opts.success === "function" ? opts.success(vars) : opts.success);
      opts.invalidate.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    },
    onError: (e) => toast.error(errMsg(e)),
  });
}
