import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
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
  CheckCircle2,
  Clock,
  Coins,
  Loader2,
  MoreVertical,
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          What's Included
        </Label>
        <Button
          onClick={addFeature}
          size="sm"
          type="button"
          variant="ghost"
          className="h-6 px-2 text-[10px] hover:bg-primary/5 hover:text-primary"
        >
          <PlusIcon className="mr-1 h-3 w-3" />
          Add Item
        </Button>
      </div>
      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {features.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 border border-dashed rounded-xl bg-muted/20">
            <p className="text-[10px] text-muted-foreground font-medium">No features listed</p>
          </div>
        ) : (
          features.map((feature, index) => (
            <div className="flex items-center gap-2 group/input" key={index}>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <Input
                className="h-8 text-xs bg-muted/30 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20"
                onChange={(e) => updateFeature(index, e.target.value)}
                placeholder="Feature detail..."
                value={feature}
              />
              <Button
                className="h-7 w-7 shrink-0 opacity-0 group-hover/input:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                onClick={() => removeFeature(index)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2 className="h-3.5 w-3.5" />
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
        toast.success("New plan launched");
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
    <div className="flex w-full flex-col gap-8 p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold px-2 py-0">OFFERINGS</Badge>
            <h1 className="font-black text-4xl tracking-tight text-foreground uppercase italic">Session Plans</h1>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Define your consultation tiers and pricing structure.</p>
        </div>

        <Dialog onOpenChange={(o) => { if (o) resetForm(); setShowCreate(o); }} open={showCreate}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-full px-8 shadow-xl hover:shadow-primary/20 transition-all font-bold uppercase tracking-widest text-xs">
              <PlusIcon className="mr-2 h-4 w-4" />
              New Tier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] rounded-3xl border-none shadow-2xl overflow-hidden p-0">
            <div className="bg-primary p-6 text-primary-foreground">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight italic">Create Tier</DialogTitle>
              <DialogDescription className="text-primary-foreground/80 font-medium">Configure a new session offering.</DialogDescription>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Title</Label>
                  <Input
                    className="h-10 border-muted-foreground/20 focus-visible:ring-primary/30"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Platinum Deep Dive"
                    value={name}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Credits</Label>
                    <div className="relative group">
                      <Coins className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        className="pl-9 h-10 border-muted-foreground/20"
                        onChange={(e) => setCredits(e.target.value.replace(/\D/g, ""))}
                        type="number"
                        value={credits}
                      />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Min</Label>
                    <div className="relative group">
                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        className="pl-9 h-10 border-muted-foreground/20"
                        onChange={(e) => setDurationMinutes(e.target.value.replace(/\D/g, ""))}
                        type="number"
                        value={durationMinutes}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Summary</Label>
                  <Textarea
                    className="resize-none border-muted-foreground/20"
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief overview..."
                    rows={2}
                    value={description}
                  />
                </div>
                <FeatureInput features={features} onChange={setFeatures} />
              </div>
              <DialogFooter>
                <Button
                  className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-xs"
                  disabled={!isValid() || createPlan.isPending}
                  onClick={handleCreate}
                >
                  {createPlan.isPending ? <Loader2 className="animate-spin" /> : "Deploy Plan"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog onOpenChange={(o) => { if (!o) setEditTarget(null); }} open={!!editTarget}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl border-none shadow-2xl overflow-hidden p-0">
          <div className="bg-foreground p-6 text-background">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight italic text-background">Configure Tier</DialogTitle>
            <DialogDescription className="text-background/70 font-medium italic">Adjust the specifics of this offering.</DialogDescription>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Title</Label>
                <Input className="h-10 bg-muted/30 border-none" onChange={(e) => setName(e.target.value)} value={name} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Credits</Label>
                  <Input className="h-10 bg-muted/30 border-none" onChange={(e) => setCredits(e.target.value.replace(/\D/g, ""))} type="number" value={credits} />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Min</Label>
                  <Input className="h-10 bg-muted/30 border-none" onChange={(e) => setDurationMinutes(e.target.value.replace(/\D/g, ""))} type="number" value={durationMinutes} />
                </div>
              </div>
              <FeatureInput features={features} onChange={setFeatures} />
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-col sm:gap-2">
              <Button
                className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg"
                disabled={!isValid() || updatePlan.isPending}
                onClick={handleUpdate}
              >
                {updatePlan.isPending ? <Loader2 className="animate-spin" /> : "Save Evolution"}
              </Button>
              {editTarget && !editTarget.isDefault && (
                <Button
                  className="w-full h-10 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-destructive/10 hover:text-destructive transition-colors"
                  disabled={deletePlan.isPending}
                  onClick={() => {
                     if (confirm("Permanently erase this tier?")) {
                       deletePlan.mutate({ id: editTarget.id });
                       setEditTarget(null);
                     }
                  }}
                  variant="ghost"
                >
                  Erase Tier
                </Button>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {plansQuery.isPending ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div className="h-96 rounded-3xl bg-muted animate-pulse border border-border/40" key={i} />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 bg-muted/20 rounded-[40px] border border-dashed border-border/60">
           <LayoutGrid className="h-20 w-20 text-muted-foreground/30 mb-6" />
           <h2 className="text-2xl font-black uppercase italic tracking-tight text-muted-foreground">Void Detected</h2>
           <p className="text-muted-foreground text-sm font-medium mt-2">Begin by deploying your first session tier.</p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            let parsedFeatures: string[] = [];
            try {
              parsedFeatures = plan.features ? (JSON.parse(plan.features) as string[]) : [];
            } catch {
              parsedFeatures = [];
            }

            return (
              <Card
                className={`group relative flex flex-col rounded-[32px] overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:border-primary/40 ${
                  plan.isDefault ? "bg-primary/[0.01] border-primary/20 shadow-lg" : "bg-card border-border/60"
                }`}
                key={plan.id}
              >
                {plan.isDefault && (
                  <div className="absolute top-0 right-0 p-1.5">
                    <Badge className="rounded-full bg-primary px-3 text-[10px] font-black uppercase tracking-widest italic shadow-lg">PRIME</Badge>
                  </div>
                )}

                <CardHeader className="pt-8 pb-6 text-center">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-black uppercase tracking-tight italic group-hover:text-primary transition-colors">
                      {plan.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{plan.durationMinutes} Minute Session</p>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col px-8 pb-8">
                  <div className="mb-8 flex flex-col items-center justify-center py-6 rounded-3xl bg-muted/30 border border-border/40 transition-colors group-hover:bg-primary/5 group-hover:border-primary/20">
                     <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-amber-500" />
                        <span className="text-5xl font-black tracking-tighter italic">{plan.creditCost}</span>
                     </div>
                     <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1 italic">
                        Credits Required
                     </span>
                  </div>

                  <div className="flex-1 space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">Inventory</span>
                       <div className="h-px flex-1 bg-border/60" />
                    </div>
                    <div className="space-y-3">
                      {parsedFeatures.map((feature, idx) => (
                        <div className="flex items-center gap-3 group/item" key={`${feature}-${idx}`}>
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 transition-transform group-hover/item:scale-110">
                            <Check className="h-3 w-3 text-emerald-600" />
                          </div>
                          <span className="text-xs font-semibold text-muted-foreground leading-snug group-hover/item:text-foreground transition-colors italic">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <CardFooter className="p-0">
                    <Button
                      className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] italic shadow-lg hover:shadow-primary/20 transition-all"
                      onClick={() => handleEdit(plan)}
                      variant={plan.isDefault ? "default" : "outline"}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Reconfigure
                    </Button>
                  </CardFooter>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
