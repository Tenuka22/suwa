"use client";

import { Button } from "@zen-doc/ui/components/button";
import { cn } from "@zen-doc/ui/lib/utils";
import { createContext, useContext, useMemo, useRef, useState } from "react";

type DropzoneStatus = "idle" | "dragging";

interface DropzoneContextValue {
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  openFilePicker: () => void;
  removeFile: () => void;
  setFile: (file: File | null) => void;
  setStatus: (status: DropzoneStatus) => void;
  status: DropzoneStatus;
}

const DropzoneContext = createContext<DropzoneContextValue | null>(null);

export function useDropzone() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<DropzoneStatus>("idle");

  return useMemo(
    () => ({
      file,
      inputRef,
      openFilePicker: () => inputRef.current?.click(),
      removeFile: () => setFile(null),
      setFile,
      status,
      setStatus,
    }),
    [file, status]
  ) as DropzoneContextValue & { setStatus: (status: DropzoneStatus) => void };
}

export function Dropzone({
  children,
  className,
  accept = "image/*,video/*,application/pdf",
  file,
  inputRef,
  openFilePicker,
  removeFile,
  setFile,
  status,
  setStatus,
}: React.PropsWithChildren<DropzoneContextValue> & {
  accept?: string;
  className?: string;
  setStatus: (status: DropzoneStatus) => void;
}) {
  return (
    <DropzoneContext.Provider
      value={{
        file,
        inputRef,
        openFilePicker,
        removeFile,
        setFile,
        status,
        setStatus,
      }}
    >
      <div
        className={cn(
          "rounded-xl border border-dashed p-4 transition-colors",
          status === "dragging" && "border-primary bg-primary/5",
          className
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          setStatus("dragging");
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setStatus("idle");
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setStatus("dragging");
        }}
        onDrop={(event) => {
          event.preventDefault();
          setStatus("idle");
          const nextFile = event.dataTransfer.files?.[0] ?? null;
          setFile(nextFile);
        }}
      >
        <input
          accept={accept}
          className="sr-only"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
          }}
          ref={inputRef}
          type="file"
        />
        {children}
      </div>
    </DropzoneContext.Provider>
  );
}

function useDropzoneContext() {
  const context = useContext(DropzoneContext);
  if (!context) {
    throw new Error("Dropzone components must be used inside <Dropzone>");
  }
  return context;
}

export function DropZoneArea({ children }: React.PropsWithChildren) {
  return <div className="space-y-4">{children}</div>;
}

export function DropzoneDescription({ children }: React.PropsWithChildren) {
  return <p className="text-muted-foreground text-sm">{children}</p>;
}

export function DropzoneMessage() {
  const { file } = useDropzoneContext();
  return file ? <p className="text-sm">Selected: {file.name}</p> : null;
}

export function DropzoneTrigger({ children }: React.PropsWithChildren) {
  const { openFilePicker } = useDropzoneContext();
  return (
    <Button onClick={openFilePicker} type="button" variant="outline">
      {children}
    </Button>
  );
}

export function DropzoneFileList({ children }: React.PropsWithChildren) {
  return <div className="flex flex-col gap-2">{children}</div>;
}

export function DropzoneFileListItem({
  children,
}: React.PropsWithChildren<{ file: File }>) {
  return <div className="rounded-md border p-3">{children}</div>;
}

export function DropzoneRemoveFile({ children }: React.PropsWithChildren) {
  const { removeFile } = useDropzoneContext();
  return (
    <Button onClick={removeFile} type="button" variant="outline">
      {children}
    </Button>
  );
}
