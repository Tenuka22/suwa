import {
  Button,
  Chip,
  Input,
  Label,
  Modal,
  Separator,
  TextArea,
} from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CoinsIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import {
  DoctorPlanCard,
  DoctorPlansChart,
  DoctorPlansStats,
  EmptyState,
} from "@/components/doctors";
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
                    className={
                      hasNameError
                        ? "border-destructive/70 ring-destructive/30"
                        : ""
                    }
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
                      className={
                        hasPriceError
                          ? "border-destructive/70 ring-destructive/30"
                          : ""
                      }
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
                      className={
                        hasDurationError
                          ? "border-destructive/70 ring-destructive/30"
                          : ""
                      }
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

  const chartData = parsedPlans.map((plan) => ({
    name: plan.name,
    price: plan.priceCents / 100,
    duration: plan.durationMinutes,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-3">
          <PageTitle>Session plans</PageTitle>
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

      <Separator />

      <section className="flex flex-col gap-2">
        <PageTitle>Overview</PageTitle>
        <DoctorPlansStats
          averageDurationMinutes={averageDurationMinutes}
          averagePriceCents={averagePriceCents}
          defaultPlanName={defaultPlanName}
          totalPlans={totalPlans}
        />
      </section>

      {parsedPlans.length > 1 && (
        <>
          <Separator />

          <section className="flex flex-col gap-3">
            <div>
              <PageTitle>Plan comparison</PageTitle>
              <p className="font-light text-foreground/60 text-sm">
                Pricing and duration across all plans
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <DoctorPlansChart
                data={chartData.map((d) => ({ name: d.name, value: d.price }))}
                metric="$"
                title="Price per plan"
              />
              <DoctorPlansChart
                data={chartData.map((d) => ({
                  name: d.name,
                  value: d.duration,
                }))}
                metric="min"
                title="Duration per plan"
              />
            </div>
          </section>
        </>
      )}

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

        {parsedPlans.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {parsedPlans.map((plan) => (
              <DoctorPlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        ) : (
          <EmptyState
            description="Create your first session plan to start offering consultations to patients."
            title="No plans configured"
          >
            <CreatePlanDialog />
          </EmptyState>
        )}
      </section>
    </div>
  );
}
