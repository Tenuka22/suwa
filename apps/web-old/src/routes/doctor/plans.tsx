import { Badge } from "@suwa/ui/components/badge";
import { Button } from "@suwa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@suwa/ui/components/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@suwa/ui/components/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@suwa/ui/components/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@suwa/ui/components/empty";
import { buildHeadFromKey } from "../__root";
import { Input } from "@suwa/ui/components/input";
import { Label } from "@suwa/ui/components/label";
import { Textarea } from "@suwa/ui/components/textarea";
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
  PencilIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
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

import { notify } from "@/lib/notify";
import { orpc, queryClient } from "@/utils/orpc";

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

function parseFeatures(features: string | null): string[] {
  try {
    return features ? (JSON.parse(features) as string[]) : [];
  } catch {
    return [];
  }
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
        await queryClient.invalidateQueries({
          queryKey: orpc.listDoctorPlans.queryKey(),
        });
        await queryClient.invalidateQueries({
          queryKey: orpc.planStats.queryKey(),
        });
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
      <Button className="gap-1.5" onClick={() => setOpen(true)} size="sm">
        <PlusIcon className="size-3.5" />
        Create plan
      </Button>
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
                min="1"
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

function EditPlanDialog({ plan }: { plan: DoctorPlan }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(plan.name);
  const [description, setDescription] = useState(plan.description ?? "");

  const initialPriceCents = plan.priceCents.toString();
  const initialDuration = plan.durationMinutes.toString();
  const [priceCents, setPriceCents] = useState(initialPriceCents);
  const [durationMinutes, setDurationMinutes] = useState(initialDuration);

  let initialFeatures: string[] = [];
  try {
    initialFeatures = plan.features ? (JSON.parse(plan.features) as string[]) : [];
  } catch {
    initialFeatures = [];
  }
  const [features, setFeatures] = useState(initialFeatures.join("\n"));

  const updateMutation = useMutation(
    orpc.updateDoctorPlan.mutationOptions({
      onSuccess: async () => {
        notify.success("Plan updated");
        setOpen(false);
        await queryClient.invalidateQueries({
          queryKey: orpc.listDoctorPlans.queryKey(),
        });
        await queryClient.invalidateQueries({
          queryKey: orpc.planStats.queryKey(),
        });
      },
      onError: (error: Error) => {
        notify.error(error.message);
      },
    })
  );

  const handleUpdate = () => {
    const parsedFeatures = features
      .split("\n")
      .map((feature) => feature.trim())
      .filter(Boolean);

    updateMutation.mutate({
      id: plan.id,
      name,
      description: description.trim() ? description : null,
      priceCents: Number(priceCents),
      durationMinutes: Number(durationMinutes),
      features: parsedFeatures.length > 0 ? parsedFeatures : null,
    });
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <Button
        className="size-8"
        onClick={() => {
          setName(plan.name);
          setDescription(plan.description ?? "");
          setPriceCents(plan.priceCents.toString());
          setDurationMinutes(plan.durationMinutes.toString());
          let feat: string[] = [];
          try {
            feat = plan.features ? (JSON.parse(plan.features) as string[]) : [];
          } catch {
            feat = [];
          }
          setFeatures(feat.join("\n"));
          setOpen(true);
        }}
        size="icon"
        variant="ghost"
      >
        <PencilIcon className="size-4" />
      </Button>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Edit plan</DialogTitle>
          <DialogDescription>Update your consultation plan details.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="edit-plan-name">Plan name</Label>
            <Input
              id="edit-plan-name"
              onChange={(e) => setName(e.target.value)}
              value={name}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-plan-description">Description</Label>
            <Input
              id="edit-plan-description"
              onChange={(e) => setDescription(e.target.value)}
              value={description}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="edit-price-cents">Price (cents)</Label>
              <Input
                id="edit-price-cents"
                min="100"
                onChange={(e) => setPriceCents(e.target.value)}
                type="number"
                value={priceCents}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-duration">Duration minutes</Label>
              <Input
                id="edit-duration"
                min="1"
                onChange={(e) => setDurationMinutes(e.target.value)}
                type="number"
                value={durationMinutes}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-features">Features</Label>
            <Textarea
              className="min-h-24 resize-y"
              id="edit-features"
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="One feature per line"
              value={features}
            />
          </div>
        </div>

        <DialogFooter>
          <Button disabled={updateMutation.isPending} onClick={handleUpdate}>
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeletePlanDialog({ plan, onDeleted }: { plan: DoctorPlan; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);

  const deleteMutation = useMutation(
    orpc.deleteDoctorPlan.mutationOptions({
      onSuccess: async () => {
        notify.success("Plan deleted");
        setOpen(false);
        onDeleted();
      },
      onError: (error: Error) => {
        notify.error(error.message);
      },
    })
  );

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <Button
        className="size-8 text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
        size="icon"
        variant="ghost"
      >
        <TrashIcon className="size-4" />
      </Button>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete plan</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{plan.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setOpen(false)} variant="outline">
            Cancel
          </Button>
          <Button
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate({ id: plan.id })}
            variant="destructive"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            Delete
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

  const handleDeleted = async () => {
    await queryClient.invalidateQueries({
      queryKey: orpc.listDoctorPlans.queryKey(),
    });
    await queryClient.invalidateQueries({
      queryKey: orpc.planStats.queryKey(),
    });
  };
  const plans = (plansData?.plans as DoctorPlan[]) ?? [];

  const totalPlans = stats?.totalPlans ?? 0;
  const averagePriceCents = stats?.averagePriceCents ?? 0;
  const averageDurationMinutes = stats?.averageDurationMinutes ?? 0;
  const defaultPlanName = stats?.defaultPlanName ?? null;
  const minPriceCents = stats?.minPriceCents ?? 0;
  const maxPriceCents = stats?.maxPriceCents ?? 0;

  const chartData = plans
    .map((plan) => ({
      name: plan.name,
      priceCents: plan.priceCents,
      minutes: plan.durationMinutes,
      features: parseFeatures(plan.features),
      isDefault: plan.isDefault,
    }))
    .sort((a, b) => b.priceCents - a.priceCents);

  return (
    <div className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,color-mix(in_oklch,var(--secondary)_28%,transparent),transparent_28%),radial-gradient(circle_at_88%_16%,color-mix(in_oklch,var(--muted-foreground)_22%,transparent),transparent_30%),linear-gradient(180deg,var(--background)_0%,var(--muted)_56%,var(--background)_100%)]"
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 rounded-[1.4rem] border border-border/90 bg-card/80 p-5 shadow-[0_14px_40px_color-mix(in_oklch,var(--foreground)_8%,transparent)] backdrop-blur-md sm:p-6">
          <Badge className="h-7 w-fit rounded-full bg-primary px-3 text-primary-foreground">
            Plans dashboard
          </Badge>
          <div className="flex flex-col gap-2">
            <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">
              Session plans
            </h1>
            <p className="max-w-[58ch] text-base text-muted-foreground leading-7">
              Manage your session offerings and pricing at a glance. Review
              plan details, compare pricing, and see which plan is the default
              for new patients.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
            <CardHeader>
              <CardDescription>Total plans</CardDescription>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-semibold">{totalPlans}</CardTitle>
                <div className="rounded-full border border-border bg-background p-2.5 text-muted-foreground">
                  <LayoutGridIcon className="size-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-xs">Active session offerings</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
            <CardHeader>
              <CardDescription>Avg price</CardDescription>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-semibold">
                  ${(averagePriceCents / 100).toFixed(2)}
                </CardTitle>
                <div className="rounded-full border border-border bg-background p-2.5 text-muted-foreground">
                  <CoinsIcon className="size-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Badge className="gap-1" variant="secondary">
                ${(minPriceCents / 100).toFixed(0)}–${(maxPriceCents / 100).toFixed(0)}
              </Badge>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
            <CardHeader>
              <CardDescription>Avg minutes</CardDescription>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-semibold">{averageDurationMinutes}</CardTitle>
                <div className="rounded-full border border-border bg-background p-2.5 text-muted-foreground">
                  <ClockIcon className="size-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-xs">Average session duration</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
            <CardHeader>
              <CardDescription>Default plan</CardDescription>
              <div className="flex items-center justify-between">
                <CardTitle className="truncate text-2xl font-semibold">
                  {defaultPlanName ?? "None"}
                </CardTitle>
                <div className="rounded-full border border-border bg-background p-2.5 text-muted-foreground">
                  <StarIcon className="size-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-xs">Pre-selected for new patients</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
          <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Plan controls</CardTitle>
                  <CardDescription>
                    Create and manage the plans patients can book
                  </CardDescription>
                </div>
                <CreatePlanDialog />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] border border-border/90 bg-card/80 p-4 shadow-sm backdrop-blur-md">
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">
                    Total plans
                  </p>
                  <p className="mt-2 font-semibold text-2xl">{totalPlans}</p>
                </div>
                <div className="rounded-[1.2rem] border border-border/90 bg-card/80 p-4 shadow-sm backdrop-blur-md">
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">
                    Default plan
                  </p>
                  <p className="mt-2 truncate font-semibold text-2xl">
                    {defaultPlanName ?? "None"}
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground text-sm">
                Keep your pricing simple and consistent. Use the chart to compare
                price against session duration.
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Plan comparison</CardTitle>
                  <CardDescription>A compact comparison of pricing and minutes</CardDescription>
                </div>
                <Badge className="gap-1" variant="secondary">
                  <CreditCardIcon className="size-3" />
                  Price comparison
                </Badge>
              </div>
            </CardHeader>
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
                        formatter={(v: unknown) =>
                          `$${(Number(v) / 100).toFixed(0)}`
                        }
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
              const parsedFeatures = parseFeatures(plan.features);

              return (
                <Card
                  className={`overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md ${plan.isDefault ? "ring-1 ring-primary/30" : ""}`}
                  key={plan.id}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-medium text-sm">
                        {plan.name}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        {plan.isDefault && (
                          <Badge className="gap-1" variant="default">
                            <StarIcon className="size-3" />
                            Default
                          </Badge>
                        )}
                        <DeletePlanDialog
                          onDeleted={handleDeleted}
                          plan={plan}
                        />
                        <EditPlanDialog plan={plan} />
                      </div>
                    </div>

                    {plan.description && (
                      <CardDescription className="text-xs">
                        {plan.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col gap-4">
                    <div className="flex items-center gap-4 border-y py-2">
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
                            <CheckIcon className="mt-0.5 size-3 shrink-0 text-primary" />
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
