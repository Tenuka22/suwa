import { Badge } from "@suwa/ui/components/badge";
import { Button } from "@suwa/ui/components/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@suwa/ui/components/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@suwa/ui/components/dialog";
import { Input } from "@suwa/ui/components/input";
import { Label } from "@suwa/ui/components/label";
import { Progress } from "@suwa/ui/components/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@suwa/ui/components/select";
import { Textarea } from "@suwa/ui/components/textarea";
import {
  EyeIcon,
  EyeOffIcon,
  FileAudioIcon,
  FileVideoIcon,
  LinkIcon,
  MusicIcon,
  PauseIcon,
  PlayIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import type { UploadProgress } from "@/hooks/hub/use-chunked-upload";
import { useChunkedUpload } from "@/hooks/hub/use-chunked-upload";
import { useHubChannels } from "@/hooks/hub/use-hub";
import {
  createVideoThumbnail,
  isAudioFile,
  isVideoFile,
} from "@/utils/video-thumbnail";

interface UploadWizardDialogProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

const VISIBILITY_OPTIONS = [
  {
    value: "private" as const,
    label: "Private",
    icon: EyeOffIcon,
    description: "Only you can see this",
  },
  {
    value: "unlisted" as const,
    label: "Unlisted",
    icon: LinkIcon,
    description: "Anyone with the link can view",
  },
  {
    value: "public" as const,
    label: "Public",
    icon: EyeIcon,
    description: "Anyone can discover and view",
  },
];

const SUGGESTED_TAGS = [
  "anxiety",
  "CBT",
  "depression",
  "meditation",
  "mindfulness",
  "motivation",
  "psychology",
  "self-care",
  "sleep",
  "stress",
  "therapy",
  "trauma",
  "mental-health",
  "wellness",
  "breathing",
  "gratitude",
  "journaling",
  "resilience",
  "emotions",
  "relationships",
];

type WizardStep = "select" | "details" | "uploading" | "done";

export function UploadWizardDialog({
  open,
  onOpenChange,
}: UploadWizardDialogProps) {
  const [step, setStep] = useState<WizardStep>("select");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<
    "public" | "unlisted" | "private"
  >("private");
  const [channelId, setChannelId] = useState<string>("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const { data: channels } = useHubChannels();
  const channelOptions: Array<{ id: string; name: string }> = Array.isArray(
    channels
  )
    ? channels
    : [];
  const { progress, startUpload, pauseUpload, resumeWithFile, resetUpload } =
    useChunkedUpload({
    onComplete: () => setStep("done"),
  });

  const reset = useCallback(() => {
    setStep("select");
    setSelectedFile(null);
    setTitle("");
    setDescription("");
    setTags([]);
    setVisibility("private");
    setChannelId("");
    setThumbnailFile(null);
    setThumbnailPreview(null);
    resetUpload();
  }, [resetUpload]);

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open) {
        reset();
      }
      onOpenChange(open);
    },
    [onOpenChange, reset]
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      const isVideo = isVideoFile(file);
      const isAudio = isAudioFile(file);

      if (!(isVideo || isAudio)) {
        return;
      }

      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
      setStep("details");
    },
    [title]
  );

  const handleStartUpload = useCallback(async () => {
    if (!selectedFile) {
      return;
    }

    const isVideo = isVideoFile(selectedFile);
    const fileType = isVideo ? "video" : "audio";

    let thumbnailDataBase64: string | undefined;
    let thumbnailMimeType: string | undefined;
    if (thumbnailFile) {
      const buffer = await thumbnailFile.arrayBuffer();
      thumbnailDataBase64 = arrayBufferToBase64(buffer);
      thumbnailMimeType = thumbnailFile.type;
    } else if (isVideo) {
      const autoThumbnail = await createVideoThumbnail(selectedFile);
      if (autoThumbnail) {
        thumbnailDataBase64 = autoThumbnail.dataBase64;
        thumbnailMimeType = autoThumbnail.mimeType;
      }
    }

    setStep("uploading");
    await startUpload(selectedFile, {
      fileType,
      title: title.trim() || selectedFile.name,
      channelId: channelId || undefined,
      visibility,
      thumbnailDataBase64,
      thumbnailMimeType,
      tags: tags.length > 0 ? tags : undefined,
    });
  }, [selectedFile, title, channelId, visibility, startUpload, thumbnailFile, tags]);

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1_073_741_824) {
      return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
    }
    if (bytes >= 1_048_576) {
      return `${(bytes / 1_048_576).toFixed(1)} MB`;
    }
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const formatProgress = (p: UploadProgress | null) => {
    if (!p) {
      return { percent: 0, text: "Preparing..." };
    }
    const percent = Math.round(p.progress * 100);
    const uploadedBytes =
      (p.uploadedChunks / p.totalChunks) * (selectedFile?.size ?? 0);
    return {
      percent,
      text: `${formatFileSize(uploadedBytes)} / ${formatFileSize(selectedFile?.size ?? 0)} (${percent}%)`,
    };
  };

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="font-medium text-sm">
            {step === "select" && "Upload content"}
            {step === "details" &&
              (selectedFile && isVideoFile(selectedFile)
                ? "Video details"
                : "Podcast details")}
            {step === "uploading" && "Uploading..."}
            {step === "done" && "Upload complete!"}
          </DialogTitle>
          <DialogDescription>
            {step === "select" &&
              "Choose what type of content you'd like to upload."}
            {step === "details" && "Set the title, description, thumbnail, tags, channel, and visibility."}
            {step === "uploading" &&
              "Your file is being uploaded. You can pause and resume later if needed."}
            {step === "done" &&
              "Your content has been uploaded and is being processed."}
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="grid grid-cols-2 gap-4">
            <button
              className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors hover:border-primary/50 hover:bg-primary/5"
              onClick={() => audioInputRef.current?.click()}
              type="button"
            >
              <MusicIcon className="size-10 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium text-sm">Podcast</p>
                <p className="text-muted-foreground text-xs">
                  Upload an audio file
                </p>
              </div>
            </button>
            <button
              className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors hover:border-primary/50 hover:bg-primary/5"
              onClick={() => videoInputRef.current?.click()}
              type="button"
            >
              <FileVideoIcon className="size-10 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium text-sm">Educational Video</p>
                <p className="text-muted-foreground text-xs">
                  Upload a video file
                </p>
              </div>
            </button>
            <input
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileSelect(file);
                }
              }}
              ref={audioInputRef}
              type="file"
            />
            <input
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileSelect(file);
                }
              }}
              ref={videoInputRef}
              type="file"
            />
          </div>
        )}

        {step === "details" && selectedFile && (
          <div className="grid gap-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
              {isVideoFile(selectedFile) ? (
                <FileVideoIcon className="size-8 text-primary" />
              ) : isAudioFile(selectedFile) ? (
                <FileAudioIcon className="size-8 text-primary" />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">
                  {selectedFile.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatFileSize(selectedFile.size)} &middot;{" "}
                  {selectedFile.type}
                </p>
              </div>
              <Button
                className="size-8"
                onClick={() => {
                  setSelectedFile(null);
                  setStep("select");
                }}
                size="icon"
                variant="ghost"
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            <MediaPreview file={selectedFile} />

            <div className="grid gap-2">
              <Label htmlFor="upload-title">Title</Label>
              <Input
                id="upload-title"
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a title that describes your content"
                value={title}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="upload-description">
                Description{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="upload-description"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers about your content..."
                rows={3}
                value={description}
              />
            </div>

            {selectedFile && isAudioFile(selectedFile) ? (
              <div className="grid gap-2">
                <Label>
                  Thumbnail{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <div className="flex items-start gap-3">
                  {thumbnailPreview ? (
                    <div className="relative aspect-square w-32 shrink-0 overflow-hidden rounded-lg border">
                      <img
                        alt="Thumbnail preview"
                        className="size-full object-cover"
                        src={thumbnailPreview}
                      />
                      <button
                        className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                        onClick={() => {
                          setThumbnailFile(null);
                          setThumbnailPreview(null);
                        }}
                        type="button"
                      >
                        <XIcon className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex aspect-square w-32 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
                      onClick={() => thumbnailInputRef.current?.click()}
                    >
                      <UploadIcon className="size-5" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <p className="font-medium text-sm">
                      Upload a square thumbnail
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Recommended: 1:1 square, max 2MB
                    </p>
                    <Button
                      onClick={() => thumbnailInputRef.current?.click()}
                      size="sm"
                      variant="outline"
                    >
                      {thumbnailPreview ? "Change" : "Select image"}
                    </Button>
                    <input
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setThumbnailFile(file);
                          setThumbnailPreview(URL.createObjectURL(file));
                        }
                      }}
                      ref={thumbnailInputRef}
                      type="file"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label>
                  Thumbnail{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <div className="flex items-start gap-3">
                  {thumbnailPreview ? (
                    <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg border">
                      <img
                        alt="Thumbnail preview"
                        className="size-full object-cover"
                        src={thumbnailPreview}
                      />
                      <button
                        className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                        onClick={() => {
                          setThumbnailFile(null);
                          setThumbnailPreview(null);
                        }}
                        type="button"
                      >
                        <XIcon className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex aspect-video w-32 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
                      onClick={() => thumbnailInputRef.current?.click()}
                    >
                      <UploadIcon className="size-5" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <p className="font-medium text-sm">
                      Upload a thumbnail
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Recommended: same ratio as video, max 2MB
                    </p>
                    <Button
                      onClick={() => thumbnailInputRef.current?.click()}
                      size="sm"
                      variant="outline"
                    >
                      {thumbnailPreview ? "Change" : "Select image"}
                    </Button>
                    <input
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setThumbnailFile(file);
                          setThumbnailPreview(URL.createObjectURL(file));
                        }
                      }}
                      ref={thumbnailInputRef}
                      type="file"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label>
                Tags{" "}
                <span className="text-muted-foreground">
                  (optional, up to 20)
                </span>
              </Label>
              <Combobox
                onValueChange={(value: string | null) => {
                  if (!value) return;
                  const trimmed = value.trim().toLowerCase();
                  if (trimmed && !tags.includes(trimmed) && tags.length < 20) {
                    setTags((prev) => [...prev, trimmed]);
                  }
                }}
              >
                <ComboboxInput
                  disabled={tags.length >= 20}
                  placeholder={
                    tags.length >= 20
                      ? "Maximum tags reached"
                      : "Search or add tags..."
                  }
                />
                <ComboboxContent>
                  <ComboboxList>
                    <ComboboxEmpty>No matching tags</ComboboxEmpty>
                    {SUGGESTED_TAGS.filter(
                      (t) => !tags.includes(t)
                    ).map((tag) => (
                      <ComboboxItem key={tag} value={tag}>
                        {tag}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <button
                        className="ml-0.5 rounded-full transition-colors hover:bg-muted-foreground/20"
                        onClick={() =>
                          setTags((prev) => prev.filter((t) => t !== tag))
                        }
                        type="button"
                      >
                        <XIcon className="size-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {channelOptions.length > 0 ? (
              <div className="grid gap-2">
                <Label>Channel</Label>
                <Select
                  onValueChange={(v) => setChannelId(v ?? "")}
                  value={channelId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {channelOptions.map((ch) => (
                      <SelectItem key={ch.id} value={ch.id}>
                        {ch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label>Visibility</Label>
              <div className="grid gap-2">
                {VISIBILITY_OPTIONS.map((opt) => (
                  <button
                    className={`flex items-center gap-3 rounded-lg border px-2 text-left transition-colors ${
                      visibility === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border/60 hover:border-border"
                    }`}
                    key={opt.value}
                    onClick={() => setVisibility(opt.value)}
                    type="button"
                  >
                    <opt.icon className="size-4 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{opt.label}</p>
                      <p className="text-muted-foreground text-xs">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === "uploading" && progress && (
          <div className="grid gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="truncate font-medium text-sm">
                  {progress.fileName}
                </p>
                <Badge variant="secondary">
                  {progress.status === "paused"
                    ? "Paused"
                    : progress.status === "error"
                      ? "Failed"
                      : progress.status === "completing"
                        ? "Processing..."
                        : "Uploading"}
                </Badge>
              </div>

              <Progress value={formatProgress(progress).percent} />

              <p className="text-muted-foreground text-sm">
                {formatProgress(progress).text}
              </p>

              {progress.status === "error" && progress.error && (
                <p className="text-destructive text-sm">{progress.error}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {progress.status === "uploading" && (
                <Button
                  className="gap-2"
                  onClick={pauseUpload}
                  size="sm"
                  variant="outline"
                >
                  <PauseIcon className="size-4" />
                  Pause
                </Button>
              )}
              {progress.status === "paused" && (
                <Button
                  className="gap-2"
                  onClick={() => {
                    if (selectedFile) {
                      resumeWithFile(selectedFile, progress.uploadId);
                    }
                  }}
                  size="sm"
                  variant="outline"
                >
                  <PlayIcon className="size-4" />
                  Resume
                </Button>
              )}
            </div>

            <p className="text-muted-foreground text-xs">
              You can close this dialog and resume the upload later from the hub
              page. Uploads that are interrupted can be continued from where
              they left off.
            </p>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <FileVideoIcon className="size-8 text-primary" />
            </div>
            <p className="font-medium">
              Your content has been uploaded successfully!
            </p>
            <p className="text-center text-muted-foreground text-sm">
              It will appear in your hub once processing is complete.
            </p>
          </div>
        )}

        <DialogFooter>
          {step === "details" && (
            <>
              <Button
                onClick={() => {
                  setSelectedFile(null);
                  setStep("select");
                }}
                variant="outline"
              >
                Back
              </Button>
              <Button
                className="gap-2"
                disabled={!(title.trim() && selectedFile)}
                onClick={handleStartUpload}
              >
                <UploadIcon className="size-4" />
                Upload
              </Button>
            </>
          )}
          {step === "done" && (
            <Button onClick={() => handleClose(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function MediaPreview({ file }: { file: File }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);

  const isVideo = file.type.startsWith("video/");

  return (
    <div className="overflow-hidden rounded-lg border">
      {isVideo ? (
        <video
          className="max-h-[300px] w-full"
          controls
          preload="metadata"
          src={url}
        >
          Your browser does not support the video element.
        </video>
      ) : (
        <audio
          className="w-full"
          controls
          preload="metadata"
          src={url}
        >
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
}
