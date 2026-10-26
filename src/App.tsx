import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { ApiError } from "@/lib/api";
import { Layout } from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Verifications from "@/pages/Verifications";
import Tradesperson from "@/pages/Tradesperson";
import CreditRequests from "@/pages/CreditRequests";
import Users from "@/pages/Users";
import Jobs from "@/pages/Jobs";
import Reviews from "@/pages/Reviews";
import LeadFees from "@/pages/LeadFees";
import AuditLog from "@/pages/AuditLog";
import Account from "@/pages/Account";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Don't retry client errors (404, 400…); one retry for network/5xx.
      retry: (n, e) => !(e instanceof ApiError && e.status < 500) && n < 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="verifications" element={<Verifications />} />
            <Route path="tradespeople/:userId" element={<Tradesperson />} />
            <Route path="credit-requests" element={<CreditRequests />} />
            <Route path="users" element={<Users />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="lead-fees" element={<LeadFees />} />
            <Route path="audit-log" element={<AuditLog />} />
            <Route path="account" element={<Account />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" closeButton />
    </QueryClientProvider>
  );
}
