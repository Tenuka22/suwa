import { useUser } from "@clerk/tanstack-react-start";
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
  const user = useUser();
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
  const name = user.user?.fullName ?? user.user?.username ?? "Doctor";
  const doctorId = user.user?.id ?? "";

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
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-lg border bg-muted p-2.5 text-muted-foreground">
              {statusIcon}
            </div>
            <div className="flex flex-col gap-1">
              <Badge variant={statusVariant}>
                {statusBadge}
              </Badge>
              <h1 className="font-semibold text-xl tracking-tight">
                {statusTitle}
              </h1>
              <p className="max-w-2xl text-muted-foreground text-sm">
                {statusDescription}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {profile && (!hasFaceEmbedding || !isPermanent) ? (
              <Button
                className="gap-1.5"
                onClick={() => setFaceDialogOpen(true)}
                variant={hasFaceEmbedding ? "outline" : "default"}
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
                className="gap-1.5"
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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
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
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Profile completeness</CardDescription>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold">
                {completenessPercentage}%
              </CardTitle>
              <div className="rounded-lg border bg-muted p-2 text-muted-foreground">
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

        <Card>
          <CardHeader>
            <CardDescription>Files</CardDescription>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold">{fileCount}</CardTitle>
              <div className="rounded-lg border bg-muted p-2 text-muted-foreground">
                <FileIcon className="size-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Uploaded introductory materials</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Specialties</CardDescription>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold">{specialtyCount}</CardTitle>
              <div className="rounded-lg border bg-muted p-2 text-muted-foreground">
                <BookOpenIcon className="size-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Areas of therapeutic expertise</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Languages</CardDescription>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold">{languageCount}</CardTitle>
              <div className="rounded-lg border bg-muted p-2 text-muted-foreground">
                <LanguagesIcon className="size-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Languages you speak with patients</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Hub videos</CardDescription>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold">{hubVideoCount}</CardTitle>
              <div className="rounded-lg border bg-muted p-2 text-muted-foreground">
                <VideoIcon className="size-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Videos in your content hub</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Hub audio</CardDescription>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold">{hubAudioCount}</CardTitle>
              <div className="rounded-lg border bg-muted p-2 text-muted-foreground">
                <RadioIcon className="size-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Audio recordings in your hub</p>
          </CardContent>
        </Card>
      </div>

      <Card>
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

      {user.user ? (
        <Card>
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
              doctorId={user.user.id}
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
  );
}
