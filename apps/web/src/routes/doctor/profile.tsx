import { useUser } from "@clerk/tanstack-react-start";
import { Avatar, AvatarFallback } from "@suwa/ui/components/avatar";
import { Badge } from "@suwa/ui/components/badge";
import { Button } from "@suwa/ui/components/button";
import { Card, CardContent, CardHeader } from "@suwa/ui/components/card";
import { Separator } from "@suwa/ui/components/separator";
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

import { MetricCard, SectionHeader } from "@/components/dashboard-metrics";
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

  type StatusTone = "warning" | "pending" | "success";
  const status: {
    badge: string;
    title: string;
    description: string;
    tone: StatusTone;
  } = !profile
    ? {
        badge: "Missing profile",
        title: "Create your profile to continue",
        description:
          "Set up your practice details below, then complete face verification before admin review.",
        tone: "warning",
      }
    : !hasFaceEmbedding
      ? {
          badge: "Face verification required",
          title: "Complete face capture",
          description:
            "Your profile is saved, but you still need to capture a face embedding before access can be approved.",
          tone: "warning",
        }
      : !isPermanent
        ? {
            badge: "Awaiting approval",
            title: "Waiting for admin review",
            description:
              "Your profile and face verification are in place. Admin approval is still required to unlock the portal.",
            tone: "pending",
          }
        : {
            badge: "Access approved",
            title: "Doctor access is active",
            description:
              "Your profile is approved and face verification is complete.",
            tone: "success",
          };

  return (
    <div className="flex flex-col gap-6">
      <Card
        className={
          status.tone === "success"
            ? "rounded-3xl border-emerald-500/20 bg-emerald-500/5"
            : status.tone === "pending"
              ? "rounded-3xl border-amber-500/20 bg-amber-500/5"
              : "rounded-3xl border-border/60 bg-background"
        }
      >
        <CardContent className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={
                status.tone === "success"
                  ? "rounded-2xl bg-emerald-500/15 p-3 text-emerald-600"
                  : status.tone === "pending"
                    ? "rounded-2xl bg-amber-500/15 p-3 text-amber-600"
                    : "rounded-2xl bg-muted p-3 text-muted-foreground"
              }
            >
              {status.tone === "success" ? (
                <BadgeCheckIcon className="size-6" />
              ) : status.tone === "pending" ? (
                <Loader2Icon className="size-6 animate-spin" />
              ) : (
                <ShieldAlertIcon className="size-6" />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Badge
                variant={status.tone === "success" ? "default" : "secondary"}
              >
                {status.badge}
              </Badge>
              <h1 className="font-semibold text-xl tracking-tight">
                {status.title}
              </h1>
              <p className="max-w-2xl text-muted-foreground text-sm">
                {status.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {profile && (!hasFaceEmbedding || !isPermanent) ? (
              <Button
                className="gap-2"
                onClick={() => setFaceDialogOpen(true)}
                variant={hasFaceEmbedding ? "outline" : "default"}
              >
                {hasFaceEmbedding ? (
                  <UserCheckIcon className="size-4" />
                ) : (
                  <CameraIcon className="size-4" />
                )}
                {hasFaceEmbedding
                  ? "Update face embedding"
                  : "Start face capture"}
              </Button>
            ) : null}

            {name && hasFaceEmbedding && !isPermanent ? (
              <Button
                className="gap-2"
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

      <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-br from-background via-background to-muted/20">
        <CardContent>
          <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="size-16 border shadow-sm">
                <AvatarFallback className="font-semibold text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col gap-4">
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
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          description={`${profileExists ? "In progress" : "Not started yet"}`}
          icon={<UserCircleIcon className="size-5" />}
          title="Profile completeness"
          trend={profileExists ? `${completenessPercentage}%` : undefined}
          value={`${completenessPercentage}%`}
        />

        <MetricCard
          description="Uploaded introductory materials"
          icon={<FileIcon className="size-5" />}
          title="Files"
          value={fileCount.toString()}
        />

        <MetricCard
          description="Areas of therapeutic expertise"
          icon={<BookOpenIcon className="size-5" />}
          title="Specialties"
          value={specialtyCount.toString()}
        />

        <MetricCard
          description="Languages you speak with patients"
          icon={<LanguagesIcon className="size-5" />}
          title="Languages"
          value={languageCount.toString()}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        <MetricCard
          description="Videos in your content hub"
          icon={<VideoIcon className="size-5" />}
          title="Hub videos"
          value={hubVideoCount.toString()}
        />

        <MetricCard
          description="Audio recordings in your hub"
          icon={<RadioIcon className="size-5" />}
          title="Hub audio"
          value={hubAudioCount.toString()}
        />
      </section>

      <div className="grid gap-6">
        <Card className="rounded-3xl border-border/60">
          <CardHeader>
            <SectionHeader
              action={
                <Badge className="gap-1" variant="secondary">
                  <GlobeIcon className="size-3" />
                  Public listing
                </Badge>
              }
              description="Your professional details visible to patients"
              title="Profile information"
            />
          </CardHeader>

          <Separator />

          <CardContent>
            <DoctorProfileCard />
          </CardContent>
        </Card>
      </div>

      {user.user ? (
        <div className="grid gap-6">
          <Card className="rounded-3xl border-border/60">
            <CardHeader>
              <SectionHeader
                action={
                  <Badge className="gap-1" variant="secondary">
                    <VideoIcon className="size-3" />
                    Media & files
                  </Badge>
                }
                description="Upload and manage your introductory photos, videos, and qualifications"
                title="Introductory materials"
              />
            </CardHeader>

            <Separator />

            <CardContent>
              <DoctorFilesPanel
                canManage={canManageFiles}
                doctorId={user.user.id}
                isPermanent={profile?.permanent ?? false}
              />
            </CardContent>
          </Card>
        </div>
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
