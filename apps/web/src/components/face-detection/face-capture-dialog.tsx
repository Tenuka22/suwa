"use client";

import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";
import { Button } from "@suwa/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@suwa/ui/components/dialog";
import { Progress } from "@suwa/ui/components/progress";
import { CameraIcon, CheckCircle2Icon, Loader2Icon, ScanFaceIcon, ShieldAlertIcon, XCircleIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export type FaceCaptureStatus =
  | "idle" | "loading-model" | "camera-permission" | "detecting"
  | "detected" | "capturing" | "saving" | "success" | "error";

interface FaceCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFaceCaptured: (embedding: number[], snapshot: string, videoBase64?: string) => Promise<void>;
}

const KEY_LANDMARK_INDICES: number[] = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
  378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
  162, 21, 54, 103, 67, 109, 33, 7, 163, 144, 145, 153, 154, 155, 133, 173,
  157, 158, 159, 160, 161, 246, 362, 382, 381, 380, 374, 373, 390, 249, 263,
  466, 388, 387, 386, 385, 384, 398, 61, 146, 91, 181, 84, 17, 314, 405,
  321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 1, 2, 98, 327, 49,
  279, 278, 195, 197, 5, 4, 237, 456, 454, 46, 53, 52, 65, 55, 70, 63, 105,
  66, 107, 276, 283, 282, 295, 285, 300, 293, 334, 296, 336,
];

function computeEmbedding(landmarks: { x: number; y: number; z: number }[]): number[] {
  const faceLandmarks = KEY_LANDMARK_INDICES
    .map((index) => landmarks[index])
    .filter((point): point is { x: number; y: number; z: number } => Boolean(point));

  if (faceLandmarks.length === 0) return [];

  const cx = faceLandmarks.reduce((sum, point) => sum + point.x, 0) / faceLandmarks.length;
  const cy = faceLandmarks.reduce((sum, point) => sum + point.y, 0) / faceLandmarks.length;
  const cz = faceLandmarks.reduce((sum, point) => sum + point.z, 0) / faceLandmarks.length;

  const distances = faceLandmarks.map((point) =>
    Math.sqrt((point.x - cx) ** 2 + (point.y - cy) ** 2 + (point.z - cz) ** 2)
  );
  const scale = Math.max(...distances);

  if (scale < 0.001) return [];

  return faceLandmarks.flatMap((point) => [
    (point.x - cx) / scale,
    (point.y - cy) / scale,
    (point.z - cz) / scale,
  ]);
}

let landmarkerSingleton: FaceLandmarker | null = null;
let landmarkerLoading = false;
let landmarkerWaiters: Array<(lm: FaceLandmarker) => void> = [];

async function getLandmarker(): Promise<FaceLandmarker> {
  if (landmarkerSingleton) return landmarkerSingleton;
  if (landmarkerLoading) {
    return new Promise((resolve) => { landmarkerWaiters.push(resolve); });
  }
  landmarkerLoading = true;
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    const landmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "CPU",
      },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    });
    landmarkerSingleton = landmarker;
    for (const waiter of landmarkerWaiters) waiter(landmarker);
    landmarkerWaiters = [];
    return landmarker;
  } finally {
    landmarkerLoading = false;
  }
}

function captureSnapshot(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.85);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read video blob"));
    reader.readAsDataURL(blob);
  });
}

function recordClip(stream: MediaStream, durationMs: number): Promise<string | undefined> {
  if (typeof MediaRecorder === "undefined") {
    return Promise.resolve(undefined);
  }

  return new Promise((resolve) => {
    const chunks: BlobPart[] = [];
    const options = MediaRecorder.isTypeSupported("video/webm")
      ? { mimeType: "video/webm" }
      : undefined;
    const recorder = new MediaRecorder(stream, options);
    const timeout = window.setTimeout(() => {
      if (recorder.state !== "inactive") recorder.stop();
    }, durationMs);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => {
      window.clearTimeout(timeout);
      resolve(undefined);
    };
    recorder.onstop = () => {
      window.clearTimeout(timeout);
      if (chunks.length === 0) {
        resolve(undefined);
        return;
      }
      void blobToBase64(new Blob(chunks, { type: "video/webm" })).then(resolve, () => resolve(undefined));
    };
    recorder.start();
  });
}

function EmbeddingFingerprint({ embedding }: { embedding: number[] }) {
  const groups = useMemo(() => {
    const groupSize = 10;
    const g: number[] = [];
    for (let i = 0; i < embedding.length; i += groupSize) {
      const slice = embedding.slice(i, i + groupSize);
      g.push(slice.reduce((a, b) => a + b, 0) / slice.length);
    }
    return g;
  }, [embedding]);

  const min = Math.min(...groups);
  const max = Math.max(...groups);
  const range = max - min || 1;

  return (
    <div className="flex flex-wrap gap-0.5">
      {groups.map((value, i) => {
        const normalized = (value - min) / range;
        const r = Math.round(255 * (1 - normalized));
        const g = Math.round(255 * normalized);
        const b = Math.round(100 + 155 * (1 - Math.abs(normalized - 0.5) * 2));
        return (
          <div
            key={i}
            className="size-2.5 rounded-sm"
            style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
            title={`Group ${i + 1}: ${value.toFixed(4)}`}
          />
        );
      })}
    </div>
  );
}

export function FaceCaptureDialog({ open, onOpenChange, onFaceCaptured }: FaceCaptureDialogProps) {
  const [status, setStatus] = useState<FaceCaptureStatus>("idle");
  const [hasFace, setHasFace] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [loadStep, setLoadStep] = useState("");

  const [resultSnapshot, setResultSnapshot] = useState<string | null>(null);
  const [resultEmbedding, setResultEmbedding] = useState<number[] | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const captureAbortRef = useRef(false);
  const statusRef = useRef<FaceCaptureStatus>("idle");

  const showCaptureView = !["success"].includes(status);

  const updateStatus = useCallback((nextStatus: FaceCaptureStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

  const stopCamera = useCallback(() => {
    captureAbortRef.current = true;
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
  }, []);

  const startDetection = useCallback(async (landmarker: FaceLandmarker) => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    const detectFrame = () => {
      if (["capturing", "saving", "success", "idle"].includes(statusRef.current)) {
        return;
      }

      const results = landmarker.detectForVideo(video, performance.now());
      const faces = results.faceLandmarks;

      if (faces.length > 0) {
        const firstFace = faces[0];
        let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity;
        for (const point of firstFace) {
          if (point.x < minX) minX = point.x;
          if (point.x > maxX) maxX = point.x;
          if (point.y < minY) minY = point.y;
          if (point.y > maxY) maxY = point.y;
        }
        const faceArea = (maxX - minX) * (maxY - minY);
        const faceCenterX = (minX + maxX) / 2;
        const faceCenterY = (minY + maxY) / 2;
        const isCentered = faceCenterX > 0.25 && faceCenterX < 0.75 && faceCenterY > 0.2 && faceCenterY < 0.8;
        const isLargeEnough = faceArea > 0.05;

        setHasFace(isCentered && isLargeEnough);
        setConfidence(Math.min(1, faceArea * 4));
        updateStatus(isCentered && isLargeEnough ? "detected" : "detecting");
      } else {
        setHasFace(false);
        setConfidence(0);
        updateStatus("detecting");
      }
      animFrameRef.current = requestAnimationFrame(detectFrame);
    };
    detectFrame();
  }, [updateStatus]);

  const initCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setHasFace(false);
    setConfidence(0);

    try {
      setLoadStep("Starting camera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setLoadStep("Loading AI model...");
      const landmarker = await getLandmarker();
      landmarkerRef.current = landmarker;
      setLoadStep("");
      await startDetection(landmarker);
      updateStatus("detecting");
    } catch (error) {
      if (error instanceof Error && error.name === "NotAllowedError") {
        setCameraError("Camera access denied. Please allow camera access and try again.");
        updateStatus("camera-permission");
        return;
      }
      setCameraError(error instanceof Error ? error.message : "Unknown camera error occurred.");
      updateStatus("error");
    }
  }, [startDetection, stopCamera, updateStatus]);

  const captureAndSave = useCallback(async () => {
    const landmarker = landmarkerRef.current;
    const video = videoRef.current;
    if (!landmarker || !video) return;

    captureAbortRef.current = false;
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    updateStatus("capturing");
    setCaptureProgress(0);

    try {
      const embeddings: number[][] = [];
      const clipDuration = 3000;
      const frameInterval = 100;
      const totalFrames = clipDuration / frameInterval;
      const captureStart = performance.now();
      const videoBase64Promise = streamRef.current
        ? recordClip(streamRef.current, clipDuration)
        : Promise.resolve(undefined);

      for (let i = 0; i < totalFrames; i++) {
        if (captureAbortRef.current) {
          return;
        }

        const targetTime = captureStart + i * frameInterval;
        const waitTime = targetTime - performance.now();
        if (waitTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }

        if (captureAbortRef.current) {
          return;
        }

        const results = landmarker.detectForVideo(video, performance.now());
        if (results.faceLandmarks.length > 0) {
          const embedding = computeEmbedding(results.faceLandmarks[0]);
          if (embedding.length > 0) embeddings.push(embedding);
        }

        setCaptureProgress(Math.round(((i + 1) / totalFrames) * 100));
      }

      if (embeddings.length < Math.round(totalFrames * 0.25)) {
        toast.error(`Face not detected consistently. Please hold still and try again.`);
        updateStatus("detected");
        void startDetection(landmarker);
        return;
      }

      const embeddingLength = embeddings[0].length;
      const averaged = new Array(embeddingLength).fill(0);
      for (const embedding of embeddings) {
        for (let j = 0; j < embeddingLength; j++) {
          averaged[j] += embedding[j];
        }
      }
      for (let j = 0; j < embeddingLength; j++) {
        averaged[j] /= embeddings.length;
      }

      const snapshot = captureSnapshot(video);
      setResultSnapshot(snapshot);
      setResultEmbedding(averaged);
      const videoBase64 = await videoBase64Promise;

      updateStatus("saving");
      await onFaceCaptured(averaged, snapshot, videoBase64);

      stopCamera();
      updateStatus("success");
    } catch (error) {
      toast.error(`Failed to process face: ${error instanceof Error ? error.message : "Unknown error"}`);
      updateStatus("detected");
      void startDetection(landmarker);
    }
  }, [onFaceCaptured, startDetection, stopCamera, updateStatus]);

  useEffect(() => {
    if (open) {
      updateStatus("loading-model");
      setHasFace(false);
      setConfidence(0);
      setCaptureProgress(0);
      setCameraError(null);
      setResultSnapshot(null);
      setResultEmbedding(null);
      setLoadStep("");
      captureAbortRef.current = false;
      const timer = window.setTimeout(() => { void initCamera(); }, 100);
      return () => { window.clearTimeout(timer); };
    }
    stopCamera();
    updateStatus("idle");
    setCaptureProgress(0);
    return () => stopCamera();
  }, [initCamera, open, stopCamera, updateStatus]);

  const handleClose = () => { captureAbortRef.current = true; stopCamera(); onOpenChange(false); };
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    handleClose();
  };
  const isBusy = status === "capturing" || status === "saving" || status === "loading-model";

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldAlertIcon className="size-5" />
          </div>
          <DialogTitle>Face Verification</DialogTitle>
          <DialogDescription>
            {status === "success"
              ? "Review your face verification result below."
              : status === "saving"
                ? "Processing your face data..."
                : status === "capturing"
                  ? "Recording face clip — hold still"
                  : "Look directly at the camera with good lighting."}
          </DialogDescription>
        </DialogHeader>

        {showCaptureView ? (
          <>
            <div className="relative overflow-hidden rounded-2xl bg-black">
              <video ref={videoRef} autoPlay className="aspect-[4/3] w-full object-cover" muted playsInline />

              {status === "loading-model" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
                  <Loader2Icon className="size-8 animate-spin text-white" />
                  <p className="text-white text-sm">{loadStep || "Loading face detection model..."}</p>
                </div>
              ) : null}

              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-6 text-center">
                  <XCircleIcon className="size-10 text-red-400" />
                  <p className="text-red-300 text-sm">{cameraError}</p>
                </div>
              ) : null}

              {!cameraError && status !== "loading-model" ? (
                <>
                  <div
                    className={`pointer-events-none absolute inset-0 rounded-2xl border-4 transition-all ${
                      status === "capturing" || status === "saving"
                        ? "border-red-500/70 animate-pulse"
                        : hasFace
                          ? "border-green-400/70"
                          : "border-yellow-400/50"
                    }`}
                  />
                  {(status === "capturing" || status === "saving") && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40">
                      {status === "saving" ? (
                        <Loader2Icon className="size-8 animate-spin text-white" />
                      ) : (
                        <div className="size-3 animate-pulse rounded-full bg-red-500" />
                      )}
                      <p className="font-medium text-white">
                        {status === "capturing" ? "Recording clip..." : "Processing..."}
                      </p>
                      <p className="text-white/60 text-xs">Hold still</p>
                    </div>
                  )}
                  {status !== "capturing" && status !== "saving" ? (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-white text-xs">{hasFace ? "Face detected" : "Position your face in the frame"}</span>
                        <span className="text-white/70 text-xs">{hasFace ? `Quality: ${Math.round(confidence * 100)}%` : ""}</span>
                      </div>
                      <Progress aria-label="Face detection quality" value={confidence * 100} />
                    </div>
                  ) : null}
                  {(status === "capturing" || status === "saving") && (
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <Progress aria-label="Capture progress" className="[&>div]:bg-red-500" value={captureProgress} />
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <DialogFooter className="border-t bg-muted/50">
              <Button disabled={isBusy} onClick={handleClose} variant="outline">
                Cancel
              </Button>
              {!(status === "capturing" || status === "saving") ? (
                <Button disabled={!hasFace || isBusy} onClick={() => void captureAndSave()}>
                  <CameraIcon className="size-4" />
                  Capture & Verify
                </Button>
              ) : status === "capturing" ? (
                <Button disabled>
                  <Loader2Icon className="size-4 animate-spin" />
                  Capturing...
                </Button>
              ) : (
                <Button disabled>
                  <Loader2Icon className="size-4 animate-spin" />
                  Saving...
                </Button>
              )}
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative overflow-hidden rounded-2xl bg-black">
                {resultSnapshot ? (
                  <img
                    alt="Captured face"
                    className="aspect-[4/3] w-full rounded-lg object-cover"
                    src={resultSnapshot}
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center">
                    <CheckCircle2Icon className="size-12 text-emerald-400" />
                  </div>
                )}
                <div className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 backdrop-blur">
                  <CheckCircle2Icon className="size-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-xs font-medium">Verified</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Face Signature
                  </p>
                  <div className="rounded-lg border p-3">
                    {resultEmbedding ? (
                      <EmbeddingFingerprint embedding={resultEmbedding} />
                    ) : null}
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <ScanFaceIcon className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Quality score</span>
                    <span className="ml-auto font-medium">{Math.round(confidence * 100)}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 p-3">
                  <CheckCircle2Icon className="size-5 shrink-0 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      Face verified successfully
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Your identity has been confirmed
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t bg-muted/50">
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
