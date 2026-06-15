import { useUser } from "@clerk/tanstack-react-start";
import { Avatar, AvatarFallback } from "@doca/ui/components/avatar";
import { Badge } from "@doca/ui/components/badge";
import { Button } from "@doca/ui/components/button";
import { Card, CardContent, CardHeader } from "@doca/ui/components/card";
import { Separator } from "@doca/ui/components/separator";
import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheckIcon,
  BookOpenIcon,
  CopyIcon,
  FileIcon,
  GlobeIcon,
  LanguagesIcon,
  RadioIcon,
  UserCircleIcon,
  VideoIcon,
} from "lucide-react";
import { useState } from "react";
import { MetricCard, SectionHeader } from "@/components/dashboard-metrics";
import { DoctorFilesPanel, DoctorProfileCard } from "@/components/doctors";
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
  const { stats, profileData } = Route.useLoaderData();
  const canManageFiles = profileData?.profile?.permanent ?? false;
  const [copiedDoctorId, setCopiedDoctorId] = useState(false);

  const name = user.user?.fullName ?? user.user?.username ?? "Doctor";
  const doctorId = user.user?.id ?? "";

  const handleCopyDoctorId = () => {
    navigator.clipboard.writeText(doctorId);
    setCopiedDoctorId(true);
    setTimeout(() => setCopiedDoctorId(false), 2000);
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

  return (
    <div className="flex flex-col gap-6">
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
                isPermanent={profileData?.profile?.permanent ?? false}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
