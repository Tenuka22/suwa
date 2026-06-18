import { useUser } from "@clerk/tanstack-react-start";
import { Separator } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";

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
  const { stats, profileData } = Route.useLoaderData();
  const canManageFiles = profileData?.profile?.permanent ?? false;
  const name = user.user?.fullName ?? user.user?.username ?? "Doctor";
  const doctorId = user.user?.id ?? "";

  return (
    <div className="flex flex-col gap-4">
      <DoctorProfileHeader
        doctorId={doctorId}
        isVerified={stats?.isPermanent}
        name={name}
      />

      <Separator />

      <section className="flex flex-col gap-2">
        <PageTitle>Overview</PageTitle>
        <DoctorProfileStats stats={stats} />
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div>
          <PageTitle>Profile information</PageTitle>
          <p className="text-muted-foreground text-sm font-light">
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
    </div>
  );
}
