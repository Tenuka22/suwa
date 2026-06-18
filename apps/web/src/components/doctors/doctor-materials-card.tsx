import { DoctorFilesPanel } from "./doctor-files-panel";

export function DoctorMaterialsCard({
  canManage,
  doctorId,
  isPermanent,
}: {
  canManage: boolean;
  doctorId: string;
  isPermanent: boolean;
}) {
  return (
    <DoctorFilesPanel
      canManage={canManage}
      doctorId={doctorId}
      isPermanent={isPermanent}
    />
  );
}
