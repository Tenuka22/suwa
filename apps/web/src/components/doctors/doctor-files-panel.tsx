import {
  Alert,
  Button,
  Chip,
  Fieldset,
  Skeleton,
  TextArea,
  ToggleButton,
  ToggleButtonGroup,
  toast,
} from "@heroui/react";
import { useEffect, useMemo, useState } from "react";

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
import {
  useDeleteDoctorFile,
  useDoctorFiles,
  useUploadDoctorFile,
} from "@/hooks/doctor/use-doctor-files";
import { useDoctorMaterialPreviewUrl } from "@/hooks/doctor/use-doctor-material-preview";
import { type DoctorFileKind, doctorFileKinds } from "@/utils/doctor/files";
import { DoctorFileCard } from "./doctor-file-card";

interface DoctorFilesPanelProps {
  canManage: boolean;
  doctorId: string;
  isPermanent: boolean;
}

function getAcceptForKind(kind: DoctorFileKind): string {
  if (kind === "intro_video") {
    return "video/*";
  }

  if (kind === "portrait") {
    return "image/*";
  }

  return "image/*,video/*,application/pdf";
}

export function DoctorFilesPanel({
  canManage,
  doctorId,
  isPermanent,
}: DoctorFilesPanelProps) {
  const dropzone = useDropzone();
  const filesQuery = useDoctorFiles();
  const uploadFile = useUploadDoctorFile();
  const deleteFile = useDeleteDoctorFile();
  const [fileKind, setFileKind] = useState<DoctorFileKind>("portrait");
  const [caption, setCaption] = useState("");

  const files = filesQuery.data ?? [];
  const accept = useMemo(() => getAcceptForKind(fileKind), [fileKind]);
  const selectedKind = useMemo(
    () => doctorFileKinds.find((kind) => kind.value === fileKind),
    [fileKind]
  );
  const selectedFile = dropzone.file;
  const selectedPreviewUrl = useMemo(() => {
    if (selectedFile?.type.startsWith("image/") !== true) {
      return null;
    }

    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(
    () => () => {
      if (selectedPreviewUrl) {
        URL.revokeObjectURL(selectedPreviewUrl);
      }
    },
    [selectedPreviewUrl]
  );

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.danger("Pick a file first");
      return;
    }

    try {
      await uploadFile.mutateAsync({
        caption: caption.trim() || undefined,
        doctorId,
        file: selectedFile,
        fileKind,
      });
      setCaption("");
      dropzone.removeFile();
      toast.success("Doctor file uploaded");
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFile.mutateAsync({ id });
      toast.success("Doctor file removed");
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Delete failed");
    }
  };

  return (
      <div className="flex flex-col gap-6">
        {canManage ? (
          <Fieldset className="rounded-2xl border bg-muted/10 p-5">
            <Fieldset.Legend className="sr-only">Upload materials</Fieldset.Legend>
            <Fieldset.Group className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-sm">File type</p>
                  <ToggleButtonGroup
                    className="mt-2 flex flex-wrap"
                    isDetached
                    selectedKeys={new Set([fileKind])}
                    selectionMode="single"
                    onSelectionChange={(keys) => {
                      const key = [...keys][0] as DoctorFileKind | undefined;
                      if (key) setFileKind(key);
                    }}
                  >
                    {doctorFileKinds.map((kind) => (
                      <ToggleButton id={kind.value} key={kind.value}>
                        {kind.label}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </div>

                <div className="rounded-xl border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">
                        {selectedKind?.label ?? fileKind}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {selectedKind?.description}
                      </p>
                    </div>
                    <Chip variant="tertiary">{accept}</Chip>
                  </div>
                </div>

                <div>
                  <label
                    className="block font-medium text-sm"
                    htmlFor="doctor-material-caption"
                  >
                    Caption
                  </label>
                  <TextArea
                    id="doctor-material-caption"
                    className="mt-2 w-full"
                    onChange={(event) => setCaption(event.target.value)}
                    placeholder="Short public description"
                    value={caption}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Dropzone
                  {...dropzone}
                  accept={accept}
                  setStatus={dropzone.setStatus}
                >
                  <DropzoneDescription>
                    Click or drag and drop a file to upload. Images, videos,
                    and PDFs are supported.
                  </DropzoneDescription>
                  <DropzoneMessage />
                  <DropZoneArea>
                    <div className="flex flex-row gap-3 pt-3">
                      <DropzoneTrigger>Choose file</DropzoneTrigger>
                      <Button
                        isDisabled={uploadFile.isPending || !selectedFile}
                        onPress={handleUpload}
                      >
                        {uploadFile.isPending ? "Uploading..." : "Upload file"}
                    </Button>
                    </div>
                      {selectedFile ? (
                        <p className="text-muted-foreground text-sm">
                          {selectedFile.name}
                        </p>
                      ) : null}
                  </DropZoneArea>
                  <DropzoneFileList>
                    {selectedFile ? (
                      <DropzoneFileListItem file={selectedFile}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {selectedPreviewUrl ? (
                              <img
                                alt={selectedFile.name}
                                className="size-10 rounded-md object-cover"
                                height={40}
                                src={selectedPreviewUrl}
                                width={40}
                              />
                            ) : (
                              <div className="flex size-10 items-center justify-center rounded-md bg-muted text-[10px]">
                                File
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-sm truncate max-w-64">
                                {selectedFile.name}
                              </div>
                              <p className="text-muted-foreground text-xs">
                                {selectedFile.type || "Unknown type"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DropzoneRemoveFile>Remove</DropzoneRemoveFile>
                          </div>
                        </div>
                      </DropzoneFileListItem>
                    ) : null}
                  </DropzoneFileList>
                </Dropzone>
              </div>
            </Fieldset.Group>
          </Fieldset>
        ) : (
          <p className="text-muted-foreground text-sm">
            {isPermanent
              ? "Uploads are currently unavailable."
              : "Wait a moment. Your doctor profile needs to be approved before you can add uploads."}
          </p>
        )}

        {filesQuery.isFetching ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : filesQuery.isError ? (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>
                Failed to load doctor materials. Please try again.
              </Alert.Description>
            </Alert.Content>
          </Alert>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1">
            <p className="font-medium text-sm">No files uploaded yet</p>
            <p className="text-muted-foreground text-sm">
              Upload documents, images, or videos to showcase your credentials.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {files.map((file) => (
              <DoctorFilePreviewCard
                file={file}
                isDeleting={deleteFile.isPending}
                key={file.id}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
  );
}

function DoctorFilePreviewCard({
  file,
  isDeleting,
  onDelete,
}: {
  file: {
    caption: string | null;
    fileKind: "portrait" | "qualification" | "intro_video" | "other";
    fileName: string;
    id: string;
    isVideo: boolean;
    mimeType: string;
    size: number;
  };
  isDeleting: boolean;
  onDelete: (id: string) => void;
}) {
  const previewUrl = useDoctorMaterialPreviewUrl(file.id);

  return (
    <DoctorFileCard
      file={file}
      isDeleting={isDeleting}
      onDelete={onDelete}
      previewUrl={previewUrl}
    />
  );
}
