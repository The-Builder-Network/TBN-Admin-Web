import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, errMsg, getUser, saveTokens } from "@/lib/api";

export default function Account() {
  const user = getUser();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const mismatch = form.confirm !== "" && form.confirm !== form.newPassword;
  const change = useMutation({
    mutationFn: () =>
      api<{ message: string; accessToken: string; refreshToken: string }>("/auth/change-password", {
        body: { currentPassword: form.currentPassword, newPassword: form.newPassword },
      }),
    onSuccess: (res) => {
      saveTokens(res); // other sessions are signed out; this one gets fresh tokens
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      toast.success(res.message || "Password updated");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const field = (key: keyof typeof form, label: string, autoComplete: string) => (
    <div className="space-y-2">
      <label htmlFor={key} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={key}
        type="password"
        autoComplete={autoComplete}
        required
        minLength={key === "currentPassword" ? 1 : 8}
        maxLength={128}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        aria-invalid={key === "confirm" && mismatch}
        aria-describedby={key === "confirm" && mismatch ? "confirm-error" : undefined}
      />
    </div>
  );

  return (
    <>
      <PageHeader title="Account" description={user ? `Signed in as ${user.email}` : undefined} />
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">Change password</CardTitle>
          <CardDescription>At least 8 characters. Other devices are signed out.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!mismatch) change.mutate();
            }}
          >
            {field("currentPassword", "Current password", "current-password")}
            {field("newPassword", "New password", "new-password")}
            {field("confirm", "Confirm new password", "new-password")}
            {mismatch && (
              <p id="confirm-error" role="alert" className="text-sm text-destructive">
                Passwords don't match.
              </p>
            )}
            <Button type="submit" disabled={change.isPending || mismatch}>
              {change.isPending && <Loader2 className="animate-spin" />}
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
