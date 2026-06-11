import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import { Card, CardContent, CardHeader } from "@zen-doc/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@zen-doc/ui/components/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@zen-doc/ui/components/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@zen-doc/ui/components/input-group";
import { Label } from "@zen-doc/ui/components/label";
import { Separator } from "@zen-doc/ui/components/separator";
import { format } from "date-fns";
import {
  ArrowUpCircle,
  BanknoteIcon,
  CheckCircle2,
  Clock,
  DollarSignIcon,
  History,
  Info,
  Loader2,
  Wallet,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import { MetricCard } from "@/components/dashboard-metrics";
import {
  useConnectAccountStatus,
  useDoctorCredits,
} from "@/hooks/queries/doctor";
import { notify } from "@/lib/notify";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/doctor/credits")({
  component: DoctorCreditsRoute,
});

function DoctorCreditsRoute() {
  const [showCashout, setShowCashout] = useState(false);
  const [cashoutCents, setCashoutCents] = useState("");

  const creditsQuery = useDoctorCredits();

  const cashoutMutation = useMutation(
    orpc.requestCashout.mutationOptions({
      onSuccess: async () => {
        notify.success("Cashout initiated successfully");
        setShowCashout(false);
        setCashoutCents("");
        await creditsQuery.refetch();
      },
      onError: (error: Error) => {
        notify.error(error instanceof Error ? error.message : "Cashout failed");
      },
    })
  );

  const connectStatusQuery = useConnectAccountStatus();

  const stripeConnected = connectStatusQuery.data?.stripeAccountEnabled;

  const createConnectLinkMutation = useMutation(
    orpc.createConnectAccountLink.mutationOptions({
      onSuccess: (data) => {
        window.open(data.url, "_blank");
      },
      onError: (error: Error) => {
        notify.error(
          error instanceof Error
            ? error.message
            : "Failed to create Stripe link"
        );
      },
    })
  );

  const data = creditsQuery.data;
  const credits = data?.credits;
  const cashoutRequests = (data?.cashoutRequests ?? []) as Array<{
    amountCents: number;
    createdAt: string;
    id: string;
    status: string;
  }>;

  const balanceCents = credits?.balanceCents ?? 0;
  const totalEarnedCents = credits?.totalEarnedCents ?? 0;
  const totalCashedOutCents = credits?.totalCashedOutCents ?? 0;

  function formatCents(cents: number): string {
    return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function handleCashout() {
    const amount = Math.round(Number.parseFloat(cashoutCents) * 100);
    if (Number.isNaN(amount) || amount <= 0) {
      notify.error("Enter a valid amount");
      return;
    }
    if (amount > balanceCents) {
      notify.error("Insufficient balance");
      return;
    }
    cashoutMutation.mutate({ amountCents: amount });
  }

  const sortedHistory = [...cashoutRequests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const statusConfig: Record<string, { bg: string; icon: React.ReactNode }> = {
    completed: {
      bg: "bg-emerald-500/10 text-emerald-600",
      icon: <ArrowUpCircle className="h-4 w-4" />,
    },
    failed: {
      bg: "bg-rose-500/10 text-rose-600",
      icon: <XCircle className="h-4 w-4" />,
    },
    pending: {
      bg: "bg-amber-500/10 text-amber-600",
      icon: <Clock className="h-4 w-4" />,
    },
  };

  function statusStyle(status: string) {
    return statusConfig[status] ?? statusConfig.pending;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-br from-background via-background to-muted/20">
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Credits dashboard</Badge>
              <Badge variant="secondary">Live overview</Badge>
            </div>

            <div className="space-y-2">
              <h1 className="font-semibold text-4xl tracking-tight">
                Earnings & payouts
              </h1>

              <p className="max-w-2xl text-muted-foreground text-sm md:text-base">
                Monitor balances, review payout activity, and request cashouts
                from your Stripe connected account.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1" />

        <Dialog onOpenChange={setShowCashout} open={showCashout}>
          <DialogTrigger
            render={
              <Button className="mt-2 shadow-sm md:mt-0" size="lg">
                <ArrowUpCircle className="mr-2 h-4 w-4" />
                Request Payout
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
              <DialogDescription>
                Transfer funds to your Stripe Connect account.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/50 p-4">
                <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Available Balance
                </span>
                <span className="font-bold text-2xl text-foreground">
                  {formatCents(balanceCents)}
                </span>
              </div>
              {balanceCents <= 0 && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700 text-xs dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Your balance is zero. Complete sessions to earn credits before
                  requesting a payout.
                </p>
              )}
              {connectStatusQuery.isFetched && stripeConnected === false && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700 text-xs dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Stripe Connect account not set up.{" "}
                  <button
                    className="font-medium underline"
                    disabled={createConnectLinkMutation.isPending}
                    onClick={() =>
                      createConnectLinkMutation.mutate({
                        returnUrl: window.location.href,
                        refreshUrl: window.location.href,
                      })
                    }
                    type="button"
                  >
                    {createConnectLinkMutation.isPending
                      ? "Connecting..."
                      : "Connect now"}
                  </button>
                </p>
              )}
              <div className="grid gap-2">
                <Label className="font-semibold text-sm" htmlFor="amount">
                  Amount to Withdraw (USD)
                </Label>
                <InputGroup className="h-9">
                  <InputGroupInput
                    id="amount"
                    max={balanceCents / 100}
                    min={1}
                    onChange={(e) => setCashoutCents(e.target.value)}
                    placeholder="0.00"
                    type="number"
                    value={cashoutCents}
                  />
                  <InputGroupAddon align="inline-start">
                    <span className="text-muted-foreground text-sm">$</span>
                  </InputGroupAddon>
                </InputGroup>
                <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Info className="h-3 w-3" />
                  Payouts are typically processed instantly to your connected
                  account.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button onClick={() => setShowCashout(false)} variant="ghost">
                Cancel
              </Button>
              <Button
                disabled={
                  cashoutMutation.isPending ||
                  !cashoutCents ||
                  Number.parseFloat(cashoutCents) <= 0
                }
                onClick={handleCashout}
              >
                {cashoutMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Confirm Payout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {creditsQuery.isPending ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-border/60 border-dashed">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
        </div>
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              description="Available for your next payout request"
              icon={<Wallet className="size-5" />}
              title="Current balance"
              trend="Ready"
              value={formatCents(balanceCents)}
            />

            <MetricCard
              description="Total revenue generated from completed sessions"
              icon={<DollarSignIcon className="size-5" />}
              title="Lifetime earnings"
              value={formatCents(totalEarnedCents)}
            />

            <MetricCard
              description="Funds already withdrawn to Stripe"
              icon={<BanknoteIcon className="size-5" />}
              title="Total payouts"
              value={formatCents(totalCashedOutCents)}
            />
          </section>

          <Card className="rounded-3xl border-border/60">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="font-semibold text-xl tracking-tight">
                    Transaction history
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Recent payout requests and their statuses
                  </p>
                </div>

                <Badge className="gap-1" variant="secondary">
                  <History className="size-3" />
                  Payout timeline
                </Badge>
              </div>
            </CardHeader>

            <Separator />

            <CardContent>
              {sortedHistory.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <History />
                    </EmptyMedia>
                    <EmptyTitle>No transactions found</EmptyTitle>
                    <EmptyDescription>
                      Your payout requests will appear here.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="flex flex-col gap-3">
                  {sortedHistory.map((req) => (
                    <Card
                      className="rounded-2xl border-border/60 transition-colors duration-200 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary"
                      key={req.id}
                    >
                      <CardContent className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`rounded-2xl border bg-muted/40 p-2.5 ${statusStyle(req.status).bg}`}
                          >
                            {statusStyle(req.status).icon}
                          </div>

                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              Payout request
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {format(
                                new Date(req.createdAt),
                                "EEE, MMM d • h:mm a"
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <p className="font-semibold text-sm tracking-tight">
                            -{formatCents(req.amountCents)}
                          </p>
                          <Badge className="h-6 px-2" variant="outline">
                            {req.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
