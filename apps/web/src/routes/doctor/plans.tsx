import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import {
  Card,
  CardContent,
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
import {
  Check,
  Clock,
  Coins,
  LayoutGrid,
  Loader2,
  Pencil,
  PlusIcon,
  Trash2,
} from "lucide-react";
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
  creditCost: number;
  sortOrder: number;
}

const defaultFeatures = [
  "One-on-one session",
  "Secure video consultation",
  "Session notes included",
];

function FeatureInput({
  features,
  onChange,
}: {
  features: string[];
  onChange: (features: string[]) => void;
}) {
  const addFeature = () => onChange([...features, ""]);
  const removeFeature = (index: number) =>
    onChange(features.filter((_, i) => i !== index));
  const updateFeature = (index: number, value: string) => {
    const next = [...features];
    next[index] = value;
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Features
        </Label>
        <Button
          onClick={addFeature}
          size="sm"
          type="button"
          variant="ghost"
          className="h-7 text-xs"
        >
          <PlusIcon className="mr-1 h-3 w-3" />
          Add
        </Button>
      </div>
      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
        {features.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground text-xs border border-dashed rounded-lg">
            No features added
          </p>
        ) : (
          features.map((feature, index) => (
            <div className="flex items-center gap-2 group" key={index}>
              <Input
                className="h-8 text-sm"
                onChange={(e) => updateFeature(index, e.target.value)}
                placeholder="Feature description"
                value={feature}
              />
              <Button
                className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
  const [editTarget, setEditTarget] = useState<DoctorPlan | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [credits, setCredits] = useState("1");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [features, setFeatures] = useState<string[]>(defaultFeatures);

  const plansQuery = useQuery({
    queryKey: orpc.listDoctorPlans.queryKey(),
    queryFn: () => orpc.listDoctorPlans.call(),
  });

  const createPlan = useMutation(
    orpc.createDoctorPlan.mutationOptions({
      onSuccess: async () => {
        await plansQuery.refetch();
        toast.success("Plan created");
        setShowCreate(false);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to create plan");
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
        toast.error(error instanceof Error ? error.message : "Update failed");
      },
    })
  );

  const deletePlan = useMutation(
    orpc.deleteDoctorPlan.mutationOptions({
      onSuccess: async () => {
        await plansQuery.refetch();
        toast.success("Plan removed");
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Deletion failed");
      },
    })
  );

  const plans = (plansQuery.data?.plans ?? []) as DoctorPlan[];

  const resetForm = () => {
    setName("");
    setDescription("");
    setCredits("1");
    setDurationMinutes("60");
    setFeatures(defaultFeatures);
  };

  const isValid = () => {
    const dur = Number(durationMinutes);
    const creditsNum = Number(credits);
    return name.trim().length > 0 && creditsNum >= 1 && dur >= 15 && dur <= 240;
  };

  const handleCreate = () => {
    if (!isValid()) return;
    createPlan.mutate({
      name,
      description: description || undefined,
      creditCost: Number(credits),
      durationMinutes: Number(durationMinutes),
      features: features.filter(Boolean),
    });
  };

  const handleEdit = (plan: DoctorPlan) => {
    setName(plan.name);
    setDescription(plan.description ?? "");
    setCredits(String(plan.creditCost));
    setDurationMinutes(String(plan.durationMinutes));
    try {
      setFeatures(plan.features ? (JSON.parse(plan.features) as string[]) : []);
    } catch {
      setFeatures([]);
    }
    setEditTarget(plan);
  };

  const handleUpdate = () => {
    if (!(editTarget && isValid())) return;
    updatePlan.mutate({
      id: editTarget.id,
      name,
      description: description || null,
      creditCost: Number(credits),
      durationMinutes: Number(durationMinutes),
      features: features.filter(Boolean),
    });
  };

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="font-bold text-3xl text-foreground tracking-tight">
            Session Plans
          </h1>
          <p className="text-muted-foreground text-sm">
            Define your session offerings and pricing.
          </p>
        </div>

        <Dialog onOpenChange={(o) => { if (o) resetForm(); setShowCreate(o); }} open={showCreate}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Plan</DialogTitle>
              <DialogDescription>
                Configure a new session offering.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="plan-name">Plan Name</Label>
                <Input
                  id="plan-name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Standard Consultation"
                  value={name}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="plan-credits">Credits</Label>
                  <Input
                    id="plan-credits"
                    onChange={(e) => setCredits(e.target.value.replace(/\D/g, ""))}
                    type="number"
                    value={credits}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="plan-duration">Minutes</Label>
                  <Input
                    id="plan-duration"
                    onChange={(e) => setDurationMinutes(e.target.value.replace(/\D/g, ""))}
                    type="number"
                    value={durationMinutes}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="plan-description">Description</Label>
                <Textarea
                  id="plan-description"
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary..."
                  rows={2}
                  value={description}
                />
              </div>
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
                {createPlan.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              Total Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
            <p className="text-muted-foreground text-xs">active offerings</p>
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              Default Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{plans.find(p => p.isDefault)?.name ?? "None"}</div>
            <p className="text-muted-foreground text-xs">pre-selected for patients</p>
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              Max Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans.length > 0 ? Math.max(...plans.map(p => p.creditCost)) : 0}
            </div>
            <p className="text-muted-foreground text-xs">credits</p>
          </CardContent>
        </Card>
      </div>

      <Dialog onOpenChange={(o) => { if (!o) setEditTarget(null); }} open={!!editTarget}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Plan Name</Label>
              <Input id="edit-name" onChange={(e) => setName(e.target.value)} value={name} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-credits">Credits</Label>
                <Input id="edit-credits" onChange={(e) => setCredits(e.target.value.replace(/\D/g, ""))} type="number" value={credits} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-duration">Minutes</Label>
                <Input id="edit-duration" onChange={(e) => setDurationMinutes(e.target.value.replace(/\D/g, ""))} type="number" value={durationMinutes} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" onChange={(e) => setDescription(e.target.value)} rows={2} value={description} />
            </div>
            <FeatureInput features={features} onChange={setFeatures} />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {editTarget && !editTarget.isDefault && (
              <Button
                disabled={deletePlan.isPending}
                onClick={() => {
                   if (confirm("Delete this plan?")) {
                     deletePlan.mutate({ id: editTarget.id });
                     setEditTarget(null);
                   }
                }}
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Delete
              </Button>
            )}
            <div className="flex gap-2">
              <Button onClick={() => setEditTarget(null)} variant="outline">
                Cancel
              </Button>
              <Button
                disabled={!isValid() || updatePlan.isPending}
                onClick={handleUpdate}
              >
                {updatePlan.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {plansQuery.isPending ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : plans.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <LayoutGrid className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">No plans configured yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            let parsedFeatures: string[] = [];
            try {
              parsedFeatures = plan.features ? (JSON.parse(plan.features) as string[]) : [];
            } catch {
              parsedFeatures = [];
            }

            return (
              <Card
                className={`flex flex-col border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm transition-all hover:shadow-md ${
                  plan.isDefault ? "ring-1 ring-primary/20" : ""
                }`}
                key={plan.id}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold">{plan.name}</CardTitle>
                    {plan.isDefault && (
                      <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">
                        Default
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-4">
                  <div className="flex items-center gap-4 py-2 border-y border-border/50">
                    <div className="flex items-center gap-1.5">
                      <Coins className="h-4 w-4 text-muted-foreground" />
                      <span className="text-lg font-bold">{plan.creditCost}</span>
                      <span className="text-xs text-muted-foreground">credits</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-lg font-bold">{plan.durationMinutes}</span>
                      <span className="text-xs text-muted-foreground">min</span>
                    </div>
                  </div>

                  {plan.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {plan.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    {parsedFeatures.slice(0, 3).map((feature, idx) => (
                      <div className="flex items-start gap-2" key={idx}>
                        <Check className="mt-1 h-3 w-3 shrink-0 text-emerald-500" />
                        <span className="text-xs text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                    {parsedFeatures.length > 3 && (
                      <p className="text-[10px] text-muted-foreground pl-5">
                        +{parsedFeatures.length - 3} more
                      </p>
                    )}
                  </div>

                  <div className="mt-auto pt-2">
                    <Button
                      className="w-full text-xs"
                      onClick={() => handleEdit(plan)}
                      size="sm"
                      variant="outline"
                    >
                      <Pencil className="mr-2 h-3 w-3" />
                      Edit Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
