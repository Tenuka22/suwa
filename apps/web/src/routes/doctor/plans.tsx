import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { TAX_RATE } from "@zen-doc/pricing";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@zen-doc/ui/components/alert-dialog";
import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@zen-doc/ui/components/dialog";
import { Input } from "@zen-doc/ui/components/input";
import { Label } from "@zen-doc/ui/components/label";
import { Textarea } from "@zen-doc/ui/components/textarea";
import { Check, Loader2, Pencil, PlusIcon, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/doctor/plans")({
  component: DoctorPlansRoute,
});

interface DoctorPlan {
  description: string | null;
  durationMinutes: number;
  features: string | null;
  id: string;
  isActive: boolean;
  isDefault: boolean;
  name: string;
  price: number;
  sortOrder: number;
}

const defaultFeatures = [
  "One-on-one session",
  "Secure video consultation",
  "Session notes included",
];

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function DollarInput({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id: string;
}) {
  const dollars = Number(value) || 0;
  const cents = Math.round(dollars * 100);
  const tax = Math.round(cents * TAX_RATE);
  const total = cents + tax;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Session Price ($)</Label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
          $
        </span>
        <Input
          className="pl-7"
          id={id}
          min={1}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, "");
            onChange(raw);
          }}
          placeholder="0"
          type="text"
          value={value}
        />
      </div>
      {dollars > 0 ? (
        <div className="space-y-0.5 text-muted-foreground text-xs">
          <p>
            + {formatPrice(tax)} fee ({TAX_RATE * 100}%)
          </p>
          <p className="font-medium text-foreground">
            Patient total: {formatPrice(total)}
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          Enter a price to see the {TAX_RATE * 100}% fee breakdown
        </p>
      )}
    </div>
  );
}

function DurationInput({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id: string;
}) {
  const num = Number(value);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Duration (minutes)</Label>
      <Input
        id={id}
        max={360}
        min={60}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9]/g, "");
          onChange(raw);
        }}
        placeholder="60"
        type="text"
        value={value}
      />
      {num >= 60 && num <= 360 ? null : (
        <p className="text-destructive text-xs">Must be between 60 and 360</p>
      )}
    </div>
  );
}

function FeatureInput({
  features,
  onChange,
}: {
  features: string[];
  onChange: (features: string[]) => void;
}) {
  function addFeature() {
    onChange([...features, ""]);
  }

  function removeFeature(index: number) {
    onChange(features.filter((_, i) => i !== index));
  }

  function updateFeature(index: number, value: string) {
    const next = [...features];
    next[index] = value;
    onChange(next);
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label>Features</Label>
        <Button onClick={addFeature} size="sm" type="button" variant="outline">
          <PlusIcon className="mr-1 h-3 w-3" />
          Add feature
        </Button>
      </div>
      <div className="space-y-2">
        {features.length === 0 ? (
          <p className="py-1 text-muted-foreground text-xs">
            No features added yet
          </p>
        ) : (
          features.map((feature, index) => (
            <div className="flex items-center gap-2" key={index}>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-3 w-3 text-primary" />
              </div>
              <Input
                onChange={(e) => updateFeature(index, e.target.value)}
                placeholder={`Feature ${index + 1}`}
                value={feature}
              />
              <Button
                className="shrink-0"
                onClick={() => removeFeature(index)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DoctorPlansRoute() {
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<DoctorPlan | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [features, setFeatures] = useState<string[]>(defaultFeatures);

  const plansQuery = useQuery({
    queryKey: orpc.listDoctorPlans.queryKey(),
    queryFn: () => orpc.listDoctorPlans.call(),
  });

  const createPlan = useMutation(
    orpc.createDoctorPlan.mutationOptions({
      onSuccess: async () => {
        await plansQuery.refetch();
        toast.success("Plan created successfully");
        setShowCreate(false);
        resetForm();
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to create plan"
        );
      },
    })
  );

  const updatePlan = useMutation(
    orpc.updateDoctorPlan.mutationOptions({
      onSuccess: async () => {
        await plansQuery.refetch();
        toast.success("Plan updated");
        setEditTarget(null);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to update plan"
        );
      },
    })
  );

  const deletePlan = useMutation(
    orpc.deleteDoctorPlan.mutationOptions({
      onSuccess: async () => {
        await plansQuery.refetch();
        toast.success("Plan deleted");
        setDeleteTarget(null);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete plan"
        );
        setDeleteTarget(null);
      },
    })
  );

  const plans = (plansQuery.data?.plans ?? []) as DoctorPlan[];

  function resetForm() {
    setName("");
    setDescription("");
    setPrice("");
    setDurationMinutes("");
    setFeatures(defaultFeatures);
  }

  function isValid(): boolean {
    const dur = Number(durationMinutes);
    const priceCents = Math.round(Number(price) * 100);
    return (
      name.trim().length > 0 && priceCents >= 100 && dur >= 60 && dur <= 360
    );
  }

  function handleCreate() {
    if (!isValid()) {
      return;
    }

    createPlan.mutate({
      name,
      description: description || undefined,
      price: Math.round(Number(price) * 100),
      durationMinutes: Number(durationMinutes),
      features: features.filter(Boolean),
    });
  }

  function handleEdit(plan: DoctorPlan) {
    setName(plan.name);
    setDescription(plan.description ?? "");
    setPrice(String(plan.price / 100));
    setDurationMinutes(String(plan.durationMinutes));
    setFeatures(plan.features ? (JSON.parse(plan.features) as string[]) : []);
    setEditTarget(plan);
  }

  function handleUpdate() {
    if (!(editTarget && isValid())) {
      return;
    }

    updatePlan.mutate({
      id: editTarget.id,
      name,
      description: description || null,
      price: Math.round(Number(price) * 100),
      durationMinutes: Number(durationMinutes),
      features: features.filter(Boolean),
    });
  }

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="font-bold text-3xl text-foreground tracking-tight">
            Session Plans
          </h1>
          <p className="text-muted-foreground text-sm">
            Define your session offerings and pricing. The default plan is
            required; you can create as many custom plans as you like.
          </p>
        </div>

        <Dialog onOpenChange={setShowCreate} open={showCreate}>
          <DialogTrigger>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Session Plan</DialogTitle>
              <DialogDescription>
                Set your session price. A {TAX_RATE * 100}% service fee is added
                at checkout.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="plan-name">Plan Name</Label>
                <Input
                  id="plan-name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Deep Session"
                  value={name}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="plan-description">Description (optional)</Label>
                <Textarea
                  id="plan-description"
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this session includes..."
                  value={description}
                />
              </div>

              <DollarInput id="plan-price" onChange={setPrice} value={price} />

              <DurationInput
                id="plan-duration"
                onChange={setDurationMinutes}
                value={durationMinutes}
              />

              <FeatureInput features={features} onChange={setFeatures} />
            </div>

            <DialogFooter>
              <Button onClick={() => setShowCreate(false)} variant="outline">
                Cancel
              </Button>
              <Button
                disabled={!isValid() || createPlan.isPending}
                onClick={handleCreate}
              >
                {createPlan.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : null}
                Create Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        open={!!editTarget}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>
              Update your session plan details.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Plan Name</Label>
              <Input
                id="edit-name"
                onChange={(e) => setName(e.target.value)}
                placeholder="Plan name"
                value={name}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this plan..."
                value={description}
              />
            </div>

            <DollarInput id="edit-price" onChange={setPrice} value={price} />

            <DurationInput
              id="edit-duration"
              onChange={setDurationMinutes}
              value={durationMinutes}
            />

            <FeatureInput features={features} onChange={setFeatures} />
          </div>

          <DialogFooter>
            <Button onClick={() => setEditTarget(null)} variant="outline">
              Cancel
            </Button>
            <Button
              disabled={!isValid() || updatePlan.isPending}
              onClick={handleUpdate}
            >
              {updatePlan.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {plansQuery.isPending ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12">
            <p className="text-muted-foreground text-sm">
              No plans yet. Create your first session plan to start offering
              bookings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const parsedFeatures: string[] = plan.features
              ? (JSON.parse(plan.features) as string[])
              : [];
            const taxAmount = Math.round(plan.price * TAX_RATE);
            const totalPrice = plan.price + taxAmount;

            return (
              <Card
                className={`relative flex flex-col border-2 transition-shadow hover:shadow-lg ${
                  plan.isDefault
                    ? "border-primary/40 bg-primary/[0.02]"
                    : "border-border"
                }`}
                key={plan.id}
              >
                {plan.isDefault ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary px-4 text-primary-foreground text-xs">
                      Required
                    </Badge>
                  </div>
                ) : null}

                <CardHeader className="pb-4 text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {plan.description ? (
                    <CardDescription>{plan.description}</CardDescription>
                  ) : null}
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-6">
                  <div className="text-center">
                    <span className="font-bold text-4xl text-foreground">
                      {formatPrice(plan.price)}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      <div className="text-muted-foreground text-xs">
                        + {formatPrice(taxAmount)} fee ({TAX_RATE * 100}%)
                      </div>
                      <div className="font-medium text-muted-foreground text-sm">
                        Total: {formatPrice(totalPrice)}
                      </div>
                    </div>
                    <div className="mt-2">
                      <Badge className="bg-muted" variant="outline">
                        {plan.durationMinutes} min
                      </Badge>
                    </div>
                  </div>

                  {parsedFeatures.length > 0 ? (
                    <div className="flex-1 space-y-2">
                      <p className="font-semibold text-foreground text-xs uppercase tracking-wide">
                        What's included
                      </p>
                      {parsedFeatures.map((feature) => (
                        <div className="flex items-start gap-2" key={feature}>
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span className="text-muted-foreground text-sm">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-auto flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleEdit(plan)}
                      size="sm"
                      variant="outline"
                    >
                      <Pencil className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    {plan.isDefault ? null : (
                      <Button
                        className="shrink-0"
                        onClick={() => setDeleteTarget(plan.id)}
                        size="sm"
                        variant="ghost"
                      >
                        <X className="h-4 w-4 text-muted-foreground hover:text-rose-500" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Card
            className="flex min-h-[320px] cursor-pointer items-center justify-center border-2 border-dashed transition-colors hover:border-primary/50 hover:bg-muted/20"
            onClick={() => setShowCreate(true)}
            onKeyDown={(e) => e.key === "Enter" && setShowCreate(true)}
            role="button"
            tabIndex={0}
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <PlusIcon className="h-8 w-8" />
              <span className="font-medium text-sm">Add another plan</span>
            </div>
          </Card>
        </div>
      )}

      <AlertDialog
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        open={!!deleteTarget}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This plan will be deactivated. Existing bookings are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              Keep Plan
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deletePlan.mutate({ id: deleteTarget });
                }
              }}
            >
              Delete Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
