import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@suwa/ui/components/card";
import { Button } from "@suwa/ui/components/button";
import { Input } from "@suwa/ui/components/input";
import { Label } from "@suwa/ui/components/label";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Banknote, Building, Loader2, CreditCard, ArrowUpRight, History, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { getUserRole } from "@/lib/user-role";
import { client } from "@/utils/orpc";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/doctor/payments")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (getUserRole(session?.user) === "pending-doctor") {
      throw redirect({ to: "/doctor/verification" });
    }
  },
  component: DoctorPaymentsPage,
});

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function DoctorPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [connecting, setConnecting] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");

  useEffect(() => {
    // Sync Stripe account status if returning from onboarding
    client.syncConnectAccountStatus().catch(() => {});
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const [payoutData, stripeStatus] = await Promise.all([
        client.payoutStatus(),
        client.getConnectAccountStatus().catch(() => ({ connected: false, enabled: false })),
      ]);
      setStatus({ ...payoutData, ...stripeStatus });
    } catch (err) {
      toast.error("Failed to load payment status");
    } finally {
      setLoading(false);
    }
  }

  async function handleConnectStripe() {
    setConnecting(true);
    try {
      const result = await client.createConnectAccountLink({
        returnUrl: window.location.href,
        refreshUrl: window.location.href,
      });

      if (result.connected) {
        toast.success("Your Stripe account is already connected");
        await fetchStatus();
        return;
      }

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to connect Stripe");
    } finally {
      setConnecting(false);
    }
  }

  async function handleOpenDashboard() {
    try {
      const result = await client.getStripeDashboardLink();
      window.open(result.url, "_blank");
    } catch (err) {
      toast.error("Failed to open Stripe dashboard");
    }
  }

  async function handleRequestPayout(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const cents = Math.round(amount * 100);
    if (cents > (status?.balanceCents ?? 0)) {
      toast.error("Amount exceeds available balance");
      return;
    }

    setRequesting(true);
    try {
      await client.requestPayout({ amountCents: cents });
      toast.success("Payout requested and transfer initiated");
      setPayoutAmount("");
      await fetchStatus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to request payout");
    } finally {
      setRequesting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex size-full items-center justify-center p-8">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Banknote className="size-5 text-primary" />
          <h1 className="font-semibold text-2xl tracking-tight">Payments & Payouts</h1>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Manage your earnings, connect your Stripe account, and request payouts.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="size-4" />
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold tracking-tight">
                {formatCurrency(status?.balanceCents ?? 0)}
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">{formatCurrency(status?.totalEarnedCents ?? 0)}</span> earned
                </div>
                <div>
                  <span className="font-medium text-foreground">{formatCurrency(status?.totalCashedOutCents ?? 0)}</span> cashed out
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpRight className="size-5 text-primary" />
                Request Payout
              </CardTitle>
              <CardDescription>
                Transfer your available balance to your connected Stripe account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status?.connected ? (
                <form onSubmit={handleRequestPayout} className="flex items-end gap-4">
                  <div className="grid gap-2 flex-1">
                    <Label htmlFor="amount">Amount (USD)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="1"
                      max={(status?.balanceCents ?? 0) / 100}
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder="0.00"
                      disabled={requesting || status?.balanceCents === 0}
                    />
                  </div>
                  <Button type="submit" disabled={requesting || status?.balanceCents === 0 || !payoutAmount}>
                    {requesting && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Withdraw
                  </Button>
                </form>
              ) : (
                <div className="rounded-lg border bg-amber-500/10 p-4 text-sm text-amber-600 dark:text-amber-500">
                  Connect your Stripe account below to request payouts.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="size-5 text-primary" />
              Stripe Account
            </CardTitle>
            <CardDescription>
              We use Stripe Connect to securely process payouts to your bank account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status?.connected ? (
              <div className="flex flex-col gap-4">
                <div className="rounded-lg border p-4 bg-emerald-500/5 border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-medium text-emerald-600 dark:text-emerald-500">
                        {status?.enabled ? "Connected" : "Account created"}
                      </span>
                      <span className="text-sm text-muted-foreground mt-0.5">
                        {status?.enabled
                          ? "Ready to receive payouts"
                          : "Complete onboarding on Stripe to enable payouts"}
                      </span>
                    </div>
                  </div>
                </div>

                {status?.stripeAccountId && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account ID</span>
                      <span className="font-mono text-xs">{status.stripeAccountId.slice(0, 8)}...{status.stripeAccountId.slice(-4)}</span>
                    </div>
                    {status?.accountCountry && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Country</span>
                        <span>{status.accountCountry}</span>
                      </div>
                    )}
                    {status?.accountCreatedAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Connected since</span>
                        <span>{formatDate(status.accountCreatedAt, { dateStyle: "medium" })}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Charges</span>
                      <span className={status?.chargesEnabled ? "text-emerald-500" : "text-muted-foreground"}>
                        {status?.chargesEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payouts</span>
                      <span className={status?.payoutsEnabled ? "text-emerald-500" : "text-muted-foreground"}>
                        {status?.payoutsEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Details submitted</span>
                      <span className={status?.detailsSubmitted ? "text-emerald-500" : "text-amber-500"}>
                        {status?.detailsSubmitted ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                )}

                {!status?.enabled && (
                  <div className="rounded-lg border bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-500 space-y-2">
                    <p className="font-medium">Onboarding incomplete</p>
                    <p>You need to complete your Stripe account setup to enable charges and payouts. Click the button below to continue where you left off.</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button variant={status?.enabled ? "outline" : "default"} size="sm" onClick={handleConnectStripe} disabled={connecting}>
                    {connecting ? <Loader2 className="size-4 animate-spin" /> : status?.enabled ? "Update Details" : "Complete onboarding →"}
                  </Button>
                  {status?.enabled && (
                    <Button variant="outline" size="sm" onClick={handleOpenDashboard}>
                      Stripe Dashboard
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-sm">
                  Link your Stripe account to start receiving payouts for your consultations. You will be taken to Stripe to complete the setup.
                </p>
                <Button onClick={handleConnectStripe} disabled={connecting}>
                  {connecting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Connect with Stripe
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-5 text-primary" />
            Payout History
          </CardTitle>
          <CardDescription>Your recent withdrawal requests and their status.</CardDescription>
        </CardHeader>
        <CardContent>
          {!status?.cashoutRequests?.length ? (
            <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg border-dashed">
              No payout history yet.
            </div>
          ) : (
            <div className="divide-y">
              {status.cashoutRequests.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{formatCurrency(req.amountCents)}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(req.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-sm capitalize font-medium ${
                      req.status === 'completed' ? 'text-emerald-500' : 
                      req.status === 'failed' ? 'text-red-500' : 'text-amber-500'
                    }`}>
                      {req.status}
                    </span>
                    {req.failureReason && (
                      <span className="text-xs text-red-500 max-w-[200px] truncate" title={req.failureReason}>
                        {req.failureReason}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
