export const SEED_ADMIN_ID = "seed-admin-galle-health-network";
export const SEED_DOCTOR_COUNT = 24;
export const SEED_TENANT_COUNT = 10;

export function tenantId(index: number) {
  return `seed-tenant-galle-${index + 1}`;
}

export function clinicId(tenantIndex: number, clinicIndex: number) {
  return `seed-clinic-galle-${tenantIndex + 1}-${clinicIndex + 1}`;
}

export function doctorId(index: number) {
  return `seed-doctor-galle-${index + 1}`;
}

export const seedIds = {
  adminId: SEED_ADMIN_ID,
  doctorIds: Array.from({ length: SEED_DOCTOR_COUNT + 1 }, (_, index) => doctorId(index)),
  tenantIds: Array.from({ length: SEED_TENANT_COUNT }, (_, index) => tenantId(index)),
  userIds: [
    SEED_ADMIN_ID,
    ...Array.from({ length: SEED_DOCTOR_COUNT + 1 }, (_, index) => doctorId(index)),
  ],
};
