import {
  SignInButton as ClerkSignInButton,
  useUser,
} from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@zen-doc/ui/components/badge";
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@zen-doc/ui/components/empty";
import { Separator } from "@zen-doc/ui/components/separator";
import { Skeleton } from "@zen-doc/ui/components/skeleton";
import {
  CheckIcon,
  ClockIcon,
  CoinsIcon,
  CreditCardIcon,
  LayoutGridIcon,
  PackageIcon,
  StarIcon,
  StethoscopeIcon,
  TrendingUpIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
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

      <Card className="rounded-3xl border-border/60">
        <CardHeader>
          <SectionHeader
            action={
              <Badge className="gap-1" variant="secondary">
                <CreditCardIcon className="size-3" />
                Credit cost comparison
              </Badge>
            }
            description="Credit cost and duration breakdown across your plans"
            title="Pricing overview"
          />
        </CardHeader>

        <Separator />

        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer
              className="h-[400px] w-full"
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
                layout="vertical"
                margin={{ left: 100, right: 40 }}
              >
                <CartesianGrid horizontal={false} />

                <XAxis axisLine={false} tickLine={false} type="number" />

                <YAxis
                  axisLine={false}
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  type="category"
                />

                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value: unknown) =>
                        `${Number(value)} credit${Number(value) === 1 ? "" : "s"}`
                      }
                      indicator="dot"
                    />
                  }
                  cursor={false}
                />

                <Bar
                  dataKey="credits"
                  fill="var(--primary)"
                  fillOpacity={0.2}
                  radius={[0, 6, 6, 0]}
                  stroke="var(--primary)"
                  strokeWidth={2}
                >
                  <LabelList
                    dataKey="credits"
                    fill="var(--primary)"
                    offset={8}
                    position="right"
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
                  Create your first session plan to start offering consultations
                  to patients.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

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
