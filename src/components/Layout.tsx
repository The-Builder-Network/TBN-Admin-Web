import { useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import {
  Briefcase,
  ClipboardList,
  Coins,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  ShieldCheck,
  Star,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUser, logout } from "@/lib/api";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/verifications", label: "Verifications", icon: ShieldCheck },
  { to: "/credit-requests", label: "Credit requests", icon: ReceiptText },
  { to: "/users", label: "Users", icon: Users },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/lead-fees", label: "Lead fees", icon: Coins },
  { to: "/audit-log", label: "Audit log", icon: ClipboardList },
  { to: "/account", label: "Account", icon: UserCog },
];

export function Layout() {
  const user = getUser();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;

  const sidebar = (
    <nav aria-label="Main" className="flex h-full flex-col gap-1 p-3">
      {nav.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
            )
          }
        >
          <Icon className="h-4 w-4" aria-hidden />
          {label}
        </NavLink>
      ))}
      <div className="mt-auto border-t pt-3">
        <p className="truncate px-3 text-sm font-medium">{user.name}</p>
        <p className="truncate px-3 text-xs text-muted-foreground">{user.email}</p>
        <Button variant="ghost" className="mt-2 w-full justify-start" onClick={logout}>
          <LogOut /> Sign out
        </Button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-background focus:p-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4 lg:hidden">
        <Button variant="ghost" size="icon" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </Button>
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo-black.png" alt="The Builder Network" className="h-7" />
          <span className="text-xs font-semibold uppercase text-muted-foreground">Admin</span>
        </Link>
      </header>
      {open && <div className="fixed inset-0 top-14 z-20 bg-black/30 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <aside
        className={cn(
          "fixed bottom-0 left-0 top-14 z-20 w-64 border-r bg-background transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0",
          open ? "translate-x-0" : "invisible -translate-x-full lg:visible",
        )}
      >
        <Link to="/" className="hidden h-16 items-center gap-2 border-b px-4 lg:flex">
          <img src="/logo-black.png" alt="The Builder Network" className="h-6" />
          <span className="text-xs font-semibold uppercase text-muted-foreground">Admin</span>
        </Link>
        <div className="h-full lg:h-[calc(100vh-4rem)]">{sidebar}</div>
      </aside>
      <main id="main" className="min-w-0 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
