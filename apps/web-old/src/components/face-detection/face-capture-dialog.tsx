"use client";

import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";
import { Button } from "@suwa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@suwa/ui/components/dialog";
import { Progress } from "@suwa/ui/components/progress";
import {
  CameraIcon,
  CheckCircle2Icon,
  Loader2Icon,
  ShieldAlertIcon,
  XCircleIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export type FaceCaptureStatus =
  | "idle"
  | "loading-model"
  | "camera-permission"
  | "detecting"
  | "detected"
  | "capturing"
  | "saving"
  | "success"
  | "error";

interface FaceCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFaceCaptured: (embedding: number[]) => Promise<void>;
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

function computeEmbedding(
  landmarks: { x: number; y: number; z: number }[]
): number[] {
  const faceLandmarks = KEY_LANDMARK_INDICES
    .map((index) => landmarks[index])
    .filter(
      (point): point is { x: number; y: number; z: number } => Boolean(point)
    );

  if (faceLandmarks.length === 0) {
    return [];
  }

  const cx = faceLandmarks.reduce((sum, point) => sum + point.x, 0) / faceLandmarks.length;
  const cy = faceLandmarks.reduce((sum, point) => sum + point.y, 0) / faceLandmarks.length;
  const cz = faceLandmarks.reduce((sum, point) => sum + point.z, 0) / faceLandmarks.length;

  const distances = faceLandmarks.map((point) =>
    Math.sqrt(
      (point.x - cx) * (point.x - cx) +
        (point.y - cy) * (point.y - cy) +
        (point.z - cz) * (point.z - cz)
    )
  );
  const scale = Math.max(...distances);

  if (scale < 0.001) {
    return [];
  }

  return faceLandmarks.flatMap((point) => [
    (point.x - cx) / scale,
    (point.y - cy) / scale,
    (point.z - cz) / scale,
  ]);
}

export function FaceCaptureDialog({
  open,
  onOpenChange,
  onFaceCaptured,
}: FaceCaptureDialogProps) {
  const [status, setStatus] = useState<FaceCaptureStatus>("idle");
  const [hasFace, setHasFace] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
  }, []);

  const startDetection = useCallback(async (landmarker: FaceLandmarker) => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      return;
    }

    const detectFrame = () => {
      const results = landmarker.detectForVideo(video, performance.now());
      const faces = results.faceLandmarks;

      if (faces.length > 0) {
        const firstFace = faces[0];
        let minY = Infinity;
        let maxY = -Infinity;
        let minX = Infinity;
        let maxX = -Infinity;

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
        setStatus(isCentered && isLargeEnough ? "detected" : "detecting");
      } else {
        setHasFace(false);
        setConfidence(0);
        setStatus("detecting");
      }

      animFrameRef.current = requestAnimationFrame(detectFrame);
    };

    detectFrame();
  }, []);

  const initCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setHasFace(false);
    setConfidence(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

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

      landmarkerRef.current = landmarker;
      await startDetection(landmarker);
      setStatus("detecting");
    } catch (error) {
      if (error instanceof Error && error.name === "NotAllowedError") {
        setCameraError("Camera access denied. Please allow camera access and try again.");
        setStatus("camera-permission");
        return;
      }

      setCameraError(error instanceof Error ? error.message : "Unknown camera error occurred.");
      setStatus("error");
    }
  }, [startDetection, stopCamera]);

  const captureAndSave = useCallback(async () => {
    const landmarker = landmarkerRef.current;
    const video = videoRef.current;

    if (!landmarker || !video) {
      return;
    }

    setStatus("capturing");

    try {
      const embeddings: number[][] = [];
      const frameCount = 8;

      for (let index = 0; index < frameCount; index++) {
        const results = landmarker.detectForVideo(video, performance.now());
        const faces = results.faceLandmarks;

        if (faces.length > 0) {
          const embedding = computeEmbedding(faces[0]);
          if (embedding.length > 0) {
            embeddings.push(embedding);
          }
        }

        if (index < frameCount - 1) {
          await new Promise((resolve) => setTimeout(resolve, 80));
        }
      }

      if (embeddings.length < 3) {
        toast.error(
          `Only detected a face in ${embeddings.length}/${frameCount} frames. Please hold still and try again.`
        );
        setStatus("detected");
        return;
      }

      const embeddingLength = embeddings[0].length;
      const averaged = new Array(embeddingLength).fill(0);

      for (const embedding of embeddings) {
        for (let index = 0; index < embeddingLength; index++) {
          averaged[index] += embedding[index];
        }
      }

      for (let index = 0; index < embeddingLength; index++) {
        averaged[index] /= embeddings.length;
      }

      setStatus("saving");
      await onFaceCaptured(averaged);
      setStatus("success");
    } catch (error) {
      toast.error(
        `Failed to process face: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setStatus("detected");
    }
  }, [onFaceCaptured]);

  useEffect(() => {
    if (open) {
      setStatus("loading-model");
      setHasFace(false);
      setConfidence(0);
      setCameraError(null);
      const timer = window.setTimeout(() => {
        void initCamera();
      }, 100);

      return () => {
        window.clearTimeout(timer);
      };
    }

    stopCamera();
    setStatus("idle");
    return () => stopCamera();
  }, [initCamera, open, stopCamera]);

  const handleClose = () => {
    stopCamera();
    onOpenChange(false);
  };

  const isBusy = status === "capturing" || status === "saving" || status === "loading-model";

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="sm:max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldAlertIcon className="size-5" />
          </div>
          <DialogTitle>Face Verification</DialogTitle>
          <DialogDescription>
            Look directly at the camera with good lighting to verify your identity.
          </DialogDescription>
        </DialogHeader>

        <div className="relative overflow-hidden rounded-2xl bg-black">
          <video
            ref={videoRef}
            autoPlay
            className="aspect-[4/3] w-full object-cover"
            muted
            playsInline
          />

          {status === "loading-model" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
              <Loader2Icon className="size-8 animate-spin text-white" />
              <p className="text-white text-sm">Loading face detection model...</p>
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
                className={
                  hasFace
                    ? "pointer-events-none absolute inset-0 rounded-2xl border-4 border-green-400/70"
                    : "pointer-events-none absolute inset-0 rounded-2xl border-4 border-yellow-400/50"
                }
              />
              {status !== "success" ? (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-white text-xs">
                      {hasFace ? "Face detected" : "Position your face in the frame"}
                    </span>
                    <span className="text-white/70 text-xs">
                      {hasFace ? `Quality: ${Math.round(confidence * 100)}%` : ""}
                    </span>
                  </div>
                  <Progress aria-label="Face detection quality" value={confidence * 100} />
                </div>
              ) : null}
            </>
          ) : null}

          {status === "success" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-emerald-950/40">
              <CheckCircle2Icon className="size-16 text-emerald-400" />
              <p className="font-semibold text-white text-lg">Face verified</p>
              <p className="text-white/80 text-sm">Your identity has been confirmed.</p>
            </div>
          ) : null}
        </div>

        <DialogFooter className="border-t bg-muted/50">
          {status === "success" ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <>
              <Button disabled={isBusy} onClick={handleClose} variant="outline">
                Cancel
              </Button>
              <Button disabled={!hasFace || isBusy} onClick={() => void captureAndSave()}>
                <CameraIcon className="size-4" />
                {status === "capturing"
                  ? "Analyzing..."
                  : status === "saving"
                    ? "Saving..."
                    : "Capture & Verify"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
