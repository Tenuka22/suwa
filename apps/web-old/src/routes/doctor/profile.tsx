import { buildHeadFromKey } from "../__root";
import { Avatar, AvatarFallback } from "@suwa/ui/components/avatar";
import { Badge } from "@suwa/ui/components/badge";
import { Button } from "@suwa/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@suwa/ui/components/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheckIcon,
  BookOpenIcon,
  CameraIcon,
  CopyIcon,
  FileIcon,
  GlobeIcon,
  LanguagesIcon,
  Loader2Icon,
  RadioIcon,
  ShieldAlertIcon,
  UserCheckIcon,
  UserCircleIcon,
  VideoIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FaceCaptureDialog } from "@/components/face-detection";
import { DoctorFilesPanel, DoctorProfileCard } from "@/components/doctors";
import { useSaveDoctorProfile } from "@/hooks/queries/doctor";
import { authClient } from "@/utils/auth";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/doctor/profile")({
  loaderDeps: () => ({}),
  loader: async ({ context }) => {
    try {

      const ensureQueryData = context.queryClient.ensureQueryData.bind(
        context.queryClient
      );
      await Promise.all([
        ensureQueryData(orpc.profileStats.queryOptions()),
        ensureQueryData(orpc.doctorProfile.queryOptions()),
      ]);
    }
    catch {}
    return null;
  },
  component: DoctorProfileRoute,
});

function DoctorProfileRoute() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const queryClient = useQueryClient();
  const saveDoctorProfile = useSaveDoctorProfile();
  const [faceDialogOpen, setFaceDialogOpen] = useState(false);
  const [copiedDoctorId, setCopiedDoctorId] = useState(false);

  type DoctorProfileStats = {
    profileExists: boolean;
    isPermanent: boolean;
    completenessPercentage: number;
    fileCount: number;
    specialtyCount: number;
    languageCount: number;
    hubVideoCount: number;
    hubAudioCount: number;
  };

  type DoctorProfileData = {
    profile: {
      permanent: boolean;
      hasFaceEmbedding: boolean;
      displayName?: string | null;
    } | null;
  };

  const statsQueryOptions: any = orpc.profileStats.queryOptions();
  const profileQueryOptions: any = orpc.doctorProfile.queryOptions();
  const statsQuery = useQuery<DoctorProfileStats, Error>(statsQueryOptions);
  const profileQuery = useQuery<DoctorProfileData, Error>(profileQueryOptions);

  const stats = statsQuery.data;
  const profileData = profileQuery.data;
  const profile = profileData?.profile ?? null;

  const canManageFiles = profile?.permanent ?? false;
  const name = user?.name ?? "Doctor";
  const doctorId = user?.id ?? "";

  const handleCopyDoctorId = () => {
    void navigator.clipboard.writeText(doctorId);
    setCopiedDoctorId(true);
    window.setTimeout(() => setCopiedDoctorId(false), 2000);
  };

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const completenessPercentage = stats?.completenessPercentage ?? 0;
  const fileCount = stats?.fileCount ?? 0;
  const specialtyCount = stats?.specialtyCount ?? 0;
  const languageCount = stats?.languageCount ?? 0;
  const isPermanent = stats?.isPermanent ?? false;
  const profileExists = stats?.profileExists ?? false;
  const hubVideoCount = stats?.hubVideoCount ?? 0;
  const hubAudioCount = stats?.hubAudioCount ?? 0;
  const hasFaceEmbedding = profile?.hasFaceEmbedding ?? false;

  const statusBadge = !profile
    ? "Missing profile"
    : !hasFaceEmbedding
      ? "Face verification required"
      : !isPermanent
        ? "Awaiting approval"
        : "Access approved";

  const statusTitle = !profile
    ? "Create your profile to continue"
    : !hasFaceEmbedding
      ? "Complete face capture"
      : !isPermanent
        ? "Waiting for admin review"
        : "Doctor access is active";

  const statusDescription = !profile
    ? "Set up your practice details below, then complete face verification before admin review."
    : !hasFaceEmbedding
      ? "Your profile is saved, but you still need to capture a face embedding before access can be approved."
      : !isPermanent
        ? "Your profile and face verification are in place. Admin approval is still required to unlock the portal."
        : "Your profile is approved and face verification is complete.";

  const statusVariant: "default" | "destructive" = !isPermanent && profile ? "destructive" : "default";

  const statusIcon = !profile || !hasFaceEmbedding ? (
    <ShieldAlertIcon className="size-5" />
  ) : !isPermanent ? (
    <Loader2Icon className="size-5 animate-spin" />
  ) : (
    <BadgeCheckIcon className="size-5" />
  );

  return (
    <div className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,color-mix(in_oklch,var(--secondary)_28%,transparent),transparent_28%),radial-gradient(circle_at_88%_16%,color-mix(in_oklch,var(--muted-foreground)_22%,transparent),transparent_30%),linear-gradient(180deg,var(--background)_0%,var(--muted)_56%,var(--background)_100%)]"
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 rounded-[1.4rem] border border-border/90 bg-card/80 p-5 shadow-[0_14px_40px_color-mix(in_oklch,var(--foreground)_8%,transparent)] backdrop-blur-md sm:flex-row sm:items-center sm:p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full border border-border bg-background p-3 text-muted-foreground">
              {statusIcon}
            </div>
            <div className="flex flex-col gap-3">
              <Badge className="h-7 w-fit rounded-full px-3" variant={statusVariant}>
                {statusBadge}
              </Badge>
              <div className="flex flex-col gap-1">
                <h1 className="font-semibold text-xl tracking-tight">
                  {statusTitle}
                </h1>
                <p className="max-w-2xl text-muted-foreground text-sm">
                  {statusDescription}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {profile && (!hasFaceEmbedding || !isPermanent) ? (
              <Button
                className="h-12 gap-1.5 rounded-full border-border bg-card px-5 text-foreground hover:bg-muted"
                onClick={() => setFaceDialogOpen(true)}
                variant="outline"
              >
                {hasFaceEmbedding ? (
                  <UserCheckIcon className="size-3.5" />
                ) : (
                  <CameraIcon className="size-3.5" />
                )}
                {hasFaceEmbedding
                  ? "Update face embedding"
                  : "Start face capture"}
              </Button>
            ) : null}

            {name && hasFaceEmbedding && !isPermanent ? (
              <Button
                className="h-12 gap-1.5 rounded-full bg-primary px-5 text-primary-foreground shadow-[0_10px_28px_color-mix(in_oklch,var(--primary)_18%,transparent)] hover:-translate-y-0.5 hover:bg-primary/90"
                disabled={saveDoctorProfile.isPending}
                onClick={() => {
                  saveDoctorProfile.mutate(
                    {
                      displayName: profile?.displayName ?? name,
                    },
                    {
                      onSuccess: () => {
                        toast.success("Review request created");
                      },
                      onError: (error) => {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "Failed to create review request"
                        );
                      },
                    }
                  );
                }}
              >
                {saveDoctorProfile.isPending
                  ? "Submitting..."
                  : "Create review request"}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
          <div className="flex flex-col gap-6 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="size-16 border shadow-sm">
                <AvatarFallback className="font-semibold text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Doctor profile</Badge>
                  {isPermanent ? (
                    <Badge variant="default">
                      <BadgeCheckIcon className="size-3.5" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Pending verification</Badge>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <h1 className="font-semibold text-lg tracking-tight">
                    {name}
                  </h1>

                  <p className="max-w-2xl text-muted-foreground text-sm">
                    Manage your public directory listing, therapeutic
                    credentials, and introductory materials. A complete profile
                    helps patients find and trust you.
                  </p>

                  <div className="flex items-center gap-2">
                    <code className="rounded-md bg-muted px-2 py-0.5 font-mono text-muted-foreground text-xs">
                      ID: {doctorId}
                    </code>
                    <Button
                      className="h-6 gap-1 px-2"
                      onClick={handleCopyDoctorId}
                      size="sm"
                      variant="outline"
                    >
                      <CopyIcon className="size-3" />
                      {copiedDoctorId ? "Copied" : "Copy ID"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isPermanent ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
                <CardHeader>
                  <CardDescription>Profile completeness</CardDescription>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-semibold">
                      {completenessPercentage}%
                    </CardTitle>
                    <div className="rounded-full border border-border bg-background p-2.5 text-muted-foreground">
                      <UserCircleIcon className="size-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs">
                    {profileExists ? "In progress" : "Not started yet"}
                  </p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
                <CardHeader>
                  <CardDescription>Files</CardDescription>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-semibold">{fileCount}</CardTitle>
                    <div className="rounded-full border border-border bg-background p-2.5 text-muted-foreground">
                      <FileIcon className="size-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs">Uploaded introductory materials</p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
                <CardHeader>
                  <CardDescription>Specialties</CardDescription>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-semibold">{specialtyCount}</CardTitle>
                    <div className="rounded-full border border-border bg-background p-2.5 text-muted-foreground">
                      <BookOpenIcon className="size-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs">Areas of therapeutic expertise</p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
                <CardHeader>
                  <CardDescription>Languages</CardDescription>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-semibold">{languageCount}</CardTitle>
                    <div className="rounded-full border border-border bg-background p-2.5 text-muted-foreground">
                      <LanguagesIcon className="size-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs">Languages you speak with patients</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
                <CardHeader>
                  <CardDescription>Hub videos</CardDescription>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-semibold">{hubVideoCount}</CardTitle>
                    <div className="rounded-full border border-border bg-background p-2.5 text-muted-foreground">
                      <VideoIcon className="size-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs">Videos in your content hub</p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
                <CardHeader>
                  <CardDescription>Hub audio</CardDescription>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-semibold">{hubAudioCount}</CardTitle>
                    <div className="rounded-full border border-border bg-background p-2.5 text-muted-foreground">
                      <RadioIcon className="size-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs">Audio recordings in your hub</p>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}

        <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Profile information</CardTitle>
                <CardDescription>
                  Your professional details visible to patients
                </CardDescription>
              </div>
              <Badge className="gap-1" variant="secondary">
                <GlobeIcon className="size-3" />
                Public listing
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <DoctorProfileCard />
          </CardContent>
        </Card>

        {user ? (
          <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Introductory materials</CardTitle>
                  <CardDescription>
                    Upload and manage your introductory photos, videos, and qualifications
                  </CardDescription>
                </div>
                <Badge className="gap-1" variant="secondary">
                  <VideoIcon className="size-3" />
                  Media & files
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <DoctorFilesPanel
                canManage={canManageFiles}
                doctorId={user.id}
                isPermanent={profile?.permanent ?? false}
              />
            </CardContent>
          </Card>
        ) : null}

        <FaceCaptureDialog
          onFaceCaptured={async (embedding) => {
            await orpc.saveFaceEmbedding.call({ embedding });
            if (name && !isPermanent) {
              await saveDoctorProfile.mutateAsync({
                displayName: profile?.displayName ?? name,
              });
              toast.success("Review request created");
            }
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: orpc.doctorProfile.queryKey() }),
              queryClient.invalidateQueries({ queryKey: orpc.profileStats.queryKey() }),
            ]);
            setFaceDialogOpen(false);
          }}
          onOpenChange={setFaceDialogOpen}
          open={faceDialogOpen}
        />
      </div>
    </div>
  );
}
