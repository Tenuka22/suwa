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
import { Textarea } from "@suwa/ui/components/textarea";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Banknote, Building, Loader2, CreditCard, ArrowUpRight, History } from "lucide-react";
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
  const [savingInfo, setSavingInfo] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutInfoText, setPayoutInfoText] = useState("");

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const data = await client.payoutStatus();
      setStatus(data);
      if (data.payoutInfo) {
        setPayoutInfoText(data.payoutInfo);
      }
    } catch (err) {
      toast.error("Failed to load payment status");
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePayoutInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!payoutInfoText.trim()) {
      toast.error("Please enter your payout details");
      return;
    }
    setSavingInfo(true);
    try {
      await client.savePayoutInfo({ payoutInfo: payoutInfoText });
      toast.success("Payout details saved successfully");
      await fetchStatus();
    } catch (err) {
      toast.error("Failed to save payout details");
    } finally {
      setSavingInfo(false);
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
      toast.success("Payout requested successfully");
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
          Manage your earnings, update your payout details, and request withdrawals.
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
                Transfer your available balance to your preferred account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status?.hasPayoutInfo ? (
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
                  You must save your payout details before requesting a withdrawal.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="size-5 text-primary" />
                Payout Details
              </CardTitle>
              <CardDescription>
                Provide your PayPal email, Wise account, or Bank details for payouts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePayoutInfo} className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="payoutInfo">Payment Instructions</Label>
                  <Textarea
                    id="payoutInfo"
                    className="min-h-24 resize-y"
                    placeholder="e.g. PayPal: myemail@example.com&#10;or Bank: Account 123456, Routing 987654"
                    value={payoutInfoText}
                    onChange={(e) => setPayoutInfoText(e.target.value)}
                    disabled={savingInfo}
                  />
                </div>
                <Button type="submit" disabled={savingInfo || !payoutInfoText.trim() || payoutInfoText === status?.payoutInfo}>
                  {savingInfo && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Save Details
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
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

