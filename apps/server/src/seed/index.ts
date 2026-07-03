import {
  clinics,
  createDb,
  doctorCredits,
  doctorEducationEntries,
  doctorHospitalAffiliations,
  doctorHubChannels,
  doctorPlans,
  doctorProfiles,
  doctorWeeklyAvailability,
  tenantAdmins,
  tenantAuditLogs,
  tenants,
  users,
} from "@suwa/db";
import type {
  DoctorConsultationMode,
  DoctorFocusArea,
  DoctorLanguage,
  DoctorSpecialty,
} from "@suwa/db/doctor-profile";
import placesData from "../../../map-scraper/places_data.json";
import { CHANNEL_SPECS } from "../data-specs/content";

import { clinicId, doctorId, SEED_ADMIN_ID, tenantId } from "./ids";
import { unseedData } from "./unseed";

interface PlaceEntry {
  address: string;
  category: string;
  latitude: number;
  longitude: number;
  name: string;
  phone: string | null;
  place_id: string;
  rating: number | null;
  review_count: number | null;
  url: string;
  website: string | null;
}

interface DoctorSeed {
  bio: string;
  displayName: string;
  email: string;
  experienceStartYear: number;
  focusAreas: DoctorFocusArea[];
  headline: string;
  languages: DoctorLanguage[];
  licenseNumber: string;
  portraitUrl: string;
  primaryTenantIndex: number;
  secondaryTenantIndex: number;
  specialties: DoctorSpecialty[];
}

interface TimeWindow {
  dayOfWeek: number;
  endTime: string;
  startTime: string;
}

const CLINIC_BY_CATEGORY: Record<string, string[]> = {
  "Government hospital": ["Women's Mental Health Clinic", "Community Psychiatry OPD"],
  Hospital: ["General Mental Health Clinic", "Stress and Sleep Clinic"],
  "Medical Center": ["OPD Wellness Clinic", "Counseling and Lifestyle Clinic"],
  "Private hospital": ["Specialist Psychiatry Clinic", "Psychology and Counseling Unit"],
};

const SEED_CLINIC_IDS = placesData.flatMap((place, tenantIndex) =>
  clinicSpecsForPlace(place).map((_, clinicIndex) =>
    clinicId(tenantIndex, clinicIndex)
  )
);

const DOCTORS: DoctorSeed[] = [
  {
    displayName: "Dr. Anjalee Perera",
    email: "anjalee.perera@suwa.care",
    headline: "Consultant psychiatrist for anxiety, depression, and women's mental health",
    bio: "Dr. Anjalee Perera provides evidence-based psychiatric care for adults and perinatal patients in Galle. Her work combines careful diagnostic assessment, medication review when needed, and practical relapse-prevention planning for families.",
    specialties: ["psychiatry"],
    languages: ["english", "sinhala"],
    focusAreas: ["anxiety", "depression", "sleep", "stress"],
    experienceStartYear: 2011,
    licenseNumber: "SLMC-PSY-10482",
    portraitUrl: sriLankanPortraitUrl(14694725),
    primaryTenantIndex: 0,
    secondaryTenantIndex: 8,
  },
  {
    displayName: "Dr. Nuwan Jayasinghe",
    email: "nuwan.jayasinghe@suwa.care",
    headline: "Clinical psychologist focused on CBT, panic symptoms, and burnout recovery",
    bio: "Dr. Nuwan Jayasinghe supports professionals, students, and caregivers experiencing panic, burnout, and adjustment stress. His sessions are structured, goal-oriented, and grounded in cognitive behavioral therapy and behavioral activation.",
    specialties: ["psychology", "counseling"],
    languages: ["english", "sinhala"],
    focusAreas: ["anxiety", "burnout", "stress", "sleep"],
    experienceStartYear: 2013,
    licenseNumber: "SLCP-CLP-2381",
    portraitUrl: sriLankanPortraitUrl(6168671),
    primaryTenantIndex: 2,
    secondaryTenantIndex: 9,
  },
  {
    displayName: "Dr. Tharushi Fernando",
    email: "tharushi.fernando@suwa.care",
    headline: "Counseling psychologist for trauma recovery and relationship stress",
    bio: "Dr. Tharushi Fernando works with adults recovering from trauma, grief, and relationship strain. She uses trauma-informed counseling, stabilization skills, and family-sensitive care planning.",
    specialties: ["psychology", "counseling"],
    languages: ["english", "sinhala"],
    focusAreas: ["trauma", "grief", "relationships", "anxiety"],
    experienceStartYear: 2014,
    licenseNumber: "SLCP-COU-3194",
    portraitUrl: sriLankanPortraitUrl(9228161),
    primaryTenantIndex: 3,
    secondaryTenantIndex: 6,
  },
  {
    displayName: "Dr. Mohamed Rizwan",
    email: "mohamed.rizwan@suwa.care",
    headline: "General practitioner with a special interest in stress-linked physical symptoms",
    bio: "Dr. Mohamed Rizwan helps patients understand the connection between stress, sleep, pain, and chronic disease. He coordinates medical screening with counseling referrals where appropriate.",
    specialties: ["general_practice", "wellness"],
    languages: ["english", "sinhala", "tamil"],
    focusAreas: ["stress", "sleep", "burnout", "anxiety"],
    experienceStartYear: 2010,
    licenseNumber: "SLMC-GP-09217",
    portraitUrl: sriLankanPortraitUrl(38331275),
    primaryTenantIndex: 4,
    secondaryTenantIndex: 5,
  },
  {
    displayName: "Dr. Isuri Wickramasinghe",
    email: "isuri.wickramasinghe@suwa.care",
    headline: "Family physician for long-term mental wellness and chronic stress care",
    bio: "Dr. Isuri Wickramasinghe offers family medicine consultations with a strong focus on preventive mental health. She supports patients managing work stress, sleep disruption, and lifestyle change.",
    specialties: ["family_medicine", "wellness"],
    languages: ["english", "sinhala"],
    focusAreas: ["stress", "sleep", "parenting", "burnout"],
    experienceStartYear: 2012,
    licenseNumber: "SLMC-FAM-11743",
    portraitUrl: sriLankanPortraitUrl(18874846),
    primaryTenantIndex: 5,
    secondaryTenantIndex: 0,
  },
  {
    displayName: "Dr. Kavinda Samarasinghe",
    email: "kavinda.samarasinghe@suwa.care",
    headline: "Psychiatrist specializing in mood disorders and sleep disturbance",
    bio: "Dr. Kavinda Samarasinghe treats depression, bipolar-spectrum symptoms, and insomnia with a balanced medical and psychosocial approach. He emphasizes clear explanations and shared treatment decisions.",
    specialties: ["psychiatry"],
    languages: ["english", "sinhala"],
    focusAreas: ["depression", "sleep", "anxiety", "stress"],
    experienceStartYear: 2009,
    licenseNumber: "SLMC-PSY-08766",
    portraitUrl: sriLankanPortraitUrl(38331276),
    primaryTenantIndex: 0,
    secondaryTenantIndex: 1,
  },
  {
    displayName: "Dr. Dilini Senanayake",
    email: "dilini.senanayake@suwa.care",
    headline: "Clinical psychologist for adolescents, parenting concerns, and school stress",
    bio: "Dr. Dilini Senanayake works with teenagers, parents, and young adults facing anxiety, exam pressure, and family transitions. Her care plans include skills coaching and practical home routines.",
    specialties: ["psychology", "counseling"],
    languages: ["english", "sinhala"],
    focusAreas: ["parenting", "anxiety", "relationships", "stress"],
    experienceStartYear: 2015,
    licenseNumber: "SLCP-CLP-4219",
    portraitUrl: sriLankanPortraitUrl(12681761),
    primaryTenantIndex: 2,
    secondaryTenantIndex: 8,
  },
  {
    displayName: "Dr. Suresh Pathirana",
    email: "suresh.pathirana@suwa.care",
    headline: "Addiction-focused mental health clinician and recovery care coordinator",
    bio: "Dr. Suresh Pathirana supports patients and families affected by alcohol use, relapse risk, and co-occurring anxiety or depression. His work includes motivational interviewing and structured recovery planning.",
    specialties: ["psychiatry", "counseling"],
    languages: ["english", "sinhala"],
    focusAreas: ["addiction", "depression", "relationships", "stress"],
    experienceStartYear: 2008,
    licenseNumber: "SLMC-PSY-07612",
    portraitUrl: sriLankanPortraitUrl(37052011),
    primaryTenantIndex: 2,
    secondaryTenantIndex: 6,
  },
  {
    displayName: "Dr. Ayesha Haniffa",
    email: "ayesha.haniffa@suwa.care",
    headline: "Counselor for grief, life transitions, and culturally sensitive care",
    bio: "Dr. Ayesha Haniffa provides warm, culturally aware counseling for grief, family stress, and adjustment difficulties. She works in English, Sinhala, and Tamil with patients from diverse communities.",
    specialties: ["counseling", "wellness"],
    languages: ["english", "sinhala", "tamil"],
    focusAreas: ["grief", "relationships", "stress", "depression"],
    experienceStartYear: 2016,
    licenseNumber: "SLCP-COU-5068",
    portraitUrl: sriLankanPortraitUrl(14694725),
    primaryTenantIndex: 4,
    secondaryTenantIndex: 9,
  },
  {
    displayName: "Dr. Chamara Ekanayake",
    email: "chamara.ekanayake@suwa.care",
    headline: "Mind-body wellness physician for fatigue, stress, and lifestyle medicine",
    bio: "Dr. Chamara Ekanayake blends general practice with lifestyle medicine for fatigue, stress, and early cardiometabolic risk. He creates realistic sleep, movement, and work-rest plans.",
    specialties: ["general_practice", "wellness"],
    languages: ["english", "sinhala"],
    focusAreas: ["burnout", "sleep", "stress", "anxiety"],
    experienceStartYear: 2011,
    licenseNumber: "SLMC-GP-10934",
    portraitUrl: sriLankanPortraitUrl(9333028),
    primaryTenantIndex: 5,
    secondaryTenantIndex: 7,
  },
  {
    displayName: "Dr. Malithi Abeywardena",
    email: "malithi.abeywardena@suwa.care",
    headline: "Psychologist specializing in trauma-informed therapy and EMDR-informed care",
    bio: "Dr. Malithi Abeywardena supports adults who feel stuck after traumatic experiences, workplace incidents, or loss. She prioritizes safety, stabilization, and step-by-step emotional processing.",
    specialties: ["psychology", "counseling"],
    languages: ["english", "sinhala"],
    focusAreas: ["trauma", "grief", "anxiety", "sleep"],
    experienceStartYear: 2012,
    licenseNumber: "SLCP-CLP-2870",
    portraitUrl: sriLankanPortraitUrl(9228161),
    primaryTenantIndex: 3,
    secondaryTenantIndex: 0,
  },
  {
    displayName: "Dr. Janaka de Silva",
    email: "janaka.desilva@suwa.care",
    headline: "Senior psychiatrist for complex depression and collaborative hospital care",
    bio: "Dr. Janaka de Silva has long experience supporting patients with persistent depression, anxiety, and medically complex presentations. He works closely with hospital teams and families when care needs are layered.",
    specialties: ["psychiatry"],
    languages: ["english", "sinhala"],
    focusAreas: ["depression", "anxiety", "sleep", "relationships"],
    experienceStartYear: 2004,
    licenseNumber: "SLMC-PSY-05443",
    portraitUrl: sriLankanPortraitUrl(32298398),
    primaryTenantIndex: 1,
    secondaryTenantIndex: 2,
  },
  {
    displayName: "Dr. Himashi Karunaratne",
    email: "himashi.karunaratne@suwa.care",
    headline: "Psychologist for workplace burnout, perfectionism, and anxiety",
    bio: "Dr. Himashi Karunaratne works with teachers, healthcare staff, managers, and university students experiencing burnout and perfectionism. Her sessions translate insight into practical weekly behavior changes.",
    specialties: ["psychology", "wellness"],
    languages: ["english", "sinhala"],
    focusAreas: ["burnout", "anxiety", "stress", "sleep"],
    experienceStartYear: 2017,
    licenseNumber: "SLCP-CLP-5572",
    portraitUrl: sriLankanPortraitUrl(18874846),
    primaryTenantIndex: 6,
    secondaryTenantIndex: 4,
  },
  {
    displayName: "Dr. Pradeep Gunawardena",
    email: "pradeep.gunawardena@suwa.care",
    headline: "Family medicine doctor for chronic illness, stress, and preventive care",
    bio: "Dr. Pradeep Gunawardena supports families managing diabetes, hypertension, stress, and sleep problems. He is known for clear plans, follow-up discipline, and patient education.",
    specialties: ["family_medicine", "general_practice"],
    languages: ["english", "sinhala"],
    focusAreas: ["stress", "sleep", "parenting", "burnout"],
    experienceStartYear: 2007,
    licenseNumber: "SLMC-FAM-08390",
    portraitUrl: sriLankanPortraitUrl(5042879),
    primaryTenantIndex: 0,
    secondaryTenantIndex: 5,
  },
  {
    displayName: "Dr. Shalini Rajendran",
    email: "shalini.rajendran@suwa.care",
    headline: "Tamil-speaking counselor for anxiety, grief, and family transitions",
    bio: "Dr. Shalini Rajendran provides counseling for adults and families navigating bereavement, migration stress, and anxiety. She offers bilingual support in Tamil and English.",
    specialties: ["counseling", "psychology"],
    languages: ["english", "tamil"],
    focusAreas: ["grief", "anxiety", "relationships", "stress"],
    experienceStartYear: 2015,
    licenseNumber: "SLCP-COU-4813",
    portraitUrl: sriLankanPortraitUrl(12681761),
    primaryTenantIndex: 8,
    secondaryTenantIndex: 4,
  },
  {
    displayName: "Dr. Lahiru Mendis",
    email: "lahiru.mendis@suwa.care",
    headline: "General psychiatrist for young adults, sleep, and stress-related disorders",
    bio: "Dr. Lahiru Mendis works with young adults facing anxiety, mood changes, insomnia, and early career pressure. He combines psychiatric review with behaviorally focused self-management plans.",
    specialties: ["psychiatry"],
    languages: ["english", "sinhala"],
    focusAreas: ["anxiety", "depression", "sleep", "burnout"],
    experienceStartYear: 2014,
    licenseNumber: "SLMC-PSY-13204",
    portraitUrl: sriLankanPortraitUrl(6153953),
    primaryTenantIndex: 3,
    secondaryTenantIndex: 1,
  },
  {
    displayName: "Dr. Oshadi Nanayakkara",
    email: "oshadi.nanayakkara@suwa.care",
    headline: "Counseling psychologist for couples, communication, and stress management",
    bio: "Dr. Oshadi Nanayakkara helps couples and individuals build healthier communication patterns. Her work includes emotion regulation, conflict mapping, and values-based decision making.",
    specialties: ["counseling", "psychology"],
    languages: ["english", "sinhala"],
    focusAreas: ["relationships", "stress", "anxiety", "grief"],
    experienceStartYear: 2016,
    licenseNumber: "SLCP-COU-5361",
    portraitUrl: sriLankanPortraitUrl(14694725),
    primaryTenantIndex: 9,
    secondaryTenantIndex: 6,
  },
  {
    displayName: "Dr. Roshan Wijesekera",
    email: "roshan.wijesekera@suwa.care",
    headline: "Wellness physician for sleep health, stress screening, and resilience plans",
    bio: "Dr. Roshan Wijesekera focuses on practical prevention for sleep disruption, stress overload, and early burnout. He creates measurable lifestyle plans that can be reviewed over short follow-ups.",
    specialties: ["wellness", "general_practice"],
    languages: ["english", "sinhala"],
    focusAreas: ["sleep", "stress", "burnout", "anxiety"],
    experienceStartYear: 2013,
    licenseNumber: "SLMC-GP-12048",
    portraitUrl: sriLankanPortraitUrl(6168671),
    primaryTenantIndex: 4,
    secondaryTenantIndex: 7,
  },
  {
    displayName: "Dr. Piumi Liyanage",
    email: "piumi.liyanage@suwa.care",
    headline: "Clinical psychologist for depression, self-esteem, and emotional regulation",
    bio: "Dr. Piumi Liyanage supports adults with low mood, self-criticism, and emotional overwhelm. She combines CBT, compassion-focused therapy, and structured between-session exercises.",
    specialties: ["psychology", "counseling"],
    languages: ["english", "sinhala"],
    focusAreas: ["depression", "anxiety", "relationships", "stress"],
    experienceStartYear: 2018,
    licenseNumber: "SLCP-CLP-6039",
    portraitUrl: sriLankanPortraitUrl(9228161),
    primaryTenantIndex: 5,
    secondaryTenantIndex: 3,
  },
  {
    displayName: "Dr. Dinesh Alwis",
    email: "dinesh.alwis@suwa.care",
    headline: "Psychiatrist for substance use recovery and relapse-prevention medicine",
    bio: "Dr. Dinesh Alwis provides psychiatric care for patients managing alcohol use, sleep disturbance, and depression. He uses non-judgmental assessment and coordinated follow-up with family supports.",
    specialties: ["psychiatry"],
    languages: ["english", "sinhala"],
    focusAreas: ["addiction", "depression", "sleep", "stress"],
    experienceStartYear: 2006,
    licenseNumber: "SLMC-PSY-06428",
    portraitUrl: sriLankanPortraitUrl(38331276),
    primaryTenantIndex: 2,
    secondaryTenantIndex: 0,
  },
  {
    displayName: "Dr. Nadini Herath",
    email: "nadini.herath@suwa.care",
    headline: "Family medicine clinician for maternal wellbeing and parenting stress",
    bio: "Dr. Nadini Herath works with parents and caregivers experiencing exhaustion, anxiety, and role transitions. She combines family medicine review with supportive mental health planning.",
    specialties: ["family_medicine", "wellness"],
    languages: ["english", "sinhala"],
    focusAreas: ["parenting", "sleep", "stress", "depression"],
    experienceStartYear: 2012,
    licenseNumber: "SLMC-FAM-11475",
    portraitUrl: sriLankanPortraitUrl(18874846),
    primaryTenantIndex: 8,
    secondaryTenantIndex: 1,
  },
  {
    displayName: "Dr. Sameera Bandara",
    email: "sameera.bandara@suwa.care",
    headline: "CBT-oriented psychologist for panic, social anxiety, and avoidance patterns",
    bio: "Dr. Sameera Bandara helps patients gradually reduce avoidance and rebuild confidence. His work includes exposure planning, cognitive restructuring, and progress measurement.",
    specialties: ["psychology", "counseling"],
    languages: ["english", "sinhala"],
    focusAreas: ["anxiety", "stress", "relationships", "sleep"],
    experienceStartYear: 2017,
    licenseNumber: "SLCP-CLP-5888",
    portraitUrl: sriLankanPortraitUrl(37052011),
    primaryTenantIndex: 6,
    secondaryTenantIndex: 9,
  },
  {
    displayName: "Dr. Menaka Kularatne",
    email: "menaka.kularatne@suwa.care",
    headline: "Counselor for grief, caregiver strain, and end-of-life family support",
    bio: "Dr. Menaka Kularatne provides counseling for grief, caregiver stress, and difficult family transitions. She is especially attentive to pacing, dignity, and practical support networks.",
    specialties: ["counseling", "wellness"],
    languages: ["english", "sinhala"],
    focusAreas: ["grief", "stress", "relationships", "burnout"],
    experienceStartYear: 2010,
    licenseNumber: "SLCP-COU-2617",
    portraitUrl: sriLankanPortraitUrl(12681761),
    primaryTenantIndex: 7,
    secondaryTenantIndex: 2,
  },
  {
    displayName: "Dr. Harindra Peiris",
    email: "harindra.peiris@suwa.care",
    headline: "Senior general practitioner for integrated OPD and mental wellness follow-up",
    bio: "Dr. Harindra Peiris provides broad OPD care with careful attention to stress-related symptoms, sleep, and treatment adherence. He is experienced in coordinating referrals across Galle hospitals.",
    specialties: ["general_practice", "family_medicine"],
    languages: ["english", "sinhala"],
    focusAreas: ["stress", "sleep", "anxiety", "burnout"],
    experienceStartYear: 2003,
    licenseNumber: "SLMC-GP-04391",
    portraitUrl: sriLankanPortraitUrl(32298398),
    primaryTenantIndex: 1,
    secondaryTenantIndex: 5,
  },
];

const DEGREE_POOL = [
  ["MBBS", "University of Ruhuna", 2003],
  ["MD Psychiatry", "Postgraduate Institute of Medicine, University of Colombo", 2011],
  ["MSc Clinical Psychology", "University of Colombo", 2014],
  ["Postgraduate Diploma in Counseling", "University of Peradeniya", 2016],
  ["Diploma in Cognitive Behavioral Therapy", "Sri Lanka Foundation Institute", 2018],
] as const;

const APPROACH_STEPS = [
  "Start with a focused assessment of symptoms, medical history, sleep, stressors, and current supports.",
  "Agree on a clear care plan with measurable goals for the next two to four weeks.",
  "Use evidence-based interventions such as CBT skills, medication review, family education, or lifestyle planning where appropriate.",
  "Review progress regularly and adjust the plan based on symptoms, safety, and patient preference.",
];

const AFFILIATION_WINDOWS: TimeWindow[][] = [
  [
    { dayOfWeek: 1, startTime: "08:30", endTime: "12:30" },
    { dayOfWeek: 3, startTime: "14:00", endTime: "18:00" },
  ],
  [
    { dayOfWeek: 2, startTime: "09:00", endTime: "13:00" },
    { dayOfWeek: 5, startTime: "15:00", endTime: "19:00" },
  ],
  [
    { dayOfWeek: 4, startTime: "08:00", endTime: "12:00" },
    { dayOfWeek: 6, startTime: "09:00", endTime: "12:00" },
  ],
  [
    { dayOfWeek: 1, startTime: "16:00", endTime: "20:00" },
    { dayOfWeek: 5, startTime: "08:30", endTime: "12:30" },
  ],
];

const PATIENT_AVAILABILITY_CANDIDATES: TimeWindow[] = [
  { dayOfWeek: 0, startTime: "09:00", endTime: "11:00" },
  { dayOfWeek: 0, startTime: "14:00", endTime: "16:00" },
  { dayOfWeek: 1, startTime: "13:00", endTime: "15:00" },
  { dayOfWeek: 2, startTime: "14:00", endTime: "16:00" },
  { dayOfWeek: 3, startTime: "09:00", endTime: "11:00" },
  { dayOfWeek: 4, startTime: "13:00", endTime: "15:00" },
  { dayOfWeek: 5, startTime: "13:00", endTime: "15:00" },
  { dayOfWeek: 6, startTime: "13:00", endTime: "15:00" },
  { dayOfWeek: 2, startTime: "16:00", endTime: "18:00" },
  { dayOfWeek: 4, startTime: "16:00", endTime: "18:00" },
];

export async function runSeed() {
  const db = createDb();
  await unseedData(db);

  const now = new Date().toISOString();
  const places = placesData as PlaceEntry[];

  await db.insert(users).values({
    id: SEED_ADMIN_ID,
    name: "Galle Health Network Admin",
    email: "admin.galle.seed@suwa.care",
    emailVerified: true,
    role: "admin",
    createdAt: new Date(now),
    updatedAt: new Date(now),
  });

  await insertRows(
    db,
    tenants,
    places.map((place, index) => ({
      id: tenantId(index),
      name: place.name,
      type: place.category === "Government hospital" ? "PUBLIC_HOSPITAL" as const : "PRIVATE_HOSPITAL" as const,
      address: place.address,
      contactInfo: JSON.stringify({
        category: place.category,
        googleMapsUrl: place.url,
        rating: place.rating,
        reviewCount: place.review_count,
      }),
      logo: null,
      status: "ACTIVE" as const,
      services: JSON.stringify(servicesForCategory(place.category)),
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      phone: place.phone ?? null,
      website: place.website ?? null,
      placeDataRef: `${place.name}||${place.place_id}`,
      createdBy: SEED_ADMIN_ID,
      createdAt: now,
      updatedAt: now,
    }))
  );

  await insertRows(
    db,
    tenantAdmins,
    places.map((_, index) => ({
      id: `seed-tenant-admin-${index + 1}`,
      tenantId: tenantId(index),
      userId: SEED_ADMIN_ID,
      createdAt: now,
    }))
  );

  await insertRows(
    db,
    tenantAuditLogs,
    places.map((place, index) => ({
      id: `seed-tenant-audit-${index + 1}`,
      tenantId: tenantId(index),
      actorId: SEED_ADMIN_ID,
      action: "TENANT_SEEDED",
      entityType: "tenant",
      entityId: tenantId(index),
      details: JSON.stringify({ source: "apps/map-scraper/places_data.json", name: place.name }),
      createdAt: now,
    }))
  );

  await insertRows(
    db,
    clinics,
    places.flatMap((place, tenantIndex) =>
      clinicSpecsForPlace(place).map((clinic, clinicIndex) => ({
        id: clinicId(tenantIndex, clinicIndex),
        tenantId: tenantId(tenantIndex),
        name: clinic.name,
        specialization: clinic.specialization,
        schedule: JSON.stringify(clinic.schedule),
        createdAt: now,
        updatedAt: now,
      }))
    )
  );

  await insertRows(
    db,
    users,
    DOCTORS.map((doctor, index) => ({
      id: doctorId(index),
      name: doctor.displayName,
      email: doctor.email,
      emailVerified: true,
      image: doctor.portraitUrl,
      role: "doctor",
      createdAt: new Date(now),
      updatedAt: new Date(now),
    }))
  );

  await insertRows(
    db,
    doctorProfiles,
    DOCTORS.map((doctor, index) => {
      const primaryPlace = places[doctor.primaryTenantIndex];
      return {
        userId: doctorId(index),
        displayName: doctor.displayName,
        headline: doctor.headline,
        bio: doctor.bio,
        licenseNumber: doctor.licenseNumber,
        location: "Galle, Sri Lanka",
        placeName: primaryPlace?.name ?? "Galle Medical Practice",
        placeAddress: primaryPlace?.address ?? "Galle 80000",
        placeDescription: `${primaryPlace?.name ?? "Galle clinic"} provides in-person care in Galle with coordinated online follow-up through Suwa.`,
        experienceStartYear: doctor.experienceStartYear,
        specialties: JSON.stringify(doctor.specialties),
        languages: JSON.stringify(doctor.languages),
        consultationModes: JSON.stringify(consultationModesForDoctor(index)),
        focusAreas: JSON.stringify(doctor.focusAreas),
        approachSteps: JSON.stringify(
          APPROACH_STEPS.map((text, stepIndex) => ({
            id: `seed-approach-${index + 1}-${stepIndex + 1}`,
            text,
          }))
        ),
        approach:
          "Care is practical, culturally aware, and collaborative. Each plan combines clinical assessment with achievable changes patients can use between appointments.",
        education: educationSummary(index),
        permanent: true,
        stripeAccountEnabled: false,
        faceEmbeddingKvKey: `seed/face-embeddings/${doctorId(index)}.json`,
        createdAt: now,
        updatedAt: now,
      };
    })
  );

  await insertRows(
    db,
    doctorEducationEntries,
    DOCTORS.flatMap((_, doctorIndex) => educationEntriesForDoctor(doctorIndex, now))
  );

  await insertRows(db, doctorHubChannels, buildSeedHubChannels(now));

  await insertRows(
    db,
    doctorCredits,
    DOCTORS.map((_, index) => ({
      doctorId: doctorId(index),
      balanceCents: 0,
      totalEarnedCents: 0,
      totalCashedOutCents: 0,
      createdAt: now,
      updatedAt: now,
    }))
  );

  await insertRows(
    db,
    doctorPlans,
    DOCTORS.flatMap((_, index) => [
      {
        id: `seed-plan-${index + 1}-short`,
        doctorId: doctorId(index),
        name: "Focused Follow-up",
        description: "A concise review for medication, therapy homework, or progress check-ins.",
        creditCost: 1,
        priceCents: 2500,
        durationMinutes: 20,
        features: JSON.stringify(["20 minute appointment", "Care plan update", "Secure chat summary"]),
        isActive: true,
        isDefault: true,
        sortOrder: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: `seed-plan-${index + 1}-initial`,
        doctorId: doctorId(index),
        name: "Initial Consultation",
        description: "A full first appointment with assessment, goals, and next-step planning.",
        creditCost: 2,
        priceCents: 5000,
        durationMinutes: 45,
        features: JSON.stringify(["45 minute appointment", "Assessment and history", "Written next steps"]),
        isActive: true,
        isDefault: false,
        sortOrder: 2,
        createdAt: now,
        updatedAt: now,
      },
    ])
  );

  await insertRows(
    db,
    doctorWeeklyAvailability,
    DOCTORS.flatMap((_, index) => weeklyAvailabilityForDoctor(index, now))
  );

  await insertRows(
    db,
    doctorHospitalAffiliations,
    DOCTORS.flatMap((doctor, index) => [
      affiliationForDoctor(index, doctor.primaryTenantIndex, 0, now),
      affiliationForDoctor(index, doctor.secondaryTenantIndex, 1, now),
    ])
  );

  return {
    tenants: places.length,
    clinics: SEED_CLINIC_IDS.length,
    doctors: DOCTORS.length,
    hubChannels: DOCTORS.length,
    affiliations: DOCTORS.length * 2,
    weeklyAvailabilityWindows: DOCTORS.length * 4,
  };
}

async function insertRows(
  db: ReturnType<typeof createDb>,
  table: unknown,
  rows: readonly unknown[]
) {
  for (const row of rows) {
    await (db.insert as (table: unknown) => { values: (row: unknown) => Promise<unknown> })(
      table
    ).values(row);
  }
}

function buildSeedHubChannels(now: string) {
  return DOCTORS.map((doctor, index) => {
    const spec = CHANNEL_SPECS[index % CHANNEL_SPECS.length];
    return {
      id: `seed-hub-channel-${index + 1}`,
      doctorId: doctorId(index),
      name: `${doctor.displayName}'s Channel`,
      handle: slug(`${doctor.displayName}-channel`),
      description: spec?.description ?? null,
      avatarKey: null,
      bannerKey: null,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    };
  });
}

function sriLankanPortraitUrl(photoId: number) {
  return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=800&dpr=2`;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function servicesForCategory(category: string) {
  if (category === "Government hospital") {
    return ["EMERGENCY", "THEATRE", "ICU", "OPD", "PHARMACY", "LABORATORY", "RADIOLOGY"];
  }
  if (category === "Medical Center") {
    return ["OPD", "PHARMACY", "LABORATORY", "PHYSIOTHERAPY"];
  }
  return ["EMERGENCY", "OPD", "PHARMACY", "LABORATORY", "ICU", "RADIOLOGY"];
}

function clinicSpecsForPlace(place: Pick<PlaceEntry, "category" | "name">) {
  const names = CLINIC_BY_CATEGORY[place.category] ?? CLINIC_BY_CATEGORY["Private hospital"];
  return (names ?? []).map((name, index) => ({
    name,
    specialization: index === 0 ? "Mental Health OPD" : "Counseling and Wellness",
    schedule: index === 0
        ? [
            { dayOfWeek: 1, startTime: "08:30", endTime: "12:30" },
            { dayOfWeek: 3, startTime: "14:00", endTime: "18:00" },
            { dayOfWeek: 5, startTime: "09:00", endTime: "13:00" },
          ]
        : [
            { dayOfWeek: 2, startTime: "09:00", endTime: "13:00" },
            { dayOfWeek: 4, startTime: "15:00", endTime: "19:00" },
            { dayOfWeek: 6, startTime: "09:00", endTime: "12:00" },
          ],
  }));
}

function consultationModesForDoctor(index: number): DoctorConsultationMode[] {
  if (index % 3 === 0) {
    return ["in_person", "video", "chat"];
  }
  if (index % 3 === 1) {
    return ["in_person", "video"];
  }
  return ["video", "chat"];
}

function educationSummary(index: number) {
  const primary = DEGREE_POOL[index % DEGREE_POOL.length];
  const secondary = DEGREE_POOL[(index + 2) % DEGREE_POOL.length];
  return `${primary?.[0]}, ${primary?.[1]} (${(primary?.[2] ?? 2000) + (index % 5)})\n${secondary?.[0]}, ${secondary?.[1]} (${(secondary?.[2] ?? 2000) + (index % 4)})`;
}

function educationEntriesForDoctor(doctorIndex: number, now: string) {
  const primary = DEGREE_POOL[doctorIndex % DEGREE_POOL.length];
  const secondary = DEGREE_POOL[(doctorIndex + 2) % DEGREE_POOL.length];
  return [primary, secondary].map((entry, entryIndex) => ({
    id: `seed-education-${doctorIndex + 1}-${entryIndex + 1}`,
    doctorId: doctorId(doctorIndex),
    degree: entry?.[0] ?? "MBBS",
    institution: entry?.[1] ?? "University of Ruhuna",
    year: (entry?.[2] ?? 2000) + ((doctorIndex + entryIndex) % 5),
    createdAt: now,
    updatedAt: now,
  }));
}

function weeklyAvailabilityForDoctor(index: number, now: string) {
  const hospitalWindows = [
    ...(AFFILIATION_WINDOWS[index % AFFILIATION_WINDOWS.length] ?? []),
    ...(AFFILIATION_WINDOWS[(index + 1) % AFFILIATION_WINDOWS.length] ?? []),
  ];
  const patientWindows = PATIENT_AVAILABILITY_CANDIDATES.filter(
    (candidate) =>
      !hospitalWindows.some((hospitalWindow) => windowsOverlap(candidate, hospitalWindow))
  ).slice(0, 4);

  return patientWindows.map((window, windowIndex) => ({
    id: `seed-weekly-availability-${index + 1}-${windowIndex + 1}`,
    doctorId: doctorId(index),
    dayOfWeek: window.dayOfWeek,
    startTime: window.startTime,
    endTime: window.endTime,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  }));
}

function windowsOverlap(a: TimeWindow, b: TimeWindow) {
  if (a.dayOfWeek !== b.dayOfWeek) {
    return false;
  }
  return (
    timeToMinutes(a.startTime) < timeToMinutes(b.endTime) &&
    timeToMinutes(a.endTime) > timeToMinutes(b.startTime)
  );
}

function timeToMinutes(time: string) {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function affiliationForDoctor(
  doctorIndex: number,
  tenantIndex: number,
  slotOffset: number,
  now: string
) {
  const windows = AFFILIATION_WINDOWS[(doctorIndex + slotOffset) % AFFILIATION_WINDOWS.length] ?? [];
  return {
    id: `seed-affiliation-${doctorIndex + 1}-${slotOffset + 1}`,
    doctorId: doctorId(doctorIndex),
    tenantId: tenantId(tenantIndex),
    status: "ACTIVE" as const,
    availabilityWindows: JSON.stringify(windows),
    createdAt: now,
    updatedAt: now,
  };
}
