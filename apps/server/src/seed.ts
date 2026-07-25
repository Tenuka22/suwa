import { createAuth } from "@suwa/auth";
import {
  clinics,
  conversations,
  doctorCredits,
  doctorEducationEntries,
  doctorFiles,
  doctorHospitalAffiliations,
  doctorHubChannels,
  doctorHubMaterials,
  doctorPlans,
  doctorPlaylists,
  doctorProfiles,
  doctorSessions,
  doctorWeeklyAvailability,
  messages,
  patientMoods,
  patientProfiles,
  tenants,
  users,
} from "@suwa/db";
import { stringifyJsonApproachSteps, stringifyJsonStringArray } from "@suwa/db";
import { eq } from "drizzle-orm";
import { BASIC_PLAN_DURATION_MINUTES, BASIC_PLAN_FEATURES, BASIC_PLAN_NAME } from "@suwa/pricing";
import { CHANNEL_SPECS, MATERIAL_SPECS_AUDIO, MATERIAL_SPECS_VIDEO, PLAYLIST_TITLES } from "./data-specs/content";
import { buildHospitalSpecs } from "./data-specs/hospitals";
import { DOCTOR_PROFILE_SPECS, PATIENT_PROFILE_SPECS, buildApproachSteps } from "./data-specs/profiles";
import { PATIENT_PORTRAIT_SPECS, PORTRAIT_SPECS } from "./data-specs/portraits";
import { APPROACH_TEMPLATES, APPROACH_STEP_TEMPLATES, QUALIFICATION_SPECS, SECONDARY_QUALIFICATIONS } from "./data-specs/qualifications";
import placesData from "@apps/map-scraper/places_data.json" with { type: "json" };

interface SeedResult {
  admin: { id: string; email: string };
  doctors: { id: string; email: string; name: string }[];
  patients: { id: string; email: string; name: string }[];
  tenants: { id: string; name: string }[];
  channels: { id: string; name: string }[];
  materials: { id: string; title: string }[];
  playlists: { id: string; title: string }[];
  sessions: { id: string }[];
  summary: string;
}

const PORTRAIT_IMAGE_HOST = "https://randomuser.me";

function portraitImageUrl(gender: string, index: number): string {
  const g = gender === "men" ? "men" : "women";
  return `${PORTRAIT_IMAGE_HOST}/api/portraits/${g}/${index % 100}.jpg`;
}

async function fetchPortraitBytes(gender: string, index: number): Promise<Uint8Array | null> {
  try {
    const res = await fetch(portraitImageUrl(gender, index));
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function seedDatabase(context: { db: any; FILE_STORAGE_BUCKET?: any }): Promise<SeedResult> {
  const { db, FILE_STORAGE_BUCKET } = context;
  const now = new Date().toISOString();

  const [existingAdmin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "admin@gmail.com"))
    .limit(1);
  if (existingAdmin) {
    throw new Error("Database already seeded. Drop tables or use a fresh DB first.");
  }

  const auth = createAuth();

  const { user: adminUser } = await auth.api.createUser({
    body: {
      name: "Admin",
      email: "admin@gmail.com",
      password: "12345678",
      role: "admin",
    },
  });

  const doctorUsers: { id: string; email: string; name: string; profileIndex: number }[] = [];
  for (let i = 0; i < PORTRAIT_SPECS.length; i++) {
    const p = PORTRAIT_SPECS[i];
    const { user } = await auth.api.createUser({
      body: {
        name: `${p.firstName} ${p.lastName}`,
        email: p.email,
        password: "12345678",
        role: "doctor",
      },
    });
    doctorUsers.push({ id: user.id, email: user.email, name: `${p.firstName} ${p.lastName}`, profileIndex: p.doctorIndex });
  }

  const patientUsers: { id: string; email: string; name: string }[] = [];
  for (const p of PATIENT_PORTRAIT_SPECS) {
    const { user } = await auth.api.createUser({
      body: {
        name: `${p.firstName} ${p.lastName}`,
        email: p.email,
        password: "12345678",
        role: "user",
      },
    });
    patientUsers.push({ id: user.id, email: user.email, name: `${p.firstName} ${p.lastName}` });
  }

  for (let i = 0; i < doctorUsers.length; i++) {
    const du = doctorUsers[i];
    const spec = DOCTOR_PROFILE_SPECS[du.profileIndex % DOCTOR_PROFILE_SPECS.length];
    const portrait = PORTRAIT_SPECS.find(p => p.email === du.email);
    const approachSteps = APPROACH_STEP_TEMPLATES[i % APPROACH_STEP_TEMPLATES.length];
    const approach = APPROACH_TEMPLATES[i % APPROACH_TEMPLATES.length];

    await db.insert(doctorProfiles).values({
      userId: du.id,
      displayName: spec.displayName,
      headline: spec.headline,
      bio: spec.bio,
      licenseNumber: `SLMC-${String(10000 + i).slice(1)}`,
      location: spec.location,
      placeName: spec.placeName,
      placeAddress: spec.placeAddress,
      placeDescription: spec.placeDescription,
      experienceStartYear: spec.experienceStartYear,
      specialties: stringifyJsonStringArray(spec.specialties),
      languages: stringifyJsonStringArray(spec.languages),
      consultationModes: stringifyJsonStringArray(spec.consultationModes),
      focusAreas: stringifyJsonStringArray(spec.focusAreas),
      approachSteps: stringifyJsonApproachSteps(buildApproachSteps(approachSteps)),
      approach,
      education: "",
      permanent: true,
      createdAt: now,
      updatedAt: now,
    });

    const primaryQual = QUALIFICATION_SPECS[i % QUALIFICATION_SPECS.length];
    const secondaryQual = SECONDARY_QUALIFICATIONS[i % SECONDARY_QUALIFICATIONS.length];
    await db.insert(doctorEducationEntries).values({
      id: crypto.randomUUID(),
      doctorId: du.id,
      institution: primaryQual.institution,
      degree: `${primaryQual.abbreviation} in ${primaryQual.field}`,
      year: primaryQual.yearRange[1],
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(doctorEducationEntries).values({
      id: crypto.randomUUID(),
      doctorId: du.id,
      institution: secondaryQual.institution,
      degree: `${secondaryQual.abbreviation} in ${secondaryQual.field}`,
      year: secondaryQual.yearRange[1],
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(doctorPlans).values({
      id: crypto.randomUUID(),
      doctorId: du.id,
      name: BASIC_PLAN_NAME,
      description: "Standard consultation session",
      creditCost: 0,
      priceCents: 1500,
      durationMinutes: BASIC_PLAN_DURATION_MINUTES,
      features: JSON.stringify(BASIC_PLAN_FEATURES),
      isActive: true,
      isDefault: true,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    });

    for (let day = 1; day <= 5; day++) {
      await db.insert(doctorWeeklyAvailability).values({
        id: crypto.randomUUID(),
        doctorId: du.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    await db.insert(doctorCredits).values({
      doctorId: du.id,
      balanceCents: 0,
      totalEarnedCents: 0,
      totalCashedOutCents: 0,
      createdAt: now,
      updatedAt: now,
    });

    if (portrait && FILE_STORAGE_BUCKET) {
      const fileId = crypto.randomUUID();
      const fileKey = `portraits/${du.id}`;

      const fetched = await fetchPortraitBytes(portrait.gender, i);
      const imageBytes = fetched ?? Uint8Array.from(
        atob(portrait.url.replace(/^data:image\/svg\+xml;base64,/, "")),
        (c) => c.charCodeAt(0),
      );
      const mimeType = fetched ? "image/jpeg" : "image/svg+xml";

      await FILE_STORAGE_BUCKET.put(fileKey, imageBytes, {
        httpMetadata: { contentType: mimeType },
      });

      await db.insert(doctorFiles).values({
        id: fileId,
        doctorId: du.id,
        fileKey,
        fileName: `${portrait.firstName.toLowerCase()}_${portrait.lastName.toLowerCase()}.${fetched ? "jpg" : "svg"}`,
        mimeType,
        fileKind: "portrait",
        caption: `${portrait.firstName} ${portrait.lastName}`,
        size: imageBytes.length,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  for (let i = 0; i < patientUsers.length; i++) {
    const pu = patientUsers[i];
    const spec = PATIENT_PROFILE_SPECS[i];

    await db.insert(patientProfiles).values({
      userId: pu.id,
      alias: spec.alias,
      ageCategory: "adult",
      profession: ["student", "teacher", "employed", "self_employed", "healthcare_worker"][i] as any,
      isOnboardingComplete: true,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(patientMoods).values({
      userId: pu.id,
      mood: ["happy", "idle", "sad", "yawn", "sleep"][i] as any,
      intensity: [4, 3, 2, 3, 5][i],
      createdAt: now,
      updatedAt: now,
    });
  }


  const hospitalSpecs = buildHospitalSpecs(placesData);
  const tenantIds: string[] = [];

  for (const spec of hospitalSpecs) {
    const tenantId = crypto.randomUUID();
    tenantIds.push(tenantId);

    await db.insert(tenants).values({
      id: tenantId,
      name: spec.name,
      type: spec.type,
      address: spec.address,
      contactInfo: JSON.stringify({ phone: spec.phone, website: spec.website }),
      status: "ACTIVE",
      services: JSON.stringify(spec.services),
      latitude: String(spec.latitude),
      longitude: String(spec.longitude),
      phone: spec.phone,
      website: spec.website,
      createdBy: adminUser.id,
      createdAt: now,
      updatedAt: now,
    });

    for (const clinicSpec of spec.clinics) {
      await db.insert(clinics).values({
        id: crypto.randomUUID(),
        tenantId,
        name: clinicSpec.name,
        specialization: clinicSpec.specialization,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  for (let i = 0; i < doctorUsers.length; i++) {
    const tenantId = tenantIds[i % tenantIds.length];
    await db.insert(doctorHospitalAffiliations).values({
      id: crypto.randomUUID(),
      doctorId: doctorUsers[i].id,
      tenantId,
      status: "ACTIVE",
      availabilityWindows: JSON.stringify([
        { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
        { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
        { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" },
        { dayOfWeek: 5, startTime: "09:00", endTime: "17:00" },
      ]),
      createdAt: now,
      updatedAt: now,
    });
  }

  const channelIds: string[] = [];
  for (const spec of CHANNEL_SPECS) {
    const channelId = crypto.randomUUID();
    channelIds.push(channelId);
    const doctorId = doctorUsers[channelIds.length % doctorUsers.length].id;

    await db.insert(doctorHubChannels).values({
      id: channelId,
      doctorId,
      name: spec.name,
      handle: spec.name.toLowerCase().replace(/\s+/g, "-"),
      description: spec.description,
      isDefault: channelIds.length === 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  const materialIds: string[] = [];
  const allMaterials = [...MATERIAL_SPECS_VIDEO, ...MATERIAL_SPECS_AUDIO];

  for (let i = 0; i < allMaterials.length; i++) {
    const spec = allMaterials[i];
    const materialId = crypto.randomUUID();
    materialIds.push(materialId);
    const doctorId = doctorUsers[i % doctorUsers.length].id;
    const channelId = channelIds[i % channelIds.length];

    await db.insert(doctorHubMaterials).values({
      id: materialId,
      doctorId,
      channelId,
      title: spec.title,
      description: spec.description,
      fileType: spec.fileType,
      mimeType: spec.mimeType,
      durationSeconds: spec.durationSeconds,
      tags: JSON.stringify(spec.tags),
      visibility: "public",
      status: "ready",
      isIndividual: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  const playlistIds: string[] = [];
  for (const title of PLAYLIST_TITLES) {
    const playlistId = crypto.randomUUID();
    playlistIds.push(playlistId);
    const doctorId = doctorUsers[playlistIds.length % doctorUsers.length].id;

    await db.insert(doctorPlaylists).values({
      id: playlistId,
      doctorId,
      title,
      description: `A curated collection of ${title.toLowerCase()} content`,
      createdAt: now,
      updatedAt: now,
    });
  }

  const sessionIds: string[] = [];
  for (let i = 0; i < 3; i++) {
    const sessionId = crypto.randomUUID();
    sessionIds.push(sessionId);
    const doctorId = doctorUsers[i % doctorUsers.length].id;
    const patientId = patientUsers[i % patientUsers.length].id;
    const startAt = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000);
    const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);

    await db.insert(doctorSessions).values({
      id: sessionId,
      doctorId,
      patientId,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      status: i === 0 ? "approved" : i === 1 ? "attended" : "requested",
      creditCost: 1,
      amountCents: 1500,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (let i = 0; i < 3; i++) {
    const patientId = patientUsers[i % patientUsers.length].id;
    const conversationId = crypto.randomUUID();

    await db.insert(conversations).values({
      id: conversationId,
      userId: patientId,
      title: ["Feeling anxious about work", "Sleep improvement tips", "Stress management"][i],
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(messages).values({
      id: crypto.randomUUID(),
      conversationId,
      userId: patientId,
      role: "user",
      content: [
        "I've been feeling really anxious about my upcoming presentation at work. Any tips?",
        "I've been having trouble sleeping lately. What can I do?",
        "I'm feeling overwhelmed with my workload. How can I manage stress better?",
      ][i],
      createdAt: now,
    });

    await db.insert(messages).values({
      id: crypto.randomUUID(),
      conversationId,
      userId: patientId,
      role: "assistant",
      content: [
        "It's completely normal to feel anxious before a big presentation. Try breaking your preparation into small, manageable steps. Practice deep breathing exercises - inhale for 4 counts, hold for 4, exhale for 4. Remember that some nervousness can actually enhance your performance!",
        "Good sleep starts with good habits. Try setting a consistent bedtime, avoiding screens 30 minutes before sleep, and keeping your bedroom cool and dark. A calming bedtime routine signals your body that it's time to wind down.",
        "Stress often comes from feeling overwhelmed. Try the 'Pomodoro Technique' - work in focused 25-minute blocks with 5-minute breaks. Also, make sure to set boundaries and say no to non-essential tasks. Your well-being comes first.",
      ][i],
      createdAt: now,
    });
  }

  return {
    admin: { id: adminUser.id, email: adminUser.email },
    doctors: doctorUsers.map(du => ({ id: du.id, email: du.email, name: du.name })),
    patients: patientUsers,
    tenants: tenantIds.map((id, i) => ({ id, name: hospitalSpecs[i]?.name ?? `Tenant ${i}` })),
    channels: channelIds.map((id, i) => ({ id, name: CHANNEL_SPECS[i]?.name ?? `Channel ${i}` })),
    materials: materialIds.map((id, i) => ({ id, title: allMaterials[i]?.title ?? `Material ${i}` })),
    playlists: playlistIds.map((id, i) => ({ id, title: PLAYLIST_TITLES[i] ?? `Playlist ${i}` })),
    sessions: sessionIds.map(id => ({ id })),
    summary: `Seeded ${doctorUsers.length} doctors, ${patientUsers.length} patients, ${tenantIds.length} hospitals, ${channelIds.length} channels, ${materialIds.length} materials, ${playlistIds.length} playlists, ${sessionIds.length} sessions`,
  };
}
