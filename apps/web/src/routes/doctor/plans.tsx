import {
  Button,
  Card,
  Chip,
  cn,
  Input,
  Label,
  Modal,
  Separator,
  TextArea,
  useOverlayState,
} from "@heroui/react";
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
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { MetricCard, SectionHeader } from "@/components/dashboard-metrics";
import { BodyText, PageTitle } from "@/components/typography";
import { notify } from "@/lib/notify";
import { orpc } from "@/utils/orpc";

interface DoctorPlan {
  description: string | null;
  durationMinutes: number;
  features: string | null;
  id: string;
  isActive: boolean;
  isDefault: boolean;
  name: string;
  priceCents: number;
  sortOrder: number;
}

function CreatePlanDialog() {
  const overlay = useOverlayState();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceCents, setPriceCents] = useState("1500");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [features, setFeatures] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const hasNameError = showErrors && !name.trim();
  const hasPriceError = showErrors && !priceCents.trim();
  const hasDurationError = showErrors && !durationMinutes.trim();

  const createMutation = useMutation(
    orpc.createDoctorPlan.mutationOptions({
      onSuccess: async () => {
        notify.success("Plan created");
        overlay.close();
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
    setShowErrors(true);

    if (!(name.trim() && priceCents.trim() && durationMinutes.trim())) {
      return;
    }

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
    <>
      <Button className="gap-2" onPress={() => overlay.open()} size="sm">
        <PlusIcon className="size-4" />
        Create plan
      </Button>
      <Modal isOpen={overlay.isOpen} onOpenChange={overlay.setOpen}>
        <Modal.Backdrop />
        <Modal.Container className="sm:max-w-[520px]">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Create plan</Modal.Heading>
              <p>Add a new consultation plan for your patients.</p>
            </Modal.Header>

            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="plan-name">
                  Plan name <span className="text-destructive">*</span>
                </Label>
                <Input
                  className={cn(hasNameError && "border-destructive/70 ring-destructive/30")}
                  id="plan-name"
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                />
                {hasNameError && (
                  <p className="text-destructive text-xs">Plan name is required</p>
                )}
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
                <Label htmlFor="price-cents">
                  Price (cents) <span className="text-destructive">*</span>
                </Label>
                <Input
                  className={cn(hasPriceError && "border-destructive/70 ring-destructive/30")}
                  id="price-cents"
                  min="100"
                  onChange={(e) => setPriceCents(e.target.value)}
                  type="number"
                  value={priceCents}
                />
                {hasPriceError && (
                  <p className="text-destructive text-xs">Price is required</p>
                )}
                </div>
                <div className="grid gap-2">
                <Label htmlFor="duration">
                  Duration minutes <span className="text-destructive">*</span>
                </Label>
                <Input
                  className={cn(hasDurationError && "border-destructive/70 ring-destructive/30")}
                  id="duration"
                  min="60"
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  type="number"
                  value={durationMinutes}
                />
                {hasDurationError && (
                  <p className="text-destructive text-xs">Duration is required</p>
                )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="features">Features</Label>
                <TextArea
                  className="min-h-24 resize-y"
                  id="features"
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="One feature per line"
                  value={features}
                />
              </div>
            </div>

            <Modal.Footer>
              <Button
                isDisabled={createMutation.isPending}
                onPress={handleCreate}
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Create
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal>
    </>
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
        <Card.Content>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Chip>Plans dashboard</Chip>
              <Chip color="default" variant="soft">
                Pricing overview
              </Chip>
            </div>

            <div className="flex flex-col gap-2">
              <PageTitle>Session plans</PageTitle>

              <BodyText className="max-w-2xl">
                Manage your session offerings and pricing at a glance. Review
                plan details, compare pricing, and see which plan is the default
                for new patients.
              </BodyText>
            </div>
          </div>
        </Card.Content>
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
          <Card.Header>
            <SectionHeader
              action={<CreatePlanDialog />}
              description="Create and manage the plans patients can book"
              title="Plan controls"
            />
          </Card.Header>

          <Separator />

          <Card.Content className="flex flex-col gap-4">
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
          </Card.Content>
        </Card>

        <Card className="rounded-3xl border-border/60">
          <Card.Header>
            <SectionHeader
              action={
                <Chip className="gap-1" color="default" variant="soft">
                  <CreditCardIcon className="size-3" />
                  Price comparison
                </Chip>
              }
              description="A compact comparison of pricing and minutes"
              title="Plan comparison"
            />
          </Card.Header>

          <Separator />

          <Card.Content>
            {chartData.length > 0 ? (
              <div className="h-[280px] w-full">
                <BarChart
                  accessibilityLayer
                  data={chartData}
                  height={280}
                  margin={{ left: 12, right: 12, top: 8 }}
                  width="100%"
                >
                  <CartesianGrid vertical={false} />

                  <XAxis
                    axisLine={false}
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />

                  <YAxis axisLine={false} hide tickLine={false} />

                  <Tooltip
                    content={({ active, payload }) => {
                      if (!(active && payload?.length)) {
                        return null;
                      }
                      const item = payload[0]?.payload as
                        | { minutes?: number }
                        | undefined;
                      return (
                        <div className="rounded-lg border bg-background px-3 py-2 shadow-sm">
                          <p className="text-sm">{`$${(Number(payload[0]?.value) / 100).toFixed(2)} · ${item?.minutes ?? 0} min`}</p>
                        </div>
                      );
                    }}
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
                      formatter={(v: unknown) =>
                        `$${(Number(v) / 100).toFixed(0)}`
                      }
                      position="top"
                    />
                  </Bar>
                </BarChart>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="rounded-xl border bg-muted/40 p-3 text-muted-foreground">
                  <PackageIcon className="size-5" />
                </div>
                <p className="font-medium text-sm">No plans configured</p>
                <p className="max-w-xs text-muted-foreground text-sm">
                  Create your first session plan to start offering consultations
                  to patients.
                </p>
              </div>
            )}
          </Card.Content>
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
                <Card.Header className="pb-3">
                  <div className="flex items-center justify-between">
                    <Card.Title className="font-medium text-sm">
                      {plan.name}
                    </Card.Title>
                    {plan.isDefault && (
                      <Chip className="border-primary/20 bg-primary/10 text-primary">
                        Default
                      </Chip>
                    )}
                  </div>

                  {plan.description && (
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {plan.description}
                    </p>
                  )}
                </Card.Header>

                <Card.Content className="flex flex-1 flex-col gap-4">
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
                </Card.Content>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
