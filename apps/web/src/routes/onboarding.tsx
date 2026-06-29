import { useNavigate } from "@tanstack/react-router";
import { APP_DISPLAY_NAME } from "@suwa/app-info";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authClient, setOnboardingRole } from "@/utils/auth";
import { Button } from "@suwa/ui/components/button";
import { Card, CardContent } from "@suwa/ui/components/card";
import { queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

type OnboardingRole = "tenant" | "doctor";

const roleOptions: { value: OnboardingRole; label: string; description: string }[] = [
  { value: "tenant", label: "Tenant", description: "Manage a clinic or practice" },
  { value: "doctor", label: "Doctor", description: "Provide care & manage patients" },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const [role, setRole] = useState<OnboardingRole>("tenant");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      navigate({ to: "/sign-in" });
      return;
    }
    const currentRole = (session.user)?.role;
    if (currentRole && currentRole !== "user") {
      navigate({ to: "/" });
    }
  }, [session, isPending, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await setOnboardingRole(role === "doctor" ? "pending-doctor" : "tenant-admin");
      queryClient.invalidateQueries();
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="relative flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Link className="font-semibold text-lg tracking-tight" to="/">
            {APP_DISPLAY_NAME}
          </Link>
          <p className="text-muted-foreground text-sm">
            Welcome! Tell us about yourself
          </p>
        </div>
        <Card className="rounded-3xl border bg-card shadow-sm">
          <CardContent className="p-6">
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">I want to join as</label>
                <div className="grid grid-cols-2 gap-2">
                  {roleOptions.map((opt) => (
                    <button
                      className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center text-sm transition-all ${
                        role === opt.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-muted-foreground/30"
                      }`}
                      key={opt.value}
                      onClick={() => setRole(opt.value)}
                      type="button"
                    >
                      <span className="font-semibold">{opt.label}</span>
                      <span className="text-[11px] leading-tight">{opt.description}</span>
                    </button>
                  ))}
                </div>
              </div>
              {error && (
                <p className="text-destructive text-sm">{error}</p>
              )}
              <Button className="w-full" disabled={loading} type="submit">
                {loading ? "Setting up..." : "Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
