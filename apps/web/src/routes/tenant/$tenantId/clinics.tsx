import { createFileRoute } from "@tanstack/react-router";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@zen-doc/ui/components/dialog";
import { Input } from "@zen-doc/ui/components/input";
import { Label } from "@zen-doc/ui/components/label";
import { Skeleton } from "@zen-doc/ui/components/skeleton";
import { Textarea } from "@zen-doc/ui/components/textarea";
import { PlusIcon, StethoscopeIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useCreateClinic, useListClinics } from "@/hooks/queries/tenant";

export const Route = createFileRoute("/tenant/$tenantId/clinics")({
  component: TenantClinicsPage,
});

function TenantClinicsPage() {
  const { tenantId } = Route.useParams();
  const { data, isLoading } = useListClinics(tenantId);
  const createClinic = useCreateClinic();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [clinicName, setClinicName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [schedule, setSchedule] = useState("");

  const handleCreate = async () => {
    if (!clinicName) {
      toast.error("Clinic name is required");
      return;
    }

    try {
      await createClinic.mutateAsync({
        tenantId,
        name: clinicName,
        specialization: specialization || undefined,
        schedule: schedule || undefined,
      });
      toast.success("Clinic created successfully");
      setDialogOpen(false);
      setClinicName("");
      setSpecialization("");
      setSchedule("");
    } catch {
      toast.error("Failed to create clinic");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-lg tracking-tight">Clinics</h1>
          <p className="text-muted-foreground">
            Manage clinics within this public hospital.
          </p>
        </div>

        <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
          <DialogTrigger
            render={
              <Button>
                <PlusIcon className="size-4" />
                Create Clinic
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Clinic</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Clinic Name *</Label>
                <Input
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="e.g., Cardiology OPD"
                  value={clinicName}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Specialization</Label>
                <Input
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g., Cardiology"
                  value={specialization}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Schedule</Label>
                <Textarea
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="e.g., Mon-Fri 17:00-20:00"
                  rows={2}
                  value={schedule}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setDialogOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button disabled={createClinic.isPending} onClick={handleCreate}>
                {createClinic.isPending ? "Creating..." : "Create Clinic"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.clinics?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.clinics.map((clinic) => (
            <Card key={clinic.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <StethoscopeIcon className="size-4 text-primary" />
                  <CardTitle className="text-base">{clinic.name}</CardTitle>
                </div>
                {clinic.specialization && (
                  <CardDescription>{clinic.specialization}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {clinic.schedule && (
                  <p className="text-muted-foreground text-sm">
                    📅 {clinic.schedule}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  Created {new Date(clinic.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center">
          <StethoscopeIcon className="size-12 text-muted-foreground/40" />
          <CardTitle>No clinics yet</CardTitle>
          <CardDescription className="text-center">
            Create clinics to organize doctor attendance within this hospital.
          </CardDescription>
          <Button onClick={() => setDialogOpen(true)}>
            <PlusIcon className="size-4" />
            Create Clinic
          </Button>
        </Card>
      )}
    </div>
  );
}
