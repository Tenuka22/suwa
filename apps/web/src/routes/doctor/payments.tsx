import { Badge } from "@suwa/ui/components/badge";
import { Button } from "@suwa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@suwa/ui/components/card";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ArrowUpRight, Banknote, CheckCircle2, ShieldCheck } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { getUserRole } from "@/lib/user-role";
import { client } from "@/utils/orpc";

const POLAR_PAYOUT_URL = "https://polar.sh/to/dashboard/finance/account";
const PLATFORM_SHARE = 20;
const DOCTOR_SHARE = 80;

export const Route = createFileRoute("/doctor/payments")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (getUserRole(session?.user) === "pending-doctor") {
      throw redirect({ to: "/doctor/verification" });
    }
  },
  loader: async () => {
    const result = await client.doctorProfile();
    return { profile: result.profile };
  },
  component: DoctorPaymentsPage,
});

function DoctorPaymentsPage() {
  const { profile } = Route.useLoaderData();
  const connected = profile?.polarPayoutAccountEnabled ?? false;
  const payoutAccountId = profile?.polarPayoutAccountId ?? null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Banknote className="size-5 text-primary" />
          <h1 className="font-semibold text-2xl tracking-tight">Payments</h1>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Connect your Polar payout account so your consultation earnings can be
          paid out to your bank account.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Doctor share
            </CardTitle>
            <CardDescription>
              You receive the majority of each patient payment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-3xl">{DOCTOR_SHARE}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-primary" />
              Platform fee
            </CardTitle>
            <CardDescription>
              We keep the rest to run the marketplace and support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-3xl">{PLATFORM_SHARE}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">Polar account</CardTitle>
            <CardDescription>
              Connect your Polar payout account to receive earnings.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Badge className="w-fit" variant={connected ? "default" : "outline"}>
              {connected ? "Connected" : "Not connected"}
            </Badge>
            {payoutAccountId ? (
              <p className="text-muted-foreground text-sm">
                Account ID: <span className="font-mono">{payoutAccountId}</span>
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                No payout account linked yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How payouts work</CardTitle>
          <CardDescription>
            Patients pay the full checkout amount. Polar settles your balance to
            your connected payout account, and we account for a 20% platform
            share on the doctor earnings side.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Patient completes a Polar checkout.</p>
            <p>2. We record 80% as the doctor's earnings.</p>
            <p>3. Polar sends eligible payouts to the connected account.</p>
          </div>
          <Button asChild size="lg">
            <a href={POLAR_PAYOUT_URL} rel="noreferrer" target="_blank">
              {connected ? "Manage Polar account" : "Connect Polar account"}
              <ArrowUpRight className="size-4" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
