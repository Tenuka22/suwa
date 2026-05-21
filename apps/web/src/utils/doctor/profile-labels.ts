import type {
  doctorConsultationModeValues,
  doctorFocusAreaValues,
  doctorLanguageValues,
  doctorSpecialtyValues,
} from "@zen-doc/db/doctor-profile";

export type DoctorSpecialty = (typeof doctorSpecialtyValues)[number];
export type DoctorLanguage = (typeof doctorLanguageValues)[number];
export type DoctorConsultationMode =
  (typeof doctorConsultationModeValues)[number];
export type DoctorFocusArea = (typeof doctorFocusAreaValues)[number];

export const specialtyLabels: Record<DoctorSpecialty, string> = {
  psychiatry: "Psychiatry",
  psychology: "Psychology",
  counseling: "Counseling",
  family_medicine: "Family medicine",
  general_practice: "General practice",
  wellness: "Wellness",
};

export const languageLabels: Record<DoctorLanguage, string> = {
  english: "English",
  spanish: "Spanish",
  french: "French",
  arabic: "Arabic",
  hindi: "Hindi",
  sinhala: "Sinhala",
  tamil: "Tamil",
};

export const consultationModeLabels: Record<DoctorConsultationMode, string> = {
  video: "Video sessions",
  in_person: "In-person",
  chat: "Chat support",
};

export const focusAreaLabels: Record<DoctorFocusArea, string> = {
  anxiety: "Anxiety",
  depression: "Depression",
  stress: "Stress",
  trauma: "Trauma",
  sleep: "Sleep",
  relationships: "Relationships",
  burnout: "Burnout",
  addiction: "Addiction",
  parenting: "Parenting",
  grief: "Grief",
};
