import { useUser } from "@clerk/tanstack-react-start";
import { Button, Card, Separator } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, CheckCircle2, Camera, UserCheck } from "lucide-react";
import { useState } from "react";

import { FaceCaptureDialog } from "@/components/face-detection";
import {
  DoctorMaterialsCard,
  DoctorProfileCard,
  DoctorProfileHeader,
  DoctorProfileStats,
} from "@/components/doctors";
import { PageTitle } from "@/components/typography";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/doctor/profile")({
  loaderDeps: () => ({}),
  loader: async ({ context }) => {
    const [stats, profileData] = await Promise.all([
      context.queryClient.ensureQueryData(orpc.profileStats.queryOptions()),
      context.queryClient.ensureQueryData(orpc.doctorProfile.queryOptions()),
    ]);
    return { stats, profileData };
  },
  component: DoctorProfileRoute,
});

function DoctorProfileRoute() {
  const user = useUser();
  const queryClient = useQueryClient();
  const { stats, profileData } = Route.useLoaderData();
  const [faceDialogOpen, setFaceDialogOpen] = useState(false);
  const canManageFiles = profileData?.profile?.permanent ?? false;
  const name = user.user?.fullName ?? user.user?.username ?? "Doctor";
  const doctorId = user.user?.id ?? "";
  const hasFace = profileData?.profile?.hasFaceEmbedding ?? false;

  const saveFaceMutation = useMutation(
    orpc.saveFaceEmbedding.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: orpc.doctorProfile.queryKey(),
        });
      },
    })
  );

  const handleFaceCaptured = async (embedding: number[]) => {
    await saveFaceMutation.mutateAsync({ embedding });
    setFaceDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <DoctorProfileHeader
        doctorId={doctorId}
        isVerified={stats?.isPermanent}
        name={name}
      />

      <Separator />

      <section className="flex flex-col gap-2">
        <PageTitle>Face Verification</PageTitle>
        <p className="font-light text-muted-foreground text-sm">
          Complete face verification to access the platform. This is mandatory
          before proceeding.
        </p>
        <Card
          className={cn(
            "mt-2 border-2",
            hasFace
              ? "border-green-500/30 bg-green-500/5"
              : "border-amber-500/30 bg-amber-500/5"
          )}
        >
          <Card.Content className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {hasFace ? (
                <div className="flex size-10 items-center justify-center rounded-full bg-green-500/20">
                  <CheckCircle2 className="size-5 text-green-500" />
                </div>
              ) : (
                <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/20">
                  <ShieldAlert className="size-5 text-amber-500" />
                </div>
              )}
              <div className="pb-4">
                <p className="font-medium text-sm">
                  {hasFace
                    ? "Face verification completed"
                    : "Face verification required"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {hasFace
                    ? "Your identity has been verified. You can access all features."
                    : "You must complete face verification before using the platform."}
                </p>
              </div>
            </div>
            <Button
              onPress={() => setFaceDialogOpen(true)}
              size="sm"
              variant={hasFace ? "outline" : "primary"}
            >
              {hasFace ? (
                <UserCheck className="size-4" />
              ) : (
                <Camera className="size-4" />
              )}
              {hasFace ? "View Again" : "Verify Now"}
            </Button>
          </Card.Content>
        </Card>
      </section>

      <Separator />

      <section className="flex flex-col gap-2">
        <PageTitle>Overview</PageTitle>
        <DoctorProfileStats stats={stats} />
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div>
          <PageTitle>Profile information</PageTitle>
          <p className="font-light text-muted-foreground text-sm">
            Your professional details visible to patients
          </p>
        </div>
        <DoctorProfileCard />
      </section>

      {user.user ? (
        <>
          <Separator />
          <section className="flex flex-col gap-3">
            <div>
              <PageTitle>Introductory materials</PageTitle>
              <p className="text-muted-foreground text-sm">
                Upload and manage your introductory photos, videos, and
                qualifications
              </p>
            </div>
            <DoctorMaterialsCard
              canManage={canManageFiles}
              doctorId={user.user.id}
              isPermanent={profileData?.profile?.permanent ?? false}
            />
          </section>
        </>
      ) : null}

      <FaceCaptureDialog
        open={faceDialogOpen}
        onOpenChange={setFaceDialogOpen}
        onFaceCaptured={handleFaceCaptured}
      />
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
