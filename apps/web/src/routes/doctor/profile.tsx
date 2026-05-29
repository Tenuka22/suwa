import {
  SignInButton as ClerkSignInButton,
  useUser,
} from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "@zen-doc/ui/components/avatar";
import { Badge } from "@zen-doc/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";
import { Separator } from "@zen-doc/ui/components/separator";
import { Skeleton } from "@zen-doc/ui/components/skeleton";
import {
  BadgeCheckIcon,
  BookOpenIcon,
  FileIcon,
  GlobeIcon,
  LanguagesIcon,
  StethoscopeIcon,
  TrendingUpIcon,
  UserCircleIcon,
  VideoIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { DoctorFilesPanel, DoctorProfileCard } from "@/components/doctors";
import { orpc } from "@/utils/orpc";

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-48 rounded-3xl" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-36 rounded-2xl" key={index.toString()} />
        ))}
      </div>

      <Skeleton className="h-[300px] rounded-3xl" />
    </div>
  );
}

function MetricCard({
  description,
  icon,
  title,
  trend,
  value,
}: {
  description: string;
  icon: ReactNode;
  title: string;
  trend?: string;
  value: string;
}) {
  return (
    <Card className="rounded-3xl border-border/60">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardDescription>{title}</CardDescription>
            <CardTitle className="text-4xl tracking-tight">{value}</CardTitle>
          </div>

          <div className="rounded-2xl border bg-muted/40 p-3 text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardHeader>

      <CardFooter className="mt-auto flex items-center justify-between text-muted-foreground text-sm">
        <span>{description}</span>

        {trend ? (
          <Badge className="gap-1" variant="secondary">
            <TrendingUpIcon className="size-3" />
            {trend}
          </Badge>
        ) : null}
      </CardFooter>
    </Card>
  );
}

function SectionHeader({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h2 className="font-semibold text-xl tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      {action}
    </div>
  );
}

export const Route = createFileRoute("/doctor/profile")({
  loaderDeps: () => ({}),
  loader: async ({ context }) => {
    try {
      await context.queryClient.prefetchQuery({
        queryKey: orpc.profileStats.queryKey(),
        queryFn: () => orpc.profileStats.call(),
      });
    } catch {
      // noop
    }
  },
  component: DoctorProfileRoute,
});

function DoctorProfileRoute() {
  const user = useUser();

  const statsQuery = useQuery({
    queryKey: orpc.profileStats.queryKey(),
    queryFn: () => orpc.profileStats.call(),
  });

  const doctorProfileQuery = useQuery(orpc.doctorProfile.queryOptions());
  const profileData = doctorProfileQuery.data as
    | { profile: { permanent: boolean } | null; role: string }
    | undefined;
  const canManageFiles = profileData?.profile?.permanent ?? false;

  if (!user.isLoaded) {
    return <DashboardSkeleton />;
  }

  if (!user.user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-md rounded-3xl">
          <CardHeader className="items-center text-center">
            <div className="rounded-2xl border bg-muted/40 p-4">
              <StethoscopeIcon className="size-6" />
            </div>

            <div className="space-y-2">
              <CardTitle>Sign in required</CardTitle>
              <CardDescription>
                Access your doctor profile after signing in.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="flex justify-center">
            <ClerkSignInButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  const name = user.user.fullName ?? user.user.username ?? "Doctor";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const stats = statsQuery.data;

  const completenessPercentage = stats?.completenessPercentage ?? 0;
  const fileCount = stats?.fileCount ?? 0;
  const specialtyCount = stats?.specialtyCount ?? 0;
  const languageCount = stats?.languageCount ?? 0;
  const isPermanent = stats?.isPermanent ?? false;
  const accountAgeDays = stats?.accountAgeDays ?? 0;
  const profileExists = stats?.profileExists ?? false;

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

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Doctor profile</Badge>
                  {isPermanent ? (
                    <Badge variant="default">
                      <BadgeCheckIcon className="mr-1 size-3.5" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Pending verification</Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <h1 className="font-semibold text-4xl tracking-tight">
                    {name}
                  </h1>

                  <p className="max-w-2xl text-muted-foreground text-sm md:text-base">
                    Manage your public directory listing, therapeutic
                    credentials, and introductory materials. A complete profile
                    helps patients find and trust you.
                  </p>
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
          title="Completeness"
          trend={profileExists ? `${completenessPercentage}%` : "0%"}
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
          trend={
            accountAgeDays > 0 ? `${accountAgeDays}d on platform` : undefined
          }
          value={languageCount.toString()}
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
