import { Alert, AlertDescription } from "@suwa/ui/components/alert";
import { Badge } from "@suwa/ui/components/badge";
import { Button } from "@suwa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@suwa/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@suwa/ui/components/select";
import { Skeleton } from "@suwa/ui/components/skeleton";
import { Textarea } from "@suwa/ui/components/textarea";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
      toast.error("Pick a file first");
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
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFile.mutateAsync({ id });
      toast.success("Doctor file removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle>Doctor materials</CardTitle>
          <p className="text-muted-foreground text-sm">
            Public images, qualifications, and intro video content.
          </p>
        </div>
        <Badge variant="outline">{files.length} files</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {canManage ? (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Dropzone
              {...dropzone}
              accept={accept}
              setStatus={dropzone.setStatus}
            >
              <DropzoneDescription>
                Click or drag and drop a file to upload. Images, videos, and
                PDFs are supported.
              </DropzoneDescription>
              <DropzoneMessage />
              <DropZoneArea>
                <div className="flex flex-col gap-4">
                  <div>
                    <label
                      className="block font-medium text-sm"
                      htmlFor="doctor-material-file-kind"
                    >
                      File type
                    </label>
                    <Select
                      onValueChange={(value) =>
                        setFileKind(value as DoctorFileKind)
                      }
                      value={fileKind}
                    >
                      <SelectTrigger
                        className="w-full"
                        id="doctor-material-file-kind"
                      >
                        <SelectValue placeholder="Select file type" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctorFileKinds.map((kind) => (
                          <SelectItem key={kind.value} value={kind.value}>
                            {kind.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-xl border bg-muted/20">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {selectedKind?.label ?? fileKind}
                      </Badge>
                      <span className="text-muted-foreground text-sm">
                        {selectedKind?.description}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Accepts: {accept}
                    </p>
                  </div>

                  <div>
                    <label
                      className="block font-medium text-sm"
                      htmlFor="doctor-material-caption"
                    >
                      Caption
                    </label>
                    <Textarea
                      id="doctor-material-caption"
                      onChange={(event) => setCaption(event.target.value)}
                      placeholder="Short public description"
                      value={caption}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <DropzoneTrigger>
                      Click here or drag and drop
                    </DropzoneTrigger>
                    <Button
                      disabled={uploadFile.isPending || !selectedFile}
                      onClick={handleUpload}
                    >
                      {uploadFile.isPending ? "Uploading..." : "Upload file"}
                    </Button>
                    {selectedFile ? (
                      <p className="text-muted-foreground text-sm">
                        {selectedFile.name}
                      </p>
                    ) : null}
                  </div>
                </div>
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
                          <div className="font-medium text-sm">
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
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load doctor materials. Please try again.
            </AlertDescription>
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
      </CardContent>
    </Card>
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
    fileKey: string;
    fileName: string;
    id: string;
    isVideo: boolean;
    mimeType: string;
    thumbnailKey: string | null;
    size: number;
  };
  isDeleting: boolean;
  onDelete: (id: string) => void;
}) {
  const previewUrl = useDoctorMaterialPreviewUrl(file);

  return (
    <DoctorFileCard
      file={file}
      isDeleting={isDeleting}
      onDelete={onDelete}
      previewUrl={previewUrl}
    />
  );
}
