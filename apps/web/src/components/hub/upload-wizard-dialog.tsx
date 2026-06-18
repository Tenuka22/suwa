import {
  Button,
  Chip,
  Input,
  Label,
  ListBox,
  Modal,
  ProgressBar,
  Select,
  TextArea,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";
import {
  DropZoneArea,
  Dropzone,
  DropzoneDescription,
  DropzoneFileList,
  DropzoneFileListItem,
  DropzoneMessage,
  DropzoneRemoveFile,
  DropzoneTrigger,
  useDropzone,
} from "@/components/dropzone";

import { useChunkedUpload } from "@/hooks/hub/use-chunked-upload";
import { useHubChannels } from "@/hooks/hub/use-hub";
import { cn } from "@/lib/utils";
import {
  EyeIcon,
  EyeOffIcon,
  FileAudioIcon,
  FileVideoIcon,
  LinkIcon,
  PauseIcon,
  PlayIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

interface UploadWizardDialogProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

const VISIBILITY_OPTIONS = [
  { value: "private" as const, label: "Private", icon: EyeOffIcon, description: "Only you can see this" },
  { value: "unlisted" as const, label: "Unlisted", icon: LinkIcon, description: "Anyone with the link can view" },
  { value: "public" as const, label: "Public", icon: EyeIcon, description: "Anyone can discover and view" },
] as const;

type WizardSection = "file" | "details";

export function UploadWizardDialog({ open, onOpenChange }: UploadWizardDialogProps) {
  const [section, setSection] = useState<WizardSection>("file");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("private");
  const [channelId, setChannelId] = useState<string>("");
  const [showErrors, setShowErrors] = useState(false);

  const dropzone = useDropzone();
  const selectedFile = dropzone.file;
  const hasTitleError = showErrors && !title.trim();
  const { data: channels } = useHubChannels();
  const { progress, startUpload, pauseUpload, resetUpload } = useChunkedUpload();

  const reset = useCallback(() => {
    setSection("file");
    setShowErrors(false);
    setTitle("");
    setDescription("");
    setTags("");
    setVisibility("private");
    setChannelId("");
    dropzone.removeFile();
    dropzone.setStatus("idle");
    resetUpload();
  }, [dropzone, resetUpload]);

  const handleClose = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) reset();
      onOpenChange(nextOpen);
    },
    [onOpenChange, reset],
  );

  const handleStartUpload = useCallback(async () => {
    setShowErrors(true);
    if (!(selectedFile && title.trim())) return;
    await startUpload(selectedFile, { channelId: channelId || undefined, fileType: selectedFile.type.startsWith("video/") ? "video" : "audio", title: title.trim(), visibility });
  }, [channelId, selectedFile, startUpload, title, visibility]);

  const fileSizeLabel = useCallback((bytes: number) => {
    if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
    if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  }, []);

  const progressState = useMemo(() => {
    if (!progress) return { percent: 0, text: "Preparing..." };
    const percent = Math.round(progress.progress * 100);
    const uploadedBytes = (progress.uploadedChunks / progress.totalChunks) * (selectedFile?.size ?? 0);
    return { percent, text: `${fileSizeLabel(uploadedBytes)} / ${fileSizeLabel(selectedFile?.size ?? 0)} (${percent}%)` };
  }, [fileSizeLabel, progress, selectedFile?.size]);

  return (
    <Modal>
      <Modal.Backdrop isOpen={open} onOpenChange={handleClose} variant="blur">
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog className="flex max-h-[90vh] flex-col overflow-hidden bg-background sm:max-w-[640px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <div className="space-y-1">
                <Modal.Heading className="text-lg font-semibold">{section === "file" ? "Upload content" : "Add details"}</Modal.Heading>
                <p className="text-light text-sm text-muted-foreground">{section === "file" ? "Choose an audio or video file for your hub." : "Add a clear title, tags, and visibility."}</p>
              </div>
            </Modal.Header>

            <Modal.Body className="flex flex-1 flex-col gap-6 overflow-y-auto">
              <ToggleButtonGroup selectedKeys={new Set([section])} selectionMode="single" disallowEmptySelection fullWidth onSelectionChange={(keys) => setSection((Array.from(keys)[0] as WizardSection) ?? "file") }>
                <ToggleButton id="file">File</ToggleButton>
                <ToggleButton id="details">Details</ToggleButton>
              </ToggleButtonGroup>

              {section === "file" ? (
                <Dropzone accept="video/*,audio/*" className="border-border/70 bg-muted/10 p-5" {...dropzone} setStatus={dropzone.setStatus}>
                  <DropzoneDescription>Drag and drop a video or audio file, or browse your device.</DropzoneDescription>
                  <DropzoneMessage />
                  <DropZoneArea>
                    <div className="flex flex-col gap-4 pt-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <DropzoneTrigger>Browse files</DropzoneTrigger>
                        <span className="text-sm text-muted-foreground">Supported: MP4, MOV, MP3, WAV, and more.</span>
                      </div>
                      <div className="rounded-2xl border bg-background p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-full bg-accent/10 text-accent"><UploadIcon className="size-5" /></div>
                          <div>
                            <p className="text-sm font-medium">Drop your file here</p>
                            <p className="text-sm text-muted-foreground">We’ll guide you through title, channel, and visibility next.</p>
                          </div>
                        </div>
                      </div>
                      {selectedFile ? (
                        <DropzoneFileList>
                          <DropzoneFileListItem file={selectedFile}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                {selectedFile.type.startsWith("video/") ? <FileVideoIcon className="size-8 text-accent" /> : <FileAudioIcon className="size-8 text-accent" />}
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                                  <p className="text-xs text-muted-foreground">{fileSizeLabel(selectedFile.size)} · {selectedFile.type || "Unknown type"}</p>
                                </div>
                              </div>
                              <DropzoneRemoveFile>Remove</DropzoneRemoveFile>
                            </div>
                          </DropzoneFileListItem>
                        </DropzoneFileList>
                      ) : null}
                    </div>
                  </DropZoneArea>
                </Dropzone>
              ) : (
                <div className="grid gap-5">
                  {selectedFile ? (
                    <div className="rounded-2xl border bg-muted/10 p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        {selectedFile.type.startsWith("video/") ? <FileVideoIcon className="size-8 text-accent" /> : <FileAudioIcon className="size-8 text-accent" />}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">{fileSizeLabel(selectedFile.size)} · {selectedFile.type || "Unknown type"}</p>
                        </div>
                        <Button isIconOnly onPress={() => { dropzone.removeFile(); setSection("file"); }} variant="ghost"><XIcon className="size-4" /></Button>
                      </div>
                    </div>
                  ) : null}

                  <div className="grid gap-2">
                    <Label htmlFor="upload-title">Title <span className="text-destructive">*</span></Label>
                    <Input className={cn(hasTitleError && "border-destructive/70 ring-destructive/30")} id="upload-title" onChange={(event) => setTitle(event.target.value)} placeholder="Add a title that describes your content" value={title} />
                    {hasTitleError ? <p className="text-xs text-destructive">Title is required</p> : null}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="upload-description">Description <span className="text-muted-foreground">(optional)</span></Label>
                    <TextArea id="upload-description" onChange={(event) => setDescription(event.target.value)} placeholder="Tell viewers about your content..." rows={4} value={description} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="upload-tags">Tags <span className="text-muted-foreground">(optional, comma-separated)</span></Label>
                    <Input id="upload-tags" onChange={(event) => setTags(event.target.value)} placeholder="therapy, anxiety, CBT" value={tags} />
                  </div>

                  {channels && channels.length > 0 ? (
                    <div className="grid gap-2">
                      <Label>Channel</Label>
                      <Select onSelectionChange={(key) => setChannelId((key ?? "") as string)} selectedKey={channelId}>
                        <Select.Trigger><Select.Value /></Select.Trigger>
                        <Select.Popover><ListBox>{channels.map((channel) => <ListBox.Item id={channel.id} key={channel.id} textValue={channel.name}>{channel.name}</ListBox.Item>)}</ListBox></Select.Popover>
                      </Select>
                    </div>
                  ) : null}

                  <div className="grid gap-3">
                    <Label>Visibility</Label>
                    <ToggleButtonGroup fullWidth isDetached selectedKeys={new Set([visibility])} selectionMode="single" disallowEmptySelection onSelectionChange={(keys) => setVisibility((Array.from(keys)[0] as typeof visibility) ?? "private") }>
                      {VISIBILITY_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        return (
                          <ToggleButton id={option.value} key={option.value} className="justify-start text-left" variant="ghost">
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground">
                                <Icon className="size-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{option.label}</p>
                                <p className="text-xs text-muted-foreground">{option.description}</p>
                              </div>
                            </div>
                          </ToggleButton>
                        );
                      })}
                    </ToggleButtonGroup>
                  </div>
                </div>
              )}

              {progress ? (
                <div className="grid gap-4 rounded-2xl border bg-muted/10 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium">{progress.fileName}</p>
                    <Chip variant="tertiary">{progress.status === "paused" ? "Paused" : progress.status === "error" ? "Failed" : progress.status === "completing" ? "Processing" : "Uploading"}</Chip>
                  </div>
                  <ProgressBar aria-label="Upload progress" value={progressState.percent}><ProgressBar.Track><ProgressBar.Fill /></ProgressBar.Track></ProgressBar>
                  <p className="text-sm text-muted-foreground">{progressState.text}</p>
                  {progress.status === "error" && progress.error ? <p className="text-sm text-destructive">{progress.error}</p> : null}
                  <div className="flex items-center gap-2">
                    {progress.status === "uploading" ? <Button className="gap-2" onPress={pauseUpload} size="sm" variant="outline"><PauseIcon className="size-4" />Pause</Button> : null}
                    {progress.status === "paused" ? <Button className="gap-2" size="sm" variant="outline"><PlayIcon className="size-4" />Resume</Button> : null}
                  </div>
                </div>
              ) : null}
            </Modal.Body>

            <Modal.Footer className="border-t border-border/60 px-6 py-4">
              {section === "file" ? <Button className="ml-auto gap-2" isDisabled={!selectedFile} onPress={() => setSection("details")}>Continue</Button> : <><Button onPress={() => setSection("file")} variant="outline">Back</Button><Button className="gap-2" isDisabled={!(title.trim() && selectedFile)} onPress={handleStartUpload}><UploadIcon className="size-4" />Upload</Button></>}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
