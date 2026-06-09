export function formatParticipantLabel(identity: string): string {
  if (identity.startsWith("doctor_")) {
    return "Doctor";
  }
  if (identity.startsWith("patient_")) {
    return "Patient";
  }
  if (identity.startsWith("admin_")) {
    return "Admin";
  }
  return identity;
}
