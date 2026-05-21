export const specialtyLabels: Record<string, string> = {
  psychiatry: "Psychiatry",
  psychology: "Psychology",
  counseling: "Counseling",
  family_medicine: "Family medicine",
  general_practice: "General practice",
  wellness: "Wellness",
};

export const languageLabels: Record<string, string> = {
  english: "English",
  spanish: "Spanish",
  french: "French",
  arabic: "Arabic",
  hindi: "Hindi",
  sinhala: "Sinhala",
  tamil: "Tamil",
};

export const consultationModeLabels: Record<string, string> = {
  video: "Video",
  in_person: "In-person",
  chat: "Chat",
};

export const focusAreaLabels: Record<string, string> = {
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

export function capitalizeWords(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getYearsOfExperience(startYear: number | null) {
  if (!startYear) {
    return null;
  }
  const years = new Date().getFullYear() - startYear;
  return years > 0 ? years : null;
}
