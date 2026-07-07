import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@suwa/ui/components/card";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Banknote, CheckCircle2, ShieldCheck } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { getUserRole } from "@/lib/user-role";

const PLATFORM_FEE = 20;

export const Route = createFileRoute("/doctor/payments")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (getUserRole(session?.user) === "pending-doctor") {
      throw redirect({ to: "/doctor/verification" });
    }
  },
  component: DoctorPaymentsPage,
});

function DoctorPaymentsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Banknote className="size-5 text-primary" />
          <h1 className="font-semibold text-2xl tracking-tight">Payments</h1>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          We handle payments and payouts so you can focus on patient care.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-4 text-emerald-500" />
              You receive
            </CardTitle>
            <CardDescription>
              100% of the consultation price you set.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-3xl">100%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-primary" />
              Patient pays
            </CardTitle>
            <CardDescription>
              A {PLATFORM_FEE}% platform fee is added to your price at checkout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-3xl">100% + {PLATFORM_FEE}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How payouts work</CardTitle>
          <CardDescription>
            Patients pay your consultation price plus a {PLATFORM_FEE}% platform
            fee. We collect everything, take our fee, and pay out your earnings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Patient pays your price + {PLATFORM_FEE}% fee at checkout.</p>
            <p>2. Your 100% earnings accumulate in your account.</p>
            <p>3. We send payouts to your bank account on a regular schedule.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
