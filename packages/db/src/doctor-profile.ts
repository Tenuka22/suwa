export const doctorSpecialtyValues = [
  "psychiatry",
  "psychology",
  "counseling",
  "family_medicine",
  "general_practice",
  "wellness",
] as const;

export const doctorLanguageValues = [
  "english",
  "spanish",
  "french",
  "arabic",
  "hindi",
  "sinhala",
  "tamil",
] as const;

export const doctorConsultationModeValues = [
  "video",
  "in_person",
  "chat",
] as const;

export const doctorFocusAreaValues = [
  "anxiety",
  "depression",
  "stress",
  "trauma",
  "sleep",
  "relationships",
  "burnout",
  "addiction",
  "parenting",
  "grief",
] as const;

export type DoctorSpecialty = (typeof doctorSpecialtyValues)[number];
export type DoctorLanguage = (typeof doctorLanguageValues)[number];
export type DoctorConsultationMode =
  (typeof doctorConsultationModeValues)[number];
export type DoctorFocusArea = (typeof doctorFocusAreaValues)[number];

export interface DoctorApproachStep {
  id: string;
  text: string;
}

export interface DoctorEducationEntry {
  degree: string;
  id: string;
  institution: string;
  year: number | null;
}

export function parseJsonStringArray(
  value: string | null | undefined,
  fallback: string[] = []
): string[] {
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export function stringifyJsonStringArray(value: readonly string[]): string {
  return JSON.stringify(value);
}

export function parseJsonApproachSteps(
  value: string | null | undefined,
  fallback: DoctorApproachStep[] = []
): DoctorApproachStep[] {
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is DoctorApproachStep =>
          typeof item === "object" &&
          item !== null &&
          "id" in item &&
          "text" in item &&
          typeof (item as DoctorApproachStep).id === "string" &&
          typeof (item as DoctorApproachStep).text === "string"
      );
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export function stringifyJsonApproachSteps(
  value: readonly DoctorApproachStep[]
): string {
  return JSON.stringify(value);
}
