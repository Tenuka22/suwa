import { z } from "zod";

export * from "./doctor-materials";
import {
  doctorConsultationModeValues,
  doctorFileKindValues,
  doctorFocusAreaValues,
  doctorLanguageValues,
  doctorSpecialtyValues,
  scheduleKindValues,
  scheduleNoteValues,
} from "./values";

export const doctorSpecialtySchema = z.enum(doctorSpecialtyValues);
export const doctorLanguageSchema = z.enum(doctorLanguageValues);
export const doctorConsultationModeSchema = z.enum(
  doctorConsultationModeValues
);
export const doctorFocusAreaSchema = z.enum(doctorFocusAreaValues);
export const doctorFileKindSchema = z.enum(doctorFileKindValues);

export const scheduleKindSchema = z.enum(scheduleKindValues);
export const scheduleNoteSchema = z.enum(scheduleNoteValues);

export const doctorApproachStepSchema = z.object({
  id: z.string().min(1),
  text: z.string().trim().min(1).max(240),
});

export const doctorEducationEntrySchema = z.object({
  id: z.string().min(1),
  institution: z.string().trim().min(1).max(120),
  degree: z.string().trim().min(1).max(120),
  year: z.coerce.number().int().min(1900).max(2100).nullable().optional(),
});

export const scheduleRangeSchema = z.object({
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime(),
});

export const createScheduleEntrySchema = z
  .object({
    kind: scheduleKindSchema,
    noteKind: scheduleNoteSchema.optional(),
    sessionId: z.string().uuid().nullable().optional(),
  })
  .and(scheduleRangeSchema)
  .superRefine((value, ctx) => {
    if (new Date(value.startAt) >= new Date(value.endAt)) {
      ctx.addIssue({
        code: "custom",
        message: "End time must be after start time",
        path: ["endAt"],
      });
    }

    if (value.kind !== "open" && value.noteKind) {
      ctx.addIssue({
        code: "custom",
        message: "Only open entries can have notes",
        path: ["noteKind"],
      });
    }
  });

export const listScheduleEntriesSchema = z.object({
  from: z.iso.datetime(),
  to: z.iso.datetime(),
  page: z.coerce.number().int().positive().catch(1),
  pageSize: z.coerce.number().int().positive().max(500).catch(100),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  query: z.string().default(""),
});

export const listDoctorsInputSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  pageSize: z.coerce.number().int().min(1).max(24).catch(6),
  search: z.string().trim().max(60).catch(""),
});

export const onboardingModeSchema = z.enum([
  "self",
  "has_guardian",
  "guardian",
]);

export const patientPrivacyDataSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  fullName: z.string().min(1).max(200).optional(),
  address: z.string().max(500).optional(),
});

export type PatientPrivacyData = z.infer<typeof patientPrivacyDataSchema>;

export const completeOnboardingSchema = z.object({
  mode: onboardingModeSchema,
  alias: z.string().min(1).max(100),
  guardianEmail: z.string().email().optional(),
  guardianPhone: z.string().optional(),
  _securedData: z.string().optional(),
});

export const updatePatientProfileSchema = z.object({
  alias: z.string().min(1).max(100).optional(),
  _securedData: z.string().optional(),
  guardianEmail: z.string().email().nullable().optional(),
  guardianPhone: z.string().nullable().optional(),
});

export const cancelSessionSchema = z.object({
  sessionId: z.string().min(1),
});

export const createDoctorPlanSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  creditCost: z.coerce.number().int().min(1).max(10),
  durationMinutes: z.coerce.number().int().min(60).max(360),
  features: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
});

export const updateDoctorPlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  creditCost: z.coerce.number().int().min(1).max(10_000).optional(),
  durationMinutes: z.coerce.number().int().min(60).max(360).optional(),
  isActive: z.coerce.boolean().optional(),
  features: z
    .array(z.string().trim().min(1).max(200))
    .max(20)
    .nullable()
    .optional(),
});

export const deleteDoctorPlanSchema = z.object({
  id: z.string().min(1),
});

export const createDoctorFileSchema = z.object({
  doctorId: z.string().min(1),
  fileKind: doctorFileKindSchema,
  caption: z.string().trim().max(280).optional(),
  file: z.file(),
});

export const updateDoctorFileSchema = z.object({
  id: z.string().min(1),
  fileName: z.string().min(1).optional(),
  fileKind: doctorFileKindSchema.optional(),
  caption: z.string().trim().max(280).nullable().optional(),
  width: z.coerce.number().int().positive().nullable().optional(),
  height: z.coerce.number().int().positive().nullable().optional(),
});

export const fileKeySchema = z.object({
  id: z.string().min(1),
});

export const doctorFileInputSchema = z.object({
  doctorId: z.string().min(1),
});

export const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const doctorProfileInputSchema = z.object({
  displayName: z.preprocess(
    emptyToUndefined,
    z.string().trim().min(2).max(100).optional()
  ),
  headline: z.preprocess(
    emptyToUndefined,
    z.string().trim().min(2).max(140).optional()
  ),
  bio: z.string().optional(),
  licenseNumber: z.string().optional(),
  location: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(120).optional()
  ),
  experienceStartYear: z.coerce.number().int().min(1900).max(2100).optional(),
  specialties: z.array(doctorSpecialtySchema).max(5).optional(),
  languages: z.array(doctorLanguageSchema).max(8).optional(),
  consultationModes: z.array(doctorConsultationModeSchema).max(3).optional(),
  focusAreas: z.array(doctorFocusAreaSchema).max(10).optional(),
  approach: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(500).optional()
  ),
  education: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(500).optional()
  ),
  placeName: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(120).optional()
  ),
  placeAddress: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(240).optional()
  ),
  placeDescription: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(500).optional()
  ),
  approachSteps: z.array(doctorApproachStepSchema).max(12).optional(),
  educationEntries: z.array(doctorEducationEntrySchema).max(12).optional(),
});
