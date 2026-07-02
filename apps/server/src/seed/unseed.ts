import {
  accounts,
  clinicAttendance,
  clinics,
  conversations,
  doctorCashoutRequests,
  doctorCredits,
  doctorEducationEntries,
  doctorFiles,
  doctorHospitalAffiliations,
  doctorHospitalInvitations,
  doctorHubChannels,
  doctorHubMaterials,
  doctorPlans,
  doctorPlaylists,
  doctorProfiles,
  doctorScheduleEntries,
  doctorSessions,
  doctorWeeklyAvailability,
  hospitalAttendanceEvents,
  hospitalAvailabilityOverrides,
  messages,
  patientMoods,
  patientProfiles,
  sessionAttendanceEvents,
  sessionSharedData,
  sessionSnapshots,
  sessionTaskAssignments,
  sessions,
  tenantAdmins,
  tenantAuditLogs,
  tenantNotifications,
  tenants,
  userSubscriptions,
  users,
} from "@suwa/db";
import { deleteStoredFile } from "@suwa/api/doctor-materials";
import type { Context } from "@suwa/api/context";
import { and, inArray, like, or } from "drizzle-orm";

import { seedIds } from "./ids";

type DbWithDelete = {
  delete: (table: any) => {
    where: (condition: any) => unknown;
  };
};

const whereIn = (column: unknown, values: readonly string[]) =>
  inArray(column as never, values as never[]);

const whereLike = (column: unknown, value: string) =>
  like(column as never, value);

const whereOr = (...conditions: unknown[]) => or(...(conditions as never[]));

const whereAnd = (...conditions: unknown[]) => and(...(conditions as never[]));

export async function unseedData(
  db: DbWithDelete,
  fileStorageBucket: Context["fileStorageBucket"]
) {
  const doctorIds = seedIds.doctorIds;
  const tenantIds = seedIds.tenantIds;
  const userIds = seedIds.userIds;

  for (const id of doctorIds) {
    await deleteStoredFile(
      fileStorageBucket,
      `doctor-files/${id}/seed-portrait.jpg`
    );
    await deleteStoredFile(
      fileStorageBucket,
      `doctor-files/${id}/seed-portrait.svg`
    );
    await deleteStoredFile(
      fileStorageBucket,
      `doctor-files/${id}/seed-qualification.svg`
    );
    await deleteStoredFile(
      fileStorageBucket,
      `doctor-files/${id}/seed-intro-video.mp4`
    );
    await deleteStoredFile(
      fileStorageBucket,
      `doctor-files/${id}/seed-intro-video.jpg`
    );
  }

  await db.delete(sessionTaskAssignments).where(whereIn(sessionTaskAssignments.doctorId, doctorIds));
  await db.delete(sessionAttendanceEvents).where(whereLike(sessionAttendanceEvents.sessionId, "seed-%"));
  await db.delete(sessionSnapshots).where(whereLike(sessionSnapshots.sessionId, "seed-%"));
  await db.delete(sessionSharedData).where(whereLike(sessionSharedData.sessionId, "seed-%"));
  await db.delete(doctorSessions).where(whereIn(doctorSessions.doctorId, doctorIds));

  await db.delete(messages).where(whereLike(messages.id, "seed-%"));
  await db.delete(conversations).where(whereLike(conversations.id, "seed-%"));

  await db.delete(clinicAttendance).where(whereIn(clinicAttendance.doctorId, doctorIds));
  await db.delete(hospitalAttendanceEvents).where(
    whereOr(
      whereIn(hospitalAttendanceEvents.doctorId, doctorIds),
      whereIn(hospitalAttendanceEvents.tenantId, tenantIds)
    )
  );
  await db.delete(hospitalAvailabilityOverrides).where(
    whereOr(
      whereIn(hospitalAvailabilityOverrides.doctorId, doctorIds),
      whereIn(hospitalAvailabilityOverrides.tenantId, tenantIds)
    )
  );
  await db.delete(doctorHospitalInvitations).where(
    whereOr(
      whereIn(doctorHospitalInvitations.doctorId, doctorIds),
      whereIn(doctorHospitalInvitations.tenantId, tenantIds)
    )
  );
  await db.delete(doctorHospitalAffiliations).where(
    whereOr(
      whereIn(doctorHospitalAffiliations.doctorId, doctorIds),
      whereIn(doctorHospitalAffiliations.tenantId, tenantIds)
    )
  );

  await db.delete(doctorHubMaterials).where(whereIn(doctorHubMaterials.doctorId, doctorIds));
  await db.delete(doctorPlaylists).where(whereIn(doctorPlaylists.doctorId, doctorIds));
  await db.delete(doctorHubChannels).where(whereIn(doctorHubChannels.doctorId, doctorIds));
  await db.delete(doctorCashoutRequests).where(whereIn(doctorCashoutRequests.doctorId, doctorIds));
  await db.delete(doctorCredits).where(whereIn(doctorCredits.doctorId, doctorIds));
  await db.delete(doctorPlans).where(whereIn(doctorPlans.doctorId, doctorIds));
  await db.delete(doctorWeeklyAvailability).where(whereIn(doctorWeeklyAvailability.doctorId, doctorIds));
  await db.delete(doctorScheduleEntries).where(whereIn(doctorScheduleEntries.doctorId, doctorIds));
  await db.delete(doctorEducationEntries).where(whereIn(doctorEducationEntries.doctorId, doctorIds));
  await db.delete(doctorFiles).where(whereIn(doctorFiles.doctorId, doctorIds));
  await db.delete(doctorProfiles).where(whereIn(doctorProfiles.userId, doctorIds));

  await db.delete(patientMoods).where(whereLike(patientMoods.userId, "seed-patient-%"));
  await db.delete(patientProfiles).where(whereLike(patientProfiles.userId, "seed-patient-%"));
  await db.delete(userSubscriptions).where(whereIn(userSubscriptions.userId, userIds));
  await db.delete(accounts).where(whereIn(accounts.userId, userIds));
  await db.delete(sessions).where(whereIn(sessions.userId, userIds));

  await db.delete(tenantNotifications).where(
    whereOr(whereIn(tenantNotifications.userId, userIds), whereLike(tenantNotifications.entityId, "seed-%"))
  );
  await db.delete(tenantAuditLogs).where(whereIn(tenantAuditLogs.tenantId, tenantIds));
  await db.delete(tenantAdmins).where(
    whereAnd(whereIn(tenantAdmins.tenantId, tenantIds), whereIn(tenantAdmins.userId, userIds))
  );
  await db.delete(clinics).where(whereIn(clinics.tenantId, tenantIds));
  await db.delete(tenants).where(whereIn(tenants.id, tenantIds));
  await db.delete(users).where(whereIn(users.id, userIds));

  return {
    doctors: doctorIds.length,
    tenants: tenantIds.length,
    users: userIds.length,
  };
}
