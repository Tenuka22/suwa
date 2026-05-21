import { useUser } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { orpc } from "@/utils/orpc";
import { DoctorFilesPanel, DoctorProfileCard } from "@/components/doctors";

export const Route = createFileRoute("/doctor/profile")({
  component: DoctorProfileRoute,
});

function DoctorProfileRoute() {
  const user = useUser();
  const doctorProfileQuery = useQuery(orpc.doctorProfile.queryOptions());
  const canManageFiles = doctorProfileQuery.data?.profile?.permanent ?? false;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="font-bold text-3xl text-foreground tracking-tight">
          Doctor Profile
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your public directory listing, therapeutic credentials, and
          introductory materials.
        </p>
      </div>

      <DoctorProfileCard />
      {user.user ? (
        <DoctorFilesPanel
          canManage={canManageFiles}
          doctorId={user.user.id}
          isPermanent={doctorProfileQuery?.data?.profile?.permanent ?? false}
        />
      ) : null}
    </div>
  );
}
