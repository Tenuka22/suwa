const VIDEO_EXTENSIONS = [
  ".mp4",
  ".m4v",
  ".mov",
  ".webm",
  ".ogv",
  ".avi",
  ".mkv",
  ".mpeg",
  ".mpg",
];

const AUDIO_EXTENSIONS = [
  ".mp3",
  ".m4a",
  ".aac",
  ".wav",
  ".ogg",
  ".oga",
  ".opus",
  ".flac",
];

export interface VideoThumbnail {
  dataBase64: string;
  mimeType: string;
}

function hasKnownExtension(file: File, extensions: string[]): boolean {
  const lowerName = file.name.toLowerCase();
  return extensions.some((extension) => lowerName.endsWith(extension));
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/") || hasKnownExtension(file, VIDEO_EXTENSIONS);
}

export function isAudioFile(file: File): boolean {
  return file.type.startsWith("audio/") || hasKnownExtension(file, AUDIO_EXTENSIONS);
}

export async function createVideoThumbnail(
  file: File
): Promise<VideoThumbnail | null> {
  if (!isVideoFile(file)) {
    return null;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    await waitForEvent(video, "loadedmetadata");

    if (!video.videoWidth || !video.videoHeight) {
      return null;
    }

    const captureTime = getCaptureTime(video.duration);
    if (captureTime > 0) {
      await seekVideo(video, captureTime);
    }

    const canvas = document.createElement("canvas");
    const maxDimension = 640;
    const scale = Math.min(
      1,
      maxDimension / Math.max(video.videoWidth, video.videoHeight)
    );
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));

    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.84);
    const base64 = dataUrl.split(",")[1];

    if (!base64) {
      return null;
    }

    return {
      dataBase64: base64,
      mimeType: "image/jpeg",
    };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function getCaptureTime(duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }

  if (duration < 1) {
    return duration / 2;
  }

  return Math.min(1, duration - 0.1);
}

function waitForEvent(target: EventTarget, eventName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    function handleEvent() {
      cleanup();
      resolve();
    }

    function handleError() {
      cleanup();
      reject(new Error(`Failed to load video for ${eventName}`));
    }

    function cleanup() {
      target.removeEventListener(eventName, handleEvent);
      target.removeEventListener("error", handleError);
    }

    target.addEventListener(eventName, handleEvent, { once: true });
    target.addEventListener("error", handleError, { once: true });
  });
}

async function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  if (Math.abs(video.currentTime - time) < 0.001) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    function handleSeeked() {
      cleanup();
      resolve();
    }

    function handleError() {
      cleanup();
      reject(new Error("Failed to seek video thumbnail frame"));
    }

    function cleanup() {
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleError);
    }

    video.addEventListener("seeked", handleSeeked, { once: true });
    video.addEventListener("error", handleError, { once: true });
    video.currentTime = time;
  });
}
