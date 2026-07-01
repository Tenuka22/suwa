import {
  clinics,
  createDb,
  doctorCredits,
  doctorEducationEntries,
  doctorFiles,
  doctorHospitalAffiliations,
  doctorHubChannels,
  doctorHubMaterials,
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
import { CHANNEL_SPECS, MATERIAL_SPECS_VIDEO } from "../data-specs/content";

import { clinicId, doctorId, SEED_ADMIN_ID, tenantId } from "./ids";
import { unseedData } from "./unseed";

type ReadAsset = (filename: string) => Promise<ArrayBuffer | null>;

interface SeedContext {
  ai: Ai;
  chatMessagesKv: KVNamespace;
  doctorMaterialsKv: KVNamespace;
  modelFeaturesKv: KVNamespace;
  readAsset: ReadAsset;
}

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
    portraitUrl: "https://randomuser.me/api/portraits/women/44.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/men/32.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/women/68.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/men/75.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/women/12.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/men/41.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/women/79.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/men/62.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/women/23.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/men/18.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/women/55.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/men/83.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/women/90.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/men/26.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/women/40.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/men/11.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/women/31.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/men/54.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/women/84.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/men/90.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/women/7.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/men/37.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/women/59.jpg",
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
    portraitUrl: "https://randomuser.me/api/portraits/men/69.jpg",
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

export async function runSeed(_context: SeedContext) {
  const db = createDb();
  await unseedData(db, _context.doctorMaterialsKv);

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

  const { doctorFileRows, hubMaterialRows } = await buildSeedDoctorFiles(
    _context.doctorMaterialsKv,
    _context.readAsset,
    now
  );
  await insertRows(db, doctorFiles, doctorFileRows);
  await insertRows(db, doctorHubMaterials, hubMaterialRows);

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
    doctorFiles: doctorFileRows.length,
    hubMaterials: hubMaterialRows.length,
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

async function buildSeedDoctorFiles(
  doctorMaterialsKv: KVNamespace,
  readAsset: ReadAsset,
  now: string
) {
  const fileRows = [];
  const hubRows = [];

  for (const [index, doctor] of DOCTORS.entries()) {
    const id = doctorId(index);
    const accent = ["#0f766e", "#2563eb", "#7c3aed", "#be123c", "#047857"][index % 5] ?? "#0f766e";
    const portraitImage = await fetchPortraitImage(doctor.portraitUrl);
    const qualificationSvg = buildQualificationSvg(doctor, accent);
    const videoSpec = MATERIAL_SPECS_VIDEO[index % 4];
    const videoFileName = videoSpec?.seedFile ?? "WiJn9EpvtEk.mp4";
    const videoAsset = await readSeedAsset(readAsset, doctorMaterialsKv, videoFileName);
    const canStoreVideo = videoAsset !== null && videoAsset.byteLength <= 25_000_000;
    const portraitKey = seedDoctorFileKey(id, "portrait.jpg");
    const qualificationKey = seedDoctorFileKey(id, "qualification.svg");
    const introVideoKey = seedDoctorFileKey(id, "intro-video.mp4");

    await doctorMaterialsKv.put(portraitKey, portraitImage.data);
    await doctorMaterialsKv.put(qualificationKey, qualificationSvg);
    if (canStoreVideo) {
      await doctorMaterialsKv.put(introVideoKey, videoAsset);
    } else if (videoAsset) {
      console.warn(`Skipping oversize video (${videoAsset.byteLength} bytes) for ${doctor.displayName}`);
    }

    fileRows.push(
      {
        id: `seed-doctor-file-${index + 1}-portrait`,
        doctorId: id,
        fileKey: portraitKey,
        fileName: `${slug(doctor.displayName)}-portrait.jpg`,
        mimeType: portraitImage.mimeType,
        fileKind: "portrait" as const,
        caption: `Professional portrait photo for ${doctor.displayName}`,
        size: portraitImage.size,
        width: null,
        height: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: `seed-doctor-file-${index + 1}-qualification`,
        doctorId: id,
        fileKey: qualificationKey,
        fileName: `${slug(doctor.displayName)}-qualification.svg`,
        mimeType: "image/svg+xml",
        fileKind: "qualification" as const,
        caption: `${doctor.licenseNumber} qualification summary and practice credentials`,
        size: byteSize(qualificationSvg),
        width: 900,
        height: 680,
        createdAt: now,
        updatedAt: now,
      }
    );

    if (canStoreVideo) {
      fileRows.push({
        id: `seed-doctor-file-${index + 1}-intro-video`,
        doctorId: id,
        fileKey: introVideoKey,
        fileName: `${slug(doctor.displayName)}-intro-video.mp4`,
        mimeType: "video/mp4",
        fileKind: "intro_video" as const,
        caption: `Introductory mental health education video: ${videoSpec?.title ?? "Doctor introduction"}`,
        size: videoAsset.byteLength,
        width: null,
        height: null,
        createdAt: now,
        updatedAt: now,
      });

      hubRows.push({
        id: `seed-hub-material-${index + 1}`,
        doctorId: id,
        channelId: `seed-hub-channel-${index + 1}`,
        title: videoSpec?.title ?? "Mental Health Education",
        description: videoSpec?.description ?? null,
        fileKey: introVideoKey,
        fileType: "video" as const,
        fileName: `${slug(doctor.displayName)}-intro-video.mp4`,
        mimeType: "video/mp4",
        size: videoAsset.byteLength,
        durationSeconds: videoSpec?.durationSeconds ?? null,
        visibility: "public" as const,
        status: "ready" as const,
        tags: JSON.stringify(videoSpec?.tags ?? []),
        isIndividual: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return { doctorFileRows: fileRows, hubMaterialRows: hubRows };
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

function seedDoctorFileKey(doctorIdValue: string, fileName: string) {
  return `doctor-files/${doctorIdValue}/seed-${fileName}`;
}

async function fetchPortraitImage(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch seed portrait: ${url}`);
  }

  const data = await response.arrayBuffer();
  return {
    data,
    mimeType: response.headers.get("content-type") ?? "image/jpeg",
    size: data.byteLength,
  };
}

async function readSeedAsset(
  readAsset: ReadAsset,
  doctorMaterialsKv: KVNamespace,
  filename: string
) {
  const kvAsset = await doctorMaterialsKv
    .get(`seed-asset-video-${filename}`, "arrayBuffer")
    .catch(() => null);
  if (kvAsset) return kvAsset;

  const boundAsset = await readAsset(filename);
  if (boundAsset) return boundAsset;

  try {
    const { readFile } = await import("node:fs/promises");
    const { dirname, join } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const buffer = await readFile(
      join(dirname(fileURLToPath(import.meta.url)), "../seed-assets", filename)
    );
    return buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;
  } catch {
    return null;
  }
}

function byteSize(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildQualificationSvg(doctor: DoctorSeed, accent: string) {
  const safeName = escapeXml(doctor.displayName);
  const safeHeadline = escapeXml(doctor.headline);
  const safeLicense = escapeXml(doctor.licenseNumber);
  const safeSpecialties = escapeXml(doctor.specialties.join(" • "));
  const safeLanguages = escapeXml(doctor.languages.join(" • "));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="680" viewBox="0 0 900 680">
  <rect width="900" height="680" rx="36" fill="#f8fafc"/>
  <rect x="42" y="42" width="816" height="596" rx="28" fill="#ffffff" stroke="${accent}" stroke-width="4"/>
  <circle cx="116" cy="118" r="38" fill="${accent}" opacity="0.14"/>
  <path d="M96 118l14 14 28-34" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="172" y="104" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#0f172a">Verified Professional Qualification</text>
  <text x="172" y="136" font-family="Inter, Arial, sans-serif" font-size="16" fill="#475569">Seeded credential file for Suwa doctor profile testing</text>
  <text x="80" y="230" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="800" fill="#0f172a">${safeName}</text>
  <text x="80" y="276" font-family="Inter, Arial, sans-serif" font-size="20" fill="#334155">${safeHeadline}</text>
  <line x1="80" x2="820" y1="330" y2="330" stroke="#e2e8f0" stroke-width="2"/>
  <text x="80" y="390" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="#0f172a">License</text>
  <text x="240" y="390" font-family="Inter, Arial, sans-serif" font-size="18" fill="#334155">${safeLicense}</text>
  <text x="80" y="442" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="#0f172a">Specialties</text>
  <text x="240" y="442" font-family="Inter, Arial, sans-serif" font-size="18" fill="#334155">${safeSpecialties}</text>
  <text x="80" y="494" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="#0f172a">Languages</text>
  <text x="240" y="494" font-family="Inter, Arial, sans-serif" font-size="18" fill="#334155">${safeLanguages}</text>
  <text x="80" y="546" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="#0f172a">Practice Area</text>
  <text x="240" y="546" font-family="Inter, Arial, sans-serif" font-size="18" fill="#334155">Galle, Sri Lanka</text>
  <text x="80" y="600" font-family="Inter, Arial, sans-serif" font-size="14" fill="#64748b">Demo seed document. Fake professional data for application development only.</text>
</svg>`;
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
  const template = AFFILIATION_WINDOWS[index % AFFILIATION_WINDOWS.length] ?? [];
  const secondTemplate = AFFILIATION_WINDOWS[(index + 1) % AFFILIATION_WINDOWS.length] ?? [];
  return [...template, ...secondTemplate].map((window, windowIndex) => ({
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
