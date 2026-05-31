import {
  SignInButton as ClerkSignInButton,
  useUser,
} from "@clerk/tanstack-react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@zen-doc/ui/components/chart";
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
import { Input } from "@zen-doc/ui/components/input";
import { Label } from "@zen-doc/ui/components/label";
import { Separator } from "@zen-doc/ui/components/separator";
import { Skeleton } from "@zen-doc/ui/components/skeleton";
import {
  CheckIcon,
  ClockIcon,
  CoinsIcon,
  CreditCardIcon,
  LayoutGridIcon,
  Loader2,
  PackageIcon,
  PlusIcon,
  StarIcon,
  StethoscopeIcon,
  TrendingUpIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

interface DoctorPlan {
  creditCost: number;
  description: string | null;
  durationMinutes: number;
  features: string | null;
  id: string;
  isActive: boolean;
  isDefault: boolean;
  name: string;
  sortOrder: number;
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-48 rounded-3xl" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-36 rounded-2xl" key={index.toString()} />
        ))}
      </div>

      <Skeleton className="h-[400px] rounded-3xl" />
    </div>
  );
}

function MetricCard({
  description,
  icon,
  title,
  trend,
  value,
}: {
  description: string;
  icon: ReactNode;
  title: string;
  trend?: string;
  value: string;
}) {
  return (
    <Card className="rounded-3xl border-border/60">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardDescription>{title}</CardDescription>
            <CardTitle className="text-4xl tracking-tight">{value}</CardTitle>
          </div>

          <div className="rounded-2xl border bg-muted/40 p-3 text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardHeader>

      <CardFooter className="mt-auto flex items-center justify-between text-muted-foreground text-sm">
        <span>{description}</span>

        {trend ? (
          <Badge className="gap-1" variant="secondary">
            <TrendingUpIcon className="size-3" />
            {trend}
          </Badge>
        ) : null}
      </CardFooter>
    </Card>
  );
}

function SectionHeader({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h2 className="font-semibold text-xl tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      {action}
    </div>
  );
}

function CreatePlanDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creditCost, setCreditCost] = useState("1");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [features, setFeatures] = useState("");

  const createMutation = useMutation(
    orpc.createDoctorPlan.mutationOptions({
      onSuccess: async () => {
        toast.success("Plan created");
        setOpen(false);
        setName("");
        setDescription("");
        setCreditCost("1");
        setDurationMinutes("60");
        setFeatures("");
      },
      onError: (error: Error) => {
        toast.error(error.message);
      },
    })
  );

  const handleCreate = () => {
    const parsedFeatures = features
      .split("\n")
      .map((feature) => feature.trim())
      .filter(Boolean);

    createMutation.mutate({
      name,
      description: description.trim() ? description : undefined,
      creditCost: Number(creditCost),
      durationMinutes: Number(durationMinutes),
      features: parsedFeatures.length > 0 ? parsedFeatures : undefined,
    });
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <Button className="gap-2" size="sm">
            <PlusIcon className="size-4" />
            Create plan
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Create plan</DialogTitle>
          <DialogDescription>
            Add a new consultation plan for your patients.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="plan-name">Plan name</Label>
            <Input
              id="plan-name"
              onChange={(e) => setName(e.target.value)}
              value={name}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="plan-description">Description</Label>
            <Input
              id="plan-description"
              onChange={(e) => setDescription(e.target.value)}
              value={description}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="credit-cost">Credits</Label>
              <Input
                id="credit-cost"
                min="1"
                onChange={(e) => setCreditCost(e.target.value)}
                type="number"
                value={creditCost}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration minutes</Label>
              <Input
                id="duration"
                min="60"
                onChange={(e) => setDurationMinutes(e.target.value)}
                type="number"
                value={durationMinutes}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="features">Features</Label>
            <Input
              id="features"
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="One feature per line"
              value={features}
            />
          </div>
        </div>

        <DialogFooter>
          <Button disabled={createMutation.isPending} onClick={handleCreate}>
            {createMutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const Route = createFileRoute("/doctor/plans")({
  loaderDeps: () => ({}),
  loader: async ({ context }) => {
    try {
      await context.queryClient.prefetchQuery({
        queryKey: orpc.planStats.queryKey(),
        queryFn: () => orpc.planStats.call(),
      });

      await context.queryClient.prefetchQuery({
        queryKey: orpc.listDoctorPlans.queryKey(),
        queryFn: () => orpc.listDoctorPlans.call(),
      });
    } catch {
      // noop
    }
  },
  component: DoctorPlansRoute,
});

function DoctorPlansRoute() {
  const user = useUser();

  const statsQuery = useQuery({
    queryKey: orpc.planStats.queryKey(),
    queryFn: () => orpc.planStats.call(),
  });

  const plansQuery = useQuery({
    queryKey: orpc.listDoctorPlans.queryKey(),
    queryFn: () => orpc.listDoctorPlans.call(),
  });

  if (!user.isLoaded) {
    return <DashboardSkeleton />;
  }

  if (!user.user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-md rounded-3xl">
          <CardHeader className="items-center text-center">
            <div className="rounded-2xl border bg-muted/40 p-4">
              <StethoscopeIcon className="size-6" />
            </div>

            <div className="space-y-2">
              <CardTitle>Sign in required</CardTitle>
              <CardDescription>
                Access your plans dashboard after signing in.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="flex justify-center">
            <ClerkSignInButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = statsQuery.data;
  const plans = (plansQuery.data?.plans as DoctorPlan[]) ?? [];

  const totalPlans = stats?.totalPlans ?? 0;
  const averageCreditCost = stats?.averageCreditCost ?? 0;
  const averageDurationMinutes = stats?.averageDurationMinutes ?? 0;
  const defaultPlanName = stats?.defaultPlanName ?? null;
  const minCreditCost = stats?.minCreditCost ?? 0;
  const maxCreditCost = stats?.maxCreditCost ?? 0;

  const chartData = plans
    .map((plan) => {
      let parsedFeatures: string[] = [];
      try {
        parsedFeatures = plan.features
          ? (JSON.parse(plan.features) as string[])
          : [];
      } catch {
        parsedFeatures = [];
      }
      return {
        name: plan.name,
        credits: plan.creditCost,
        minutes: plan.durationMinutes,
        features: parsedFeatures,
        isDefault: plan.isDefault,
      };
    })
    .sort((a, b) => b.credits - a.credits);

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-br from-background via-background to-muted/20">
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Plans dashboard</Badge>
              <Badge variant="secondary">Pricing overview</Badge>
            </div>

            <div className="space-y-2">
              <h1 className="font-semibold text-4xl tracking-tight">
                Session plans
              </h1>

              <p className="max-w-2xl text-muted-foreground text-sm md:text-base">
                Manage your session offerings and pricing at a glance. Review
                plan details, compare credit costs, and see which plan is the
                default for new patients.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          description="Active session offerings"
          icon={<LayoutGridIcon className="size-5" />}
          title="Total plans"
          trend="Active"
          value={totalPlans.toString()}
        />

        <MetricCard
          description="Average credit cost per plan"
          icon={<CoinsIcon className="size-5" />}
          title="Avg credits"
          trend={`${minCreditCost}–${maxCreditCost}`}
          value={averageCreditCost.toString()}
        />

        <MetricCard
          description="Average session duration"
          icon={<ClockIcon className="size-5" />}
          title="Avg minutes"
          value={averageDurationMinutes.toString()}
        />

        <MetricCard
          description="Pre-selected for new patients"
          icon={<StarIcon className="size-5" />}
          title="Default plan"
          value={defaultPlanName ?? "None"}
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <Card className="rounded-3xl border-border/60">
          <CardHeader>
            <SectionHeader
              action={<CreatePlanDialog />}
              description="Create and manage the plans patients can book"
              title="Plan controls"
            />
          </CardHeader>

          <Separator />

          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  Total plans
                </p>
                <p className="mt-2 font-semibold text-2xl">{totalPlans}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  Default plan
                </p>
                <p className="mt-2 font-semibold text-2xl">
                  {defaultPlanName ?? "None"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-muted-foreground text-sm">
              Keep your pricing simple and consistent. Use the chart to compare
              credit cost against session duration.
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/60">
          <CardHeader>
            <SectionHeader
              action={
                <Badge className="gap-1" variant="secondary">
                  <CreditCardIcon className="size-3" />
                  Credit cost comparison
                </Badge>
              }
              description="A compact comparison of credits and minutes"
              title="Plan comparison"
            />
          </CardHeader>

          <Separator />

          <CardContent>
            {chartData.length > 0 ? (
              <ChartContainer
                className="h-[280px] w-full"
                config={{
                  credits: {
                    label: "Credits",
                    color: "var(--primary)",
                  },
                }}
              >
                <BarChart
                  accessibilityLayer
                  data={chartData}
                  margin={{ left: 12, right: 12, top: 8 }}
                >
                  <CartesianGrid vertical={false} />

                  <XAxis
                    axisLine={false}
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />

                  <YAxis axisLine={false} hide tickLine={false} />

                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(
                          value: unknown,
                          name: unknown,
                          payload: unknown
                        ) => {
                          const item = payload as {
                            payload?: { minutes?: number };
                          };
                          return `${Number(value)} credits · ${item.payload?.minutes ?? 0} min`;
                        }}
                        indicator="dot"
                      />
                    }
                    cursor={false}
                  />

                  <Bar
                    dataKey="credits"
                    fill="var(--primary)"
                    fillOpacity={0.3}
                    radius={[8, 8, 0, 0]}
                    stroke="var(--primary)"
                    strokeWidth={2}
                  >
                    <LabelList
                      dataKey="credits"
                      fill="var(--primary)"
                      position="top"
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <PackageIcon />
                  </EmptyMedia>
                  <EmptyTitle>No plans configured</EmptyTitle>
                  <EmptyDescription>
                    Create your first session plan to start offering
                    consultations to patients.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            let parsedFeatures: string[] = [];
            try {
              parsedFeatures = plan.features
                ? (JSON.parse(plan.features) as string[])
                : [];
            } catch {
              parsedFeatures = [];
            }

            return (
              <Card
                className={`flex flex-col border-border/60 bg-gradient-to-br from-card to-card/50 shadow-sm transition-all hover:shadow-md ${
                  plan.isDefault ? "ring-1 ring-primary/20" : ""
                }`}
                key={plan.id}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-bold text-base">
                      {plan.name}
                    </CardTitle>
                    {plan.isDefault && (
                      <Badge
                        className="border-primary/20 bg-primary/10 text-primary"
                        variant="outline"
                      >
                        Default
                      </Badge>
                    )}
                  </div>

                  {plan.description && (
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {plan.description}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-4">
                  <div className="flex items-center gap-4 border-border/50 border-y py-2">
                    <div className="flex items-center gap-1.5">
                      <CoinsIcon className="size-4 text-muted-foreground" />
                      <span className="font-bold text-lg">
                        {plan.creditCost}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        credits
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <ClockIcon className="size-4 text-muted-foreground" />
                      <span className="font-bold text-lg">
                        {plan.durationMinutes}
                      </span>
                      <span className="text-muted-foreground text-xs">min</span>
                    </div>
                  </div>

                  {parsedFeatures.length > 0 ? (
                    <div className="space-y-2">
                      {parsedFeatures.slice(0, 3).map((feature, idx) => (
                        <div className="flex items-start gap-2" key={idx}>
                          <CheckIcon className="mt-1 size-3 shrink-0 text-emerald-500" />
                          <span className="text-muted-foreground text-xs">
                            {feature}
                          </span>
                        </div>
                      ))}
                      {parsedFeatures.length > 3 && (
                        <p className="pl-5 text-[10px] text-muted-foreground">
                          +{parsedFeatures.length - 3} more
                        </p>
                      )}
                    </div>
                  ) : null}

                  <div className="mt-auto" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
