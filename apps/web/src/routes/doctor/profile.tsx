import { createFileRoute } from "@tanstack/react-router";

import { useUser } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";

import { DoctorFilesPanel, DoctorProfileCard } from "./components/-index";

import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/doctor/profile")({
  component: DoctorProfileRoute,
});

function DoctorProfileRoute() {
  const user = useUser();
  const doctorProfileQuery = useQuery(orpc.doctorProfile.queryOptions());
  const canManageFiles = doctorProfileQuery.data?.profile?.permanent ?? false;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="font-bold text-3xl tracking-tight text-foreground">Doctor Profile</h1>
        <p className="text-muted-foreground text-sm">
          Manage your public directory listing, therapeutic credentials, and introductory materials.
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
