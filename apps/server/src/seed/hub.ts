import { faker } from "@faker-js/faker";
import type { createDb } from "@zen-doc/db";
import {
  doctorHubChannels,
  doctorHubMaterials,
  doctorPlaylists,
} from "@zen-doc/db";

const CHANNEL_NAMES = [
  "Mental Wellness",
  "Stress Management",
  "Sleep Health",
  "Mindfulness & Meditation",
  "Anxiety Relief",
];

const CHANNEL_DESCRIPTIONS = [
  "Evidence-based strategies for maintaining mental wellness and emotional balance.",
  "Practical techniques to identify, manage, and reduce stress in daily life.",
  "Tips and tools for improving sleep quality and establishing healthy sleep patterns.",
  "Guided meditation sessions and mindfulness practices for inner peace.",
  "Cognitive-behavioral approaches to understanding and managing anxiety.",
];

const MATERIAL_TITLES_VIDEO = [
  "Introduction to Cognitive Behavioral Therapy",
  "Breathing Techniques for Anxiety Relief",
  "Understanding the Stress Response",
  "Mindful Morning Routine",
  "Sleep Hygiene: Best Practices",
  "Progressive Muscle Relaxation Guide",
  "Managing Panic Attacks",
  "Building Emotional Resilience",
  "The Power of Gratitude Journaling",
  "Setting Healthy Boundaries",
];

const MATERIAL_TITLES_AUDIO = [
  "Guided Body Scan Meditation",
  "Calming Ocean Waves (Background)",
  "5-Minute Breathing Exercise",
  "Evening Wind-Down Meditation",
  "Focus and Concentration Soundscape",
  "Deep Sleep Hypnosis Session",
  "Morning Affirmations",
  "Nature Sounds for Relaxation",
];

const SAMPLE_VIDEO_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
const SAMPLE_AUDIO_URL =
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
const SAMPLE_THUMBNAIL_URL = "https://picsum.photos/640/360";

async function downloadFile(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  return response.arrayBuffer();
}

export async function seedHub(
  db: ReturnType<typeof createDb>,
  doctorIds: string[],
  kv?: KVNamespace
) {
  if (doctorIds.length === 0) {
    return { channels: 0, materials: 0, playlists: 0 };
  }

  // Remove old seeded data so re-seeding fixes any bad timestamps
  await db.delete(doctorHubMaterials);
  await db.delete(doctorHubChannels);
  await db.delete(doctorPlaylists);

  let channelCount = 0;
  let materialCount = 0;
  let playlistCount = 0;

  let sampleVideoBuffer: ArrayBuffer | null = null;
  let sampleAudioBuffer: ArrayBuffer | null = null;
  let sampleThumbnailBuffer: ArrayBuffer | null = null;

  if (kv) {
    try {
      const existing = await kv.get("seed:sample-video", "arrayBuffer");
      if (existing) {
        sampleVideoBuffer = existing;
        sampleAudioBuffer = await kv.get("seed:sample-audio", "arrayBuffer");
        sampleThumbnailBuffer = await kv.get(
          "seed:sample-thumbnail",
          "arrayBuffer"
        );
      }
    } catch {
      // Cache miss, will download fresh
    }
  }

  if (!sampleVideoBuffer) {
    try {
      sampleVideoBuffer = await downloadFile(SAMPLE_VIDEO_URL);
      sampleAudioBuffer = await downloadFile(SAMPLE_AUDIO_URL);
      sampleThumbnailBuffer = await downloadFile(SAMPLE_THUMBNAIL_URL);
      if (kv) {
        await kv.put("seed:sample-video", sampleVideoBuffer);
        await kv.put("seed:sample-audio", sampleAudioBuffer);
        await kv.put("seed:sample-thumbnail", sampleThumbnailBuffer);
      }
    } catch {
      // If downloads fail, continue without file content
    }
  }

  for (const doctorId of doctorIds) {
    const channelCountForDoctor = faker.number.int({ min: 1, max: 3 });
    const createdChannelIds: string[] = [];

    for (let i = 0; i < channelCountForDoctor; i++) {
      const channelId = crypto.randomUUID();
      const nameIndex = (channelCount + i) % CHANNEL_NAMES.length;
      const name = CHANNEL_NAMES[nameIndex] ?? "General";
      const handle = `${name.toLowerCase().replace(/\s+/g, "-")}-${doctorId.slice(0, 6)}`;

      const channelDate = faker.date.recent({ days: 60 }).toISOString();
      await db.insert(doctorHubChannels).values({
        id: channelId,
        doctorId,
        name,
        handle,
        description: CHANNEL_DESCRIPTIONS[nameIndex] ?? null,
        avatarKey: null,
        bannerKey: null,
        isDefault: i === 0,
        createdAt: channelDate,
        updatedAt: channelDate,
      });
      createdChannelIds.push(channelId);
      channelCount++;
    }

    const playlistCountForDoctor = faker.number.int({ min: 1, max: 2 });
    const createdPlaylistIds: string[] = [];
    for (let i = 0; i < playlistCountForDoctor; i++) {
      const playlistId = crypto.randomUUID();
      const title = faker.helpers.arrayElement([
        "Beginner Series",
        "Advanced Techniques",
        "Quick Sessions",
        "Deep Dives",
        "Patient Favorites",
      ]);

      const playlistDate = faker.date.recent({ days: 60 }).toISOString();
      await db.insert(doctorPlaylists).values({
        id: playlistId,
        doctorId,
        title,
        description: faker.lorem.sentence(),
        createdAt: playlistDate,
        updatedAt: playlistDate,
      });
      createdPlaylistIds.push(playlistId);
      playlistCount++;
    }

    const materialCountForDoctor = faker.number.int({ min: 3, max: 6 });
    for (let i = 0; i < materialCountForDoctor; i++) {
      const materialId = crypto.randomUUID();
      const isVideo = faker.datatype.boolean(0.6);
      const titleIdx = materialCount % MATERIAL_TITLES_VIDEO.length;
      const title = isVideo
        ? (MATERIAL_TITLES_VIDEO[titleIdx] ?? "Untitled Video")
        : (MATERIAL_TITLES_AUDIO[materialCount % MATERIAL_TITLES_AUDIO.length] ?? "Untitled Audio");
      const channelId = faker.helpers.arrayElement(createdChannelIds);
      const fileKey = `hub-uploads/${doctorId}/${materialId}/${isVideo ? "video.mp4" : "audio.mp3"}`;
      const thumbnailKey = `hub-uploads/${doctorId}/${materialId}/thumbnail.jpg`;
      const durationSeconds = faker.number.int({
        min: 120,
        max: isVideo ? 1800 : 3600,
      });
      const fileSize =
        isVideo && sampleVideoBuffer
          ? sampleVideoBuffer.byteLength
          : !isVideo && sampleAudioBuffer
            ? sampleAudioBuffer.byteLength
            : faker.number.int({ min: 1_000_000, max: 50_000_000 });
      const mimeType = isVideo ? "video/mp4" : "audio/mpeg";

      // Store in KV if available
      if (kv) {
        const fileContent = isVideo ? sampleVideoBuffer : sampleAudioBuffer;
        if (fileContent) {
          try {
            await kv.put(fileKey, fileContent);
            if (sampleThumbnailBuffer) {
              await kv.put(thumbnailKey, sampleThumbnailBuffer);
            }
          } catch {
            // KV write failed, continue
          }
        }
      }

      const materialDate = faker.date.recent({ days: 60 }).toISOString();
      await db.insert(doctorHubMaterials).values({
        id: materialId,
        doctorId,
        channelId,
        title,
        description: faker.lorem.sentence(),
        content: faker.lorem.paragraph(),
        fileKey,
        thumbnailKey,
        fileType: isVideo ? "video" : "audio",
        fileName: isVideo ? "video.mp4" : "audio.mp3",
        mimeType,
        size: fileSize,
        durationSeconds,
        visibility: faker.helpers.arrayElement([
          "public",
          "unlisted",
          "private",
        ] as const),
        status: "ready",
        tags: JSON.stringify(
          faker.helpers.arrayElements(
            [
              "meditation",
              "therapy",
              "wellness",
              "cbt",
              "mindfulness",
              "relaxation",
              "sleep",
              "anxiety",
              "stress",
              "mental-health",
            ],
            faker.number.int({ min: 2, max: 5 })
          )
        ),
        isIndividual: faker.datatype.boolean(0.7),
        playlistId: faker.datatype.boolean(0.4)
          ? faker.helpers.arrayElement(createdPlaylistIds)
          : null,
        createdAt: materialDate,
        updatedAt: materialDate,
      });
      materialCount++;
    }
  }

  return {
    channels: channelCount,
    materials: materialCount,
    playlists: playlistCount,
  };
}
