import { Button, Modal, ProgressBar, Spinner, toast } from "@heroui/react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import {
  Camera,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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
  onFaceCaptured: (embedding: number[]) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

const KEY_LANDMARK_INDICES = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109, 33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158,
  159, 160, 161, 246, 362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388,
  387, 386, 385, 384, 398, 61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291,
  409, 270, 269, 267, 0, 37, 39, 40, 185, 1, 2, 98, 327, 49, 279, 278, 195, 197,
  5, 4, 237, 456, 454, 46, 53, 52, 65, 55, 70, 63, 105, 66, 107, 276, 283, 282,
  295, 285, 300, 293, 334, 296, 336,
] as const;

function computeEmbedding(
  landmarks: { x: number; y: number; z: number }[]
): number[] {
  const faceLandmarks = KEY_LANDMARK_INDICES.map((i) => landmarks[i]).filter(
    Boolean
  ) as { x: number; y: number; z: number }[];

  const cx = faceLandmarks.reduce((s, p) => s + p.x, 0) / faceLandmarks.length;
  const cy = faceLandmarks.reduce((s, p) => s + p.y, 0) / faceLandmarks.length;
  const cz = faceLandmarks.reduce((s, p) => s + p.z, 0) / faceLandmarks.length;

  const distances = faceLandmarks.map((p) =>
    Math.sqrt(
      (p.x - cx) * (p.x - cx) +
        (p.y - cy) * (p.y - cy) +
        (p.z - cz) * (p.z - cz)
    )
  );
  const scale = Math.max(...distances);

  if (scale < 0.001) {
    return [];
  }

  return faceLandmarks.flatMap((p) => [
    (p.x - cx) / scale,
    (p.y - cy) / scale,
    (p.z - cz) / scale,
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
      streamRef.current.getTracks().forEach((t) => t.stop());
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
        let minY = Number.POSITIVE_INFINITY,
          maxY = Number.NEGATIVE_INFINITY,
          minX = Number.POSITIVE_INFINITY,
          maxX = Number.NEGATIVE_INFINITY;
        for (const pt of firstFace) {
          if (pt.x < minX) {
            minX = pt.x;
          }
          if (pt.x > maxX) {
            maxX = pt.x;
          }
          if (pt.y < minY) {
            minY = pt.y;
          }
          if (pt.y > maxY) {
            maxY = pt.y;
          }
        }
        const faceArea = (maxX - minX) * (maxY - minY);
        const faceCenterX = (minX + maxX) / 2;
        const faceCenterY = (minY + maxY) / 2;
        const isCentered =
          faceCenterX > 0.25 &&
          faceCenterX < 0.75 &&
          faceCenterY > 0.2 &&
          faceCenterY < 0.8;
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
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });
      landmarkerRef.current = landmarker;

      await startDetection(landmarker);
      setStatus("detecting");
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setCameraError(
            "Camera access denied. Please allow camera access and try again."
          );
          setStatus("camera-permission");
        } else {
          setCameraError(`Camera error: ${err.message}`);
          setStatus("error");
        }
      } else {
        setCameraError("Unknown camera error occurred.");
        setStatus("error");
      }
    }
  }, [startDetection, stopCamera]);

  const captureAndSave = useCallback(async () => {
    const landmarker = landmarkerRef.current;
    const video = videoRef.current;
    if (!(landmarker && video)) {
      return;
    }

    setStatus("capturing");

    try {
      const NUM_FRAMES = 8;
      const allEmbeddings: number[][] = [];

      for (let i = 0; i < NUM_FRAMES; i++) {
        const results = landmarker.detectForVideo(video, performance.now());
        const faces = results.faceLandmarks;

        if (faces.length > 0) {
          const embedding = computeEmbedding(faces[0]);
          if (embedding.length > 0) {
            allEmbeddings.push(embedding);
          }
        }

        if (i < NUM_FRAMES - 1) {
          await new Promise((r) => setTimeout(r, 80));
        }
      }

      if (allEmbeddings.length < 3) {
        toast.danger(
          `Only detected face in ${allEmbeddings.length}/${NUM_FRAMES} frames. Please hold still and try again.`
        );
        setStatus("detected");
        return;
      }

      const embeddingLength = allEmbeddings[0].length;
      const averaged = new Array(embeddingLength).fill(0);
      for (const emb of allEmbeddings) {
        for (let j = 0; j < embeddingLength; j++) {
          averaged[j] += emb[j];
        }
      }
      for (let j = 0; j < embeddingLength; j++) {
        averaged[j] /= allEmbeddings.length;
      }

      setStatus("saving");
      await onFaceCaptured(averaged);
      setStatus("success");
    } catch (err) {
      toast.danger(
        `Failed to process face: ${err instanceof Error ? err.message : "Unknown error"}`
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
      setTimeout(() => initCamera(), 100);
    } else {
      stopCamera();
      setStatus("idle");
    }

    return () => stopCamera();
  }, [open, initCamera, stopCamera]);

  const handleClose = () => {
    stopCamera();
    onOpenChange(false);
  };

  const isCapturingOrSaving =
    status === "capturing" || status === "saving" || status === "loading-model";

  return (
    <Modal.Backdrop isOpen={open} onOpenChange={handleClose}>
      <Modal.Container>
        <Modal.Dialog className="max-h-[90vh]">
          <Modal.Header>
            <Modal.Icon className="bg-primary text-primary-foreground">
              <ShieldAlert className="size-5" />
            </Modal.Icon>
            <Modal.Heading>Face Verification</Modal.Heading>
            <p className="font-normal text-muted-foreground text-sm">
              Look directly at the camera with good lighting to verify your
              identity
            </p>
          </Modal.Header>
          <Modal.Body>
            <div className="relative overflow-hidden rounded-2xl bg-black">
              <video
                autoPlay
                className="aspect-[4/3] w-full object-cover"
                muted
                playsInline
                ref={videoRef}
              />
              {status === "loading-model" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
                  <Loader2 className="size-8 animate-spin text-white" />
                  <p className="text-sm text-white">
                    Loading face detection model...
                  </p>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-6 text-center">
                  <XCircle className="size-10 text-red-400" />
                  <p className="text-red-300 text-sm">{cameraError}</p>
                </div>
              )}

              {status !== "loading-model" && !cameraError && (
                <>
                  <svg
                    className="pointer-events-none absolute inset-0 size-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid slice"
                    aria-label="Face alignment guide"
                    role="img"
                  >
                    <title>Align your face within the oval</title>
                    <ellipse
                      cx="50"
                      cy="45"
                      fill="none"
                      opacity={hasFace ? 0.6 : 1}
                      rx="28"
                      ry="33"
                      stroke="var(--accent, #4ade80)"
                      strokeDasharray="6 4"
                      strokeWidth="2.5"
                    />
                  </svg>

                  {status !== "success" && (
                    <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-white text-xs">
                          {hasFace
                            ? "Face detected"
                            : "Align your face within the oval"}
                        </span>
                        <span className="text-white/70 text-xs">
                          {hasFace
                            ? `Quality: ${Math.round(confidence * 100)}%`
                            : ""}
                        </span>
                      </div>
                      <ProgressBar
                        aria-label="Face detection quality"
                        size="sm"
                        value={confidence * 100}
                      >
                        <ProgressBar.Track className="h-1 bg-white/20">
                          <ProgressBar.Fill
                            className={
                              hasFace ? "bg-green-400" : "bg-yellow-400"
                            }
                          />
                        </ProgressBar.Track>
                      </ProgressBar>
                    </div>
                  )}
                </>
              )}

              {status === "success" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-green-900/40">
                  <CheckCircle2 className="size-16 text-green-400" />
                  <p className="font-semibold text-lg text-white">
                    Face Verified!
                  </p>
                  <p className="text-sm text-white/80">
                    Your identity has been confirmed
                  </p>
                </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer className="flex justify-end gap-3">
            {status === "success" ? (
              <Button onPress={handleClose} variant="primary">
                Done
              </Button>
            ) : (
              <>
                <Button
                  isDisabled={isCapturingOrSaving}
                  onPress={handleClose}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  isDisabled={!hasFace || isCapturingOrSaving}
                  onPress={captureAndSave}
                  variant="primary"
                >
                  {status === "loading-model" ? (
                    <Spinner className="size-4" />
                  ) : (
                    <Camera className="size-4" />
                  )}
                  {status === "loading-model"
                    ? "Loading model..."
                    : status === "capturing"
                      ? "Analyzing..."
                      : status === "saving"
                        ? "Saving..."
                        : "Capture & Verify"}
                </Button>
              </>
            )}
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
