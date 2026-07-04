import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Scale,
  Stethoscope,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@suwa/ui/components/button";
import { Separator } from "@suwa/ui/components/separator";
import { authClient } from "@/lib/auth-client";
import { getUserRole } from "@/lib/user-role";
import { client } from "@/utils/orpc";
import Loader from "@/components/loader";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

type OnboardingRole = "tenant" | "doctor";

type RoleFeature = {
  icon: LucideIcon;
  label: string;
};

type RoleOption = {
  value: OnboardingRole;
  icon: LucideIcon;
  label: string;
  tagline: string;
  features: RoleFeature[];
};

const roleOptions: RoleOption[] = [
  {
    value: "doctor",
    icon: Stethoscope,
    label: "Doctor",
    tagline: "Provide care and manage your patients",
    features: [
      { icon: Building2, label: "Connect your hospitals and clinics" },
      { icon: CalendarClock, label: "Set and share your availability" },
      { icon: Wallet, label: "Track your earnings" },
    ],
  },
  {
    value: "tenant",
    icon: Building2,
    label: "Tenant",
    tagline: "Manage a clinic or a network of practices",
    features: [
      { icon: Building2, label: "Run multiple hospitals from one hub" },
      { icon: Users, label: "Manage doctors across every location" },
      { icon: Scale, label: "Balance doctor time and clinic capacity" },
    ],
  },
];

function OnboardingPage() {
  const navigate = useNavigate({ from: "/onboarding" });
  const { data: session, isPending } = authClient.useSession();
  const [role, setRole] = useState<OnboardingRole>("doctor");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      navigate({ to: "/login" });
      return;
    }
    const currentRole = getUserRole(session.user);
    if (currentRole && currentRole !== "user") {
      navigate({ to: "/" });
    }
  }, [session, isPending, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await client.setOnboardingRole({
        role: role === "doctor" ? "pending-doctor" : "tenant-admin",
      });
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setLoading(false);
  };

  if (isPending) {
    return <Loader />;
  }

  const selectedOption = roleOptions.find((opt) => opt.value === role) ?? roleOptions[0];
  const SelectedIcon = selectedOption.icon;

  return (
    <div className="flex items-center justify-center bg-muted p-6 md:p-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border bg-card shadow-sm md:grid-cols-2">

        <div className="relative hidden flex-col justify-between bg-muted/60 p-8 md:flex">
          <Link className="font-semibold text-lg tracking-tight" to="/">
            Suwa
          </Link>

          <div className="flex flex-1 items-center justify-center">
            <div className="flex size-40 items-center justify-center rounded-full border border-dashed border-muted-foreground/30">
              <div className="flex size-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-all">
                <SelectedIcon className="size-9" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sm">{selectedOption.label}</span>
            <span className="text-muted-foreground text-xs">{selectedOption.tagline}</span>
          </div>
        </div>

        {/* Right panel — the actual onboarding form */}
        <div className="flex flex-col justify-center p-6 md:p-10">
          <div className="mb-6 flex flex-col gap-2 md:hidden">
            <Link className="font-semibold text-lg tracking-tight" to="/">
              Suwa
            </Link>
          </div>

          <div className="mb-6 flex flex-col gap-1">
            <h1 className="font-semibold text-xl tracking-tight">Set up your workspace</h1>
            <p className="text-muted-foreground text-sm">
              Pick the role that matches how you'll use Suwa. You can't change this later.
            </p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3">
              {roleOptions.map((opt) => {
                const isSelected = role === opt.value;
                const RoleIcon = opt.icon;
                return (
                  <button
                    aria-pressed={isSelected}
                    className={`relative flex flex-col gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                    key={opt.value}
                    onClick={() => setRole(opt.value)}
                    type="button"
                  >
                    {isSelected && (
                      <CheckCircle2 className="absolute top-4 right-4 size-5 fill-primary text-primary-foreground" />
                    )}

                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <RoleIcon className="size-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{opt.label}</span>
                        <span className="text-muted-foreground text-xs">{opt.tagline}</span>
                      </div>
                    </div>

                    {isSelected && (
                      <>
                        <Separator />
                        <ul className="flex flex-col gap-2">
                          {opt.features.map((feature) => {
                            const FeatureIcon = feature.icon;
                            return (
                              <li className="flex items-center gap-2 text-xs" key={feature.label}>
                                <FeatureIcon className="size-3.5 shrink-0 text-primary" />
                                <span className="text-foreground">{feature.label}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-destructive text-sm">
                <span>{error}</span>
              </div>
            )}

            <Button className="w-full" disabled={loading} type="submit">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Setting up...
                </span>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
