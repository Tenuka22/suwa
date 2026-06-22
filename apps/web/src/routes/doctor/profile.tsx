import { useUser } from "@clerk/tanstack-react-start";
import { Button, Card, Separator } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Camera, CheckCircle2, ShieldAlert, UserCheck } from "lucide-react";
import { useMemo, useState } from "react";
import {
  DoctorMaterialsCard,
  DoctorProfileCard,
  DoctorProfileHeader,
  DoctorProfileStats,
} from "@/components/doctors";
import { FaceCaptureDialog } from "@/components/face-detection";
import { useDoctorFiles } from "@/hooks/doctor/use-doctor-files";
import { useDoctorMaterialPreviewUrl } from "@/hooks/doctor/use-doctor-material-preview";
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
  const isPending = !canManageFiles && !!profileData?.profile;
  const dbName = profileData?.profile?.displayName;
  const name = dbName ?? user.user?.fullName ?? user.user?.username ?? "Doctor";
  const doctorId = user.user?.id ?? "";
  const hasFace = profileData?.profile?.hasFaceEmbedding ?? false;

  const doctorFilesQuery = useDoctorFiles();
  const portraitFile = useMemo(
    () => (doctorFilesQuery.data ?? []).find((f) => f.fileKind === "portrait"),
    [doctorFilesQuery.data]
  );
  const portraitUrl = useDoctorMaterialPreviewUrl(portraitFile?.id ?? "");

  const saveFaceMutation = useMutation(
    orpc.saveFaceEmbedding.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: orpc.doctorProfile.queryKey(),
        });
      },
    })
  );

  const handleFaceCaptured = async (result: {
    embedding: number[];
    videoBase64?: string;
  }) => {
    await saveFaceMutation.mutateAsync(result);
    setFaceDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <DoctorProfileHeader
        completionPercentage={stats?.completenessPercentage ?? 0}
        doctorId={doctorId}
        isPending={isPending}
        isVerified={stats?.isPermanent}
        name={name}
        portraitUrl={portraitUrl}
      />
        <Card
          className="w-full"
        >
          <Card.Content className="flex items-center justify-between flex-row">
            <div className="flex items-center gap-2">
              {hasFace ? (
                <div className="flex size-10 items-center justify-center rounded-full bg-green-500/20">
                  <CheckCircle2 className="size-5 text-green-500" />
                </div>
              ) : (
                <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/20">
                  <ShieldAlert className="size-5 text-amber-500" />
                </div>
              )}
              <div>
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


        <DoctorProfileStats stats={stats} />

      <Separator />

      <section className="flex flex-col gap-2">
        <div>
          <PageTitle>Profile information</PageTitle>
          <p className="font-light text-muted-foreground text-md">
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
        onFaceCaptured={handleFaceCaptured}
        onOpenChange={setFaceDialogOpen}
        open={faceDialogOpen}
      />
    </div>
  );
}
