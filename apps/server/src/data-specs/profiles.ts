import type {
  DoctorApproachStep,
  DoctorConsultationMode,
  DoctorFocusArea,
  DoctorLanguage,
  DoctorSpecialty,
} from "@suwa/db/doctor-profile";

export interface DoctorProfileSpec {
  bio: string;
  consultationModes: DoctorConsultationMode[];
  displayName: string;
  experienceStartYear: number;
  focusAreas: DoctorFocusArea[];
  headline: string;
  languages: DoctorLanguage[];
  location: string;
  placeAddress: string;
  placeDescription: string;
  placeName: string;
  specialties: DoctorSpecialty[];
}

export const SPECIALTY_LABELS: Record<DoctorSpecialty, string> = {
  psychiatry: "Psychiatry",
  psychology: "Psychology",
  counseling: "Counseling",
  family_medicine: "Family Medicine",
  general_practice: "General Practice",
  wellness: "Wellness",
};

export const DOCTOR_PROFILE_SPECS: DoctorProfileSpec[] = [
  {
    displayName: "Dr. Mersana Heydari",
    headline:
      "Licensed clinical psychologist specializing in anxiety, depression, and trauma recovery",
    bio: "With over 12 years of experience in clinical psychology, I am deeply committed to helping individuals navigate anxiety, depression, and trauma. My practice integrates cognitive-behavioral therapy with mindfulness-based interventions, creating personalized treatment plans that address each person's unique needs. I believe in building a strong therapeutic alliance based on empathy, trust, and evidence-based practice.",
    specialties: ["psychology", "counseling", "wellness"],
    languages: ["english", "arabic", "hindi"],
    consultationModes: ["video", "chat"],
    focusAreas: ["anxiety", "depression", "trauma", "stress", "sleep"],
    location: "Tabriz, Iran",
    placeName: "Tabriz Mind Wellness Center",
    placeAddress: "123 Valiasr Street, Tabriz",
    placeDescription:
      "A modern mental health facility in the heart of Tabriz, offering private and comfortable therapy rooms.",
    experienceStartYear: 2012,
  },
  {
    displayName: "Dr. Milla Wuori",
    headline:
      "Board-certified psychiatrist focusing on mood disorders and psychiatric care",
    bio: "As a board-certified psychiatrist, I bring medical expertise to mental health treatment, combining pharmacological management with psychotherapeutic approaches. My patients appreciate my thorough, compassionate approach to complex psychiatric conditions. I am especially passionate about working with mood disorders, ADHD, and sleep problems, and I always prioritize informed, collaborative decision-making with each patient.",
    specialties: ["psychiatry"],
    languages: ["english", "spanish"],
    consultationModes: ["video", "in_person"],
    focusAreas: ["depression", "anxiety", "stress", "sleep"],
    location: "Helsinki, Finland",
    placeName: "Nordic Mind Clinic",
    placeAddress: "45 Mannerheimintie, Helsinki",
    placeDescription:
      "A Scandinavian-style clinic offering psychiatric consultations and therapy in a calm, natural setting.",
    experienceStartYear: 2010,
  },
  {
    displayName: "Dr. Albert Leclercq",
    headline:
      "Experienced clinical psychologist with expertise in CBT and behavioral therapy",
    bio: "After completing my Ph.D. in Clinical Psychology in Bern, I dedicated my career to evidence-based psychological interventions. My therapeutic style is active, structured, and collaborative — I believe therapy should produce tangible results. I specialize in treating anxiety disorders, OCD, and phobias using cognitive-behavioral approaches, and I regularly incorporate exposure techniques and behavioral experiments into my practice.",
    specialties: ["psychology", "counseling"],
    languages: ["english", "french", "spanish"],
    consultationModes: ["video", "in_person", "chat"],
    focusAreas: ["anxiety", "stress", "relationships", "burnout"],
    location: "Bern, Switzerland",
    placeName: "Clarity Psychology Practice",
    placeAddress: "78 Bundesgasse, Bern",
    placeDescription:
      "A private psychology practice in Bern's historic center, featuring state-of-the-art therapeutic spaces.",
    experienceStartYear: 2009,
  },
  {
    displayName: "Dr. Giray Bademci",
    headline:
      "Counseling psychologist specializing in trauma, EMDR, and mindfulness-based therapy",
    bio: "My journey in mental health began with a deep curiosity about human resilience. Today, I specialize in trauma-informed care, using EMDR and somatic experiencing alongside evidence-based talk therapy. I take a holistic view, considering biological, psychological, and social factors in every assessment. I have worked extensively with survivors of complex trauma, providing a compassionate and empowering therapeutic space.",
    specialties: ["counseling", "psychology"],
    languages: ["english", "arabic"],
    consultationModes: ["video", "in_person"],
    focusAreas: ["trauma", "depression", "stress", "anxiety"],
    location: "Istanbul, Turkey",
    placeName: "Bosporus Wellness Center",
    placeAddress: "15 Adalar Ferry Road, Istanbul",
    placeDescription:
      "A tranquil wellness center with views of the Bosphorus, offering individual and group therapy services.",
    experienceStartYear: 2011,
  },
  {
    displayName: "Dr. Lotta Kallio",
    headline:
      "Licensed psychologist and wellness expert focused on sleep, stress, and burnout",
    bio: "Wellness is at the core of everything I do. I integrate positive psychology, health coaching, and cognitive-behavioral therapy to help clients achieve sustainable mental wellness. My work spans corporate burnout prevention, sleep improvement programs, and stress management. I am known for my practical, action-oriented approach that gives clients tools they can use immediately in their daily lives.",
    specialties: ["wellness", "psychology", "counseling"],
    languages: ["english", "spanish", "french"],
    consultationModes: ["video", "chat"],
    focusAreas: ["stress", "burnout", "sleep", "relationships"],
    location: "Helsinki, Finland",
    placeName: "Lumo Health & Psychology",
    placeAddress: "8 Aleksanterinkatu, Helsinki",
    placeDescription:
      "A bright, welcoming health practice in central Helsinki specializing in wellness-focused psychology.",
    experienceStartYear: 2013,
  },
];

export interface PatientProfileSpec {
  alias: string;
}

export const PATIENT_PROFILE_SPECS: PatientProfileSpec[] = [
  { alias: "nadia.c" },
  { alias: "ryo.yam" },
  { alias: "ingrid_s" },
  { alias: "kwame.a" },
  { alias: "elena.p" },
];

export interface FocusArea {
  description: string;
  key: DoctorFocusArea;
  label: string;
  relatedSymptoms: string[];
}

export const FOCUS_AREAS: FocusArea[] = [
  {
    key: "anxiety",
    label: "Anxiety",
    description:
      "Generalized anxiety, panic, social anxiety, and specific phobias",
    relatedSymptoms: ["worry", "racing thoughts", "physical tension"],
  },
  {
    key: "depression",
    label: "Depression",
    description:
      "Major depressive disorder, persistent depressive disorder, and situational depression",
    relatedSymptoms: ["low mood", "fatigue", "loss of interest"],
  },
  {
    key: "stress",
    label: "Stress",
    description:
      "Acute and chronic stress from work, life transitions, and daily pressures",
    relatedSymptoms: ["irritability", "sleep disruption", "overwhelm"],
  },
  {
    key: "trauma",
    label: "Trauma",
    description: "PTSD, complex trauma, and trauma from adverse life events",
    relatedSymptoms: ["flashbacks", "hypervigilance", "emotional numbness"],
  },
  {
    key: "sleep",
    label: "Sleep",
    description: "Insomnia, sleep hygiene issues, circadian rhythm disorders",
    relatedSymptoms: [
      "difficulty falling asleep",
      "frequent waking",
      "daytime fatigue",
    ],
  },
  {
    key: "burnout",
    label: "Burnout",
    description:
      "Workplace burnout, compassion fatigue, and occupational stress",
    relatedSymptoms: ["exhaustion", "cynicism", "reduced performance"],
  },
  {
    key: "relationships",
    label: "Relationships",
    description:
      "Relationship difficulties, communication issues, and family conflicts",
    relatedSymptoms: ["conflict", "isolation", "attachment concerns"],
  },
  {
    key: "grief",
    label: "Grief",
    description: "Bereavement, loss, and life transitions",
    relatedSymptoms: ["sadness", "emptiness", "difficulty moving on"],
  },
];

export function buildApproachSteps(steps: string[]): DoctorApproachStep[] {
  return steps.map((text) => ({
    id: crypto.randomUUID(),
    text,
  }));
}
