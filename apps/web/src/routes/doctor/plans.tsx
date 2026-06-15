import { Badge } from "@doca/ui/components/badge";
import { Button } from "@doca/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@doca/ui/components/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@doca/ui/components/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@doca/ui/components/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@doca/ui/components/empty";
import { Input } from "@doca/ui/components/input";
import { Label } from "@doca/ui/components/label";
import { Separator } from "@doca/ui/components/separator";
import { Textarea } from "@doca/ui/components/textarea";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import { MetricCard, SectionHeader } from "@/components/dashboard-metrics";
import { BodyText, PageTitle } from "@/components/typography";
import { notify } from "@/lib/notify";
import { orpc } from "@/utils/orpc";

interface DoctorPlan {
  priceCents: number;
  description: string | null;
  durationMinutes: number;
  features: string | null;
  id: string;
  isActive: boolean;
  isDefault: boolean;
  name: string;
  sortOrder: number;
}

function CreatePlanDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceCents, setPriceCents] = useState("1500");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [features, setFeatures] = useState("");

  const createMutation = useMutation(
    orpc.createDoctorPlan.mutationOptions({
      onSuccess: async () => {
        notify.success("Plan created");
        setOpen(false);
        setName("");
        setDescription("");
        setPriceCents("1500");
        setDurationMinutes("60");
        setFeatures("");
      },
      onError: (error: Error) => {
        notify.error(error.message);
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
      priceCents: Number(priceCents),
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
              <Label htmlFor="price-cents">Price (cents)</Label>
              <Input
                id="price-cents"
                min="100"
                onChange={(e) => setPriceCents(e.target.value)}
                type="number"
                value={priceCents}
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
            <Textarea
              className="min-h-24 resize-y"
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
    const [stats, plansData] = await Promise.all([
      context.queryClient.ensureQueryData(orpc.planStats.queryOptions()),
      context.queryClient.ensureQueryData(orpc.listDoctorPlans.queryOptions()),
    ]);
    return { stats, plansData };
  },
  component: DoctorPlansRoute,
});

function DoctorPlansRoute() {
  const { stats, plansData } = Route.useLoaderData();
  const plans = (plansData?.plans as DoctorPlan[]) ?? [];

  const totalPlans = stats?.totalPlans ?? 0;
  const averagePriceCents = stats?.averagePriceCents ?? 0;
  const averageDurationMinutes = stats?.averageDurationMinutes ?? 0;
  const defaultPlanName = stats?.defaultPlanName ?? null;
  const minPriceCents = stats?.minPriceCents ?? 0;
  const maxPriceCents = stats?.maxPriceCents ?? 0;

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
        priceCents: plan.priceCents,
        minutes: plan.durationMinutes,
        features: parsedFeatures,
        isDefault: plan.isDefault,
      };
    })
    .sort((a, b) => b.priceCents - a.priceCents);

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-br from-background via-background to-muted/20">
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Plans dashboard</Badge>
              <Badge variant="secondary">Pricing overview</Badge>
            </div>

            <div className="flex flex-col gap-2">
              <PageTitle>Session plans</PageTitle>

              <BodyText className="max-w-2xl">
                Manage your session offerings and pricing at a glance. Review
                plan details, compare pricing, and see which plan is the
                default for new patients.
              </BodyText>
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
          description="Average price per plan"
          icon={<CoinsIcon className="size-5" />}
          title="Avg price"
          trend={`$${(minPriceCents / 100).toFixed(0)}–$${(maxPriceCents / 100).toFixed(0)}`}
          value={`$${(averagePriceCents / 100).toFixed(2)}`}
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

          <CardContent className="flex flex-col gap-4">
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
              price against session duration.
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/60">
          <CardHeader>
            <SectionHeader
              action={
                <Badge className="gap-1" variant="secondary">
                  <CreditCardIcon className="size-3" />
                  Price comparison
                </Badge>
              }
              description="A compact comparison of pricing and minutes"
              title="Plan comparison"
            />
          </CardHeader>

          <Separator />

          <CardContent>
            {chartData.length > 0 ? (
              <ChartContainer
                className="h-[280px] w-full"
                config={{
                  priceCents: {
                    label: "Price",
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
                          _name: unknown,
                          payload: unknown
                        ) => {
                          const item = payload as {
                            payload?: { minutes?: number };
                          };
                          return `$${(Number(value) / 100).toFixed(2)} · ${item.payload?.minutes ?? 0} min`;
                        }}
                        indicator="dot"
                      />
                    }
                    cursor={false}
                  />

                  <Bar
                    dataKey="priceCents"
                    fill="var(--primary)"
                    fillOpacity={0.3}
                    radius={[8, 8, 0, 0]}
                    stroke="var(--primary)"
                    strokeWidth={2}
                  >
                    <LabelList
                      dataKey="priceCents"
                      fill="var(--primary)"
                      position="top"
                      formatter={(v: unknown) => `$${(Number(v) / 100).toFixed(0)}`}
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
                className={`flex flex-col border-border/60 bg-gradient-to-br from-card to-card/50 shadow-sm transition-all duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary ${
                  plan.isDefault ? "ring-1 ring-primary/20" : ""
                }`}
                key={plan.id}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-medium text-sm">
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
                      <span className="font-semibold text-lg">
                        ${(plan.priceCents / 100).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <ClockIcon className="size-4 text-muted-foreground" />
                      <span className="font-semibold text-lg">
                        {plan.durationMinutes}
                      </span>
                      <span className="text-muted-foreground text-xs">min</span>
                    </div>
                  </div>

                  {parsedFeatures.length > 0 ? (
                    <div className="flex flex-col gap-2">
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
