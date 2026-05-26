import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zen-doc/ui/components/select";
import { Textarea } from "@zen-doc/ui/components/textarea";
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
    <Card className="border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-bold">Materials</CardTitle>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold px-1.5 h-4 uppercase">{files.length} Item{files.length === 1 ? "" : "s"}</Badge>
          </div>
          <p className="text-muted-foreground text-xs font-medium">
            Public documentation, credentials, and introductory media.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {canManage ? (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Dropzone
              {...dropzone}
              accept={accept}
              className="p-4 border-border/60 bg-muted/20 rounded-2xl"
              setStatus={dropzone.setStatus}
            >
              <DropzoneDescription className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60 mb-2">
                Upload System
              </DropzoneDescription>
              <DropzoneMessage />
              <DropZoneArea className="border-dashed border-2 border-border/40 hover:border-primary/30 transition-colors">
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label
                        className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1"
                        htmlFor="doctor-material-file-kind"
                      >
                        Classification
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          setFileKind(value as DoctorFileKind)
                        }
                        value={fileKind}
                      >
                        <SelectTrigger
                          className="h-9 w-full bg-background border-border/60 text-xs font-medium"
                          id="doctor-material-file-kind"
                        >
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctorFileKinds.map((kind) => (
                            <SelectItem key={kind.value} value={kind.value} className="text-xs">
                              {kind.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-end">
                      <div className="w-full rounded-lg border border-border/40 bg-background/50 p-2 text-[10px] text-muted-foreground leading-tight italic">
                        {selectedKind?.description}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1"
                      htmlFor="doctor-material-caption"
                    >
                      Description
                    </Label>
                    <Textarea
                      id="doctor-material-caption"
                      className="min-h-[60px] text-xs bg-background border-border/60 resize-none"
                      onChange={(event) => setCaption(event.target.value)}
                      placeholder="Enter public caption..."
                      value={caption}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <DropzoneTrigger className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest bg-muted border border-border/60 hover:bg-muted/80">
                      Select File
                    </DropzoneTrigger>
                    <Button
                      className="h-9 font-bold text-[10px] uppercase tracking-widest shadow-lg"
                      disabled={uploadFile.isPending || !selectedFile}
                      onClick={handleUpload}
                      size="sm"
                    >
                      {uploadFile.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                      Launch Upload
                    </Button>
                  </div>
                </div>
              </DropZoneArea>
              <DropzoneFileList>
                {selectedFile ? (
                  <DropzoneFileListItem file={selectedFile} className="mt-4 border-primary/20 bg-primary/5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {selectedPreviewUrl ? (
                          <img
                            alt={selectedFile.name}
                            className="size-10 rounded-lg object-cover border border-border/40"
                            height={40}
                            src={selectedPreviewUrl}
                            width={40}
                          />
                        ) : (
                          <div className="flex size-10 items-center justify-center rounded-lg bg-background border border-border/40 text-[9px] font-bold uppercase">
                            File
                          </div>
                        )}
                        <div className="space-y-0.5">
                          <div className="font-bold text-xs truncate max-w-[120px]">
                            {selectedFile.name}
                          </div>
                          <p className="text-[9px] font-medium text-primary uppercase tracking-tighter">
                            Ready for transmission
                          </p>
                        </div>
                      </div>
                      <DropzoneRemoveFile className="text-[10px] font-bold text-destructive underline-offset-4 hover:underline">Cancel</DropzoneRemoveFile>
                    </div>
                  </DropzoneFileListItem>
                ) : null}
              </DropzoneFileList>
            </Dropzone>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 border border-dashed rounded-2xl bg-muted/10 text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {isPermanent
                ? "Transmission Blocked"
                : "Verification Required"}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground/60 max-w-[240px]">
               {isPermanent ? "Module updates currently restricted." : "Profile verification must conclude before media injection."}
            </p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {files.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3 py-12 flex flex-col items-center justify-center text-muted-foreground/40">
               <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Zero Inventory</span>
            </div>
          ) : (
            files.map((file) => (
              <DoctorFilePreviewCard
                file={file}
                isDeleting={deleteFile.isPending}
                key={file.id}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
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
