import {
  Button,
  Chip,
  cn,
  Input,
  Label,
  Modal,
  Separator,
  TextArea,
} from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckIcon,
  ClockIcon,
  CoinsIcon,
  PackageIcon,
  PlusIcon,
  StarIcon,
} from "lucide-react";
import { useState } from "react";

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
  const [open, setOpen] = useState(false);
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
      onSuccess: () => {
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
      <Button
        className="gap-2 rounded-full"
        onPress={() => setOpen(true)}
        size="sm"
      >
        <PlusIcon className="size-4" />
        Create plan
      </Button>

      <Modal.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Modal.Container className="sm:max-w-[520px]">
          <Modal.Dialog className="bg-background">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Create plan</Modal.Heading>
              <p>Add a new consultation plan for your patients.</p>
            </Modal.Header>

            <Modal.Body>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="plan-name">
                    Plan name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    className={cn(
                      hasNameError &&
                        "border-destructive/70 ring-destructive/30"
                    )}
                    id="plan-name"
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                  />
                  {hasNameError && (
                    <p className="text-destructive text-xs">
                      Plan name is required
                    </p>
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
                      className={cn(
                        hasPriceError &&
                          "border-destructive/70 ring-destructive/30"
                      )}
                      id="price-cents"
                      min="100"
                      onChange={(e) => setPriceCents(e.target.value)}
                      type="number"
                      value={priceCents}
                    />
                    {hasPriceError && (
                      <p className="text-destructive text-xs">
                        Price is required
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="duration">
                      Duration minutes{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      className={cn(
                        hasDurationError &&
                          "border-destructive/70 ring-destructive/30"
                      )}
                      id="duration"
                      min="60"
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      type="number"
                      value={durationMinutes}
                    />
                    {hasDurationError && (
                      <p className="text-destructive text-xs">
                        Duration is required
                      </p>
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
            </Modal.Body>

            <Modal.Footer>
              <Button
                isDisabled={createMutation.isPending}
                onPress={handleCreate}
              >
                {createMutation.isPending ? (
                  <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                Create
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof PackageIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-foreground/50" />
      <span className="font-medium text-sm tabular-nums">{value}</span>
      <span className="text-foreground/60 text-sm">{label}</span>
    </div>
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

  const parsedPlans = plans.map((plan) => {
    let parsedFeatures: string[] = [];
    try {
      parsedFeatures = plan.features
        ? (JSON.parse(plan.features) as string[])
        : [];
    } catch {
      parsedFeatures = [];
    }
    return { ...plan, parsedFeatures };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-44 overflow-hidden rounded-[2rem] bg-gradient-to-b from-accent/10 via-accent/5 to-background md:h-52" />

      <div className="relative z-10 -mt-16 flex flex-col gap-4 px-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="font-light text-2xl tracking-tight">
              Session plans
            </h1>
            <Chip color="accent" variant="soft">
              <CoinsIcon className="size-3" />
              Plans dashboard
            </Chip>
          </div>

          <BodyText className="max-w-2xl">
            Manage your session offerings and pricing at a glance. Review plan
            details, compare pricing, and see which plan is the default for new
            patients.
          </BodyText>
        </div>
      </div>

      <Separator />

      <section className="flex flex-col gap-2 px-6">
        <PageTitle>Overview</PageTitle>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <StatItem
            icon={PackageIcon}
            label="total plans"
            value={totalPlans.toString()}
          />
          <StatItem
            icon={CoinsIcon}
            label="avg price"
            value={`$${(averagePriceCents / 100).toFixed(2)}`}
          />
          <StatItem
            icon={ClockIcon}
            label="avg minutes"
            value={averageDurationMinutes.toString()}
          />
          <StatItem
            icon={StarIcon}
            label="default"
            value={defaultPlanName ?? "None"}
          />
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <PageTitle>Plan controls</PageTitle>
            <p className="font-light text-foreground/60 text-sm">
              Create and manage the plans patients can book
            </p>
          </div>
          <CreatePlanDialog />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border px-4 py-3">
            <p className="font-light text-foreground/60 text-xs uppercase tracking-wider">
              Total plans
            </p>
            <p className="mt-1 font-medium text-2xl tabular-nums">
              {totalPlans}
            </p>
          </div>
          <div className="rounded-xl border border-border px-4 py-3">
            <p className="font-light text-foreground/60 text-xs uppercase tracking-wider">
              Default plan
            </p>
            <p className="mt-1 font-medium text-2xl tabular-nums">
              {defaultPlanName ?? "None"}
            </p>
          </div>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div>
          <PageTitle>Plan comparison</PageTitle>
          <p className="font-light text-foreground/60 text-sm">
            A compact comparison of pricing and minutes
          </p>
        </div>

        {parsedPlans.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {parsedPlans.map((plan) => (
              <div
                className={`rounded-xl border border-border px-4 py-3 ${
                  plan.isDefault ? "ring-1 ring-primary/20" : ""
                }`}
                key={plan.id}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-light text-sm">{plan.name}</span>
                    {plan.isDefault && (
                      <Chip
                        className="border-primary/20 bg-primary/10 text-[10px] text-primary"
                        variant="tertiary"
                      >
                        Default
                      </Chip>
                    )}
                  </div>
                </div>

                {plan.description && (
                  <p className="mt-1 font-light text-foreground/60 text-xs leading-relaxed">
                    {plan.description}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-4 border-border/50 border-t pt-3">
                  <div className="flex items-center gap-1.5">
                    <CoinsIcon className="size-4 text-foreground/50" />
                    <span className="font-medium text-lg">
                      ${(plan.priceCents / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <ClockIcon className="size-4 text-foreground/50" />
                    <span className="font-medium text-lg">
                      {plan.durationMinutes}
                    </span>
                    <span className="text-foreground/60 text-xs">min</span>
                  </div>
                </div>

                {plan.parsedFeatures.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5">
                    {plan.parsedFeatures.slice(0, 3).map((feature) => (
                      <div className="flex items-start gap-2" key={feature}>
                        <CheckIcon className="mt-0.5 size-3 shrink-0 text-emerald-500" />
                        <span className="text-foreground/60 text-xs">
                          {feature}
                        </span>
                      </div>
                    ))}
                    {plan.parsedFeatures.length > 3 && (
                      <p className="pl-5 text-[10px] text-foreground/60">
                        +{plan.parsedFeatures.length - 3} more
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="font-light text-sm">No plans configured</p>
            <p className="max-w-xs font-light text-foreground/60 text-sm">
              Create your first session plan to start offering consultations to
              patients.
            </p>
            <CreatePlanDialog />
          </div>
        )}
      </section>
    </div>
  );
}
