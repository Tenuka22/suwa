import { faker } from "@faker-js/faker";
import type { createDb } from "@suwa/db";
import {
  doctorHubChannels,
  doctorHubMaterials,
  doctorPlaylists,
  hubUploadSessions,
} from "@suwa/db";
import {
  CHANNEL_SPECS,
  MATERIAL_SPECS_AUDIO,
  MATERIAL_SPECS_VIDEO,
  type MaterialSpec,
  PLAYLIST_TITLES,
} from "../data-specs/content";
import { SAMPLE_THUMBNAIL_URL } from "../data-specs/portraits";

export interface HubSeedResult {
  channels: number;
  materials: number;
  playlists: number;
  uploads: number;
}

interface DoctorFilesStore {
  put: (key: string, data: ArrayBuffer) => Promise<void>;
}

async function downloadFile(url: string): Promise<ArrayBuffer | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      return null;
    }
    return resp.arrayBuffer();
  } catch {
    return null;
  }
}

export type ReadAssetFn = (filename: string) => Promise<ArrayBuffer | null>;

async function resolveFileBuffer(
  spec: MaterialSpec,
  isVideo: boolean,
  sampleVideoBuffer: ArrayBuffer | null,
  sampleAudioBuffer: ArrayBuffer | null,
  readAsset: ReadAssetFn | undefined
): Promise<ArrayBuffer | null> {
  if (spec.seedFile && readAsset) {
    const localBuf = await readAsset(spec.seedFile);
    if (localBuf) {
      return localBuf;
    }
  }
  return isVideo ? sampleVideoBuffer : sampleAudioBuffer;
}

async function resolveThumbnailBuffer(
  spec: MaterialSpec,
  sampleThumbnailBuffer: ArrayBuffer | null,
  readAsset: ReadAssetFn | undefined
): Promise<ArrayBuffer | null> {
  if (spec.sourceYouTubeId && readAsset) {
    const thumbBuf = await readAsset(`${spec.sourceYouTubeId}.jpg`);
    if (thumbBuf) {
      return thumbBuf;
    }
  }
  return sampleThumbnailBuffer;
}

export async function seedHub(
  db: ReturnType<typeof createDb>,
  doctorIds: string[],
  kv?: DoctorFilesStore,
  readAsset?: ReadAssetFn
): Promise<HubSeedResult> {
  if (doctorIds.length === 0) {
    return { channels: 0, materials: 0, playlists: 0, uploads: 0 };
  }

  await db.delete(doctorHubMaterials);
  await db.delete(doctorHubChannels);
  await db.delete(doctorPlaylists);
  await db.delete(hubUploadSessions);

  let channelCount = 0;
  let materialCount = 0;
  let playlistCount = 0;
  let uploadCount = 0;

  const sampleVideoBuffer = await downloadFile(
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
  );
  const sampleAudioBuffer = await downloadFile(
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  );
  const sampleThumbnailBuffer = await downloadFile(SAMPLE_THUMBNAIL_URL);

  for (const doctorId of doctorIds) {
    const now = new Date().toISOString();

    // Channels (1-2 per doctor)
    const numChannels = faker.number.int({ min: 1, max: 2 });
    const createdChannelIds: string[] = [];
    for (let i = 0; i < numChannels; i++) {
      const spec = CHANNEL_SPECS[(channelCount + i) % CHANNEL_SPECS.length]!;
      const channelId = crypto.randomUUID();
      const handle = `${spec.name.toLowerCase().replace(/\s+/g, "-")}-${doctorId.slice(0, 6)}`;
      await db.insert(doctorHubChannels).values({
        id: channelId,
        doctorId,
        name: spec.name,
        handle,
        description: spec.description,
        avatarKey: null,
        bannerKey: null,
        isDefault: i === 0,
        createdAt: now,
        updatedAt: now,
      });
      createdChannelIds.push(channelId);
      channelCount++;
    }

    // Playlists (1-2 per doctor)
    const numPlaylists = faker.number.int({ min: 1, max: 2 });
    const createdPlaylistIds: string[] = [];
    for (let i = 0; i < numPlaylists; i++) {
      const playlistId = crypto.randomUUID();
      await db.insert(doctorPlaylists).values({
        id: playlistId,
        doctorId,
        title: PLAYLIST_TITLES[(playlistCount + i) % PLAYLIST_TITLES.length]!,
        description: faker.lorem.sentence(),
        createdAt: now,
        updatedAt: now,
      });
      createdPlaylistIds.push(playlistId);
      playlistCount++;
    }

    // Materials (5-8 per doctor, mixing video + audio)
    const numMaterials = faker.number.int({ min: 5, max: 8 });
    const createdMaterialIds: string[] = [];
    const allVideoSpecs = [...MATERIAL_SPECS_VIDEO];
    const allAudioSpecs = [...MATERIAL_SPECS_AUDIO];

    for (let i = 0; i < numMaterials; i++) {
      const materialId = crypto.randomUUID();
      const isVideo = i < Math.ceil(numMaterials * 0.6);
      const allSpecs = isVideo ? allVideoSpecs : allAudioSpecs;
      const spec = allSpecs[materialCount % allSpecs.length]!;
      const channelId = faker.helpers.arrayElement(createdChannelIds);
      const fileKey = `hub-uploads/${doctorId}/${materialId}/${isVideo ? "video.mp4" : "audio.mp3"}`;
      const thumbnailKey = `hub-uploads/${doctorId}/${materialId}/thumbnail.jpg`;

      // Resolve file content: prefer seeded local file, fall back to sample
      const fileBuf = await resolveFileBuffer(
        spec,
        isVideo,
        sampleVideoBuffer,
        sampleAudioBuffer,
        readAsset
      );
      const thumbBuf = await resolveThumbnailBuffer(
        spec,
        sampleThumbnailBuffer,
        readAsset
      );

      if (kv) {
        if (fileBuf) {
          await kv.put(fileKey, fileBuf).catch(() => {});
        }
        if (thumbBuf) {
          await kv.put(thumbnailKey, thumbBuf).catch(() => {});
        }
      }

      const visibility = faker.helpers.arrayElement([
        "public",
        "public",
        "public",
        "unlisted",
        "private",
      ] as const);

      const playlistId = faker.datatype.boolean(0.4)
        ? faker.helpers.arrayElement(createdPlaylistIds)
        : null;

      await db.insert(doctorHubMaterials).values({
        id: materialId,
        doctorId,
        channelId,
        title: spec.title,
        description: spec.description,
        content: faker.lorem.paragraph(),
        fileKey,
        thumbnailKey,
        fileType: isVideo ? "video" : "audio",
        fileName: isVideo ? "video.mp4" : "audio.mp3",
        mimeType: spec.mimeType,
        size:
          fileBuf?.byteLength ??
          faker.number.int({ min: 1_000_000, max: 50_000_000 }),
        durationSeconds: spec.durationSeconds,
        visibility,
        status: "ready",
        tags: JSON.stringify(spec.tags),
        metadata: null,
        playlistId,
        isIndividual: faker.datatype.boolean(0.7),
        createdAt: now,
        updatedAt: now,
      });
      createdMaterialIds.push(materialId);
      materialCount++;

      // Upload session record
      const chunkSize = 1_048_576;
      const fileSize =
        fileBuf?.byteLength ??
        faker.number.int({ min: 1_000_000, max: 50_000_000 });
      const totalChunks = Math.ceil(fileSize / chunkSize);

      await db.insert(hubUploadSessions).values({
        id: crypto.randomUUID(),
        doctorId,
        materialId,
        fileName: isVideo ? "video.mp4" : "audio.mp3",
        mimeType: spec.mimeType,
        totalSize: fileSize,
        chunkSize,
        totalChunks,
        uploadedChunks: JSON.stringify(
          Array.from({ length: totalChunks }, (_, i) => i)
        ),
        status: "completed",
        fileKey,
        createdAt: now,
        updatedAt: now,
      });
      uploadCount++;
    }
  }

  return {
    channels: channelCount,
    materials: materialCount,
    playlists: playlistCount,
    uploads: uploadCount,
  };
}
