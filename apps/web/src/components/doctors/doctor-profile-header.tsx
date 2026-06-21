import { Avatar, Button, Card, Chip, ProgressCircle } from "@heroui/react";
import { AlertTriangle, Camera, CopyIcon } from "lucide-react";
import { useRef, useState } from "react";

export function DoctorProfileHeader({
  doctorId,
  isVerified,
  name,
  completionPercentage = 0,
}: {
  doctorId: string;
  isVerified?: boolean;
  name: string;
  completionPercentage?: number;
}) {
  const [copiedDoctorId, setCopiedDoctorId] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleCopyDoctorId = () => {
    navigator.clipboard.writeText(doctorId);
    setCopiedDoctorId(true);
    setTimeout(() => setCopiedDoctorId(false), 2000);
  };

  return (
    <Card className="border border-border/50 shadow-none">
      <Card.Content className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
        <div className="relative shrink-0">
          <ProgressCircle
            aria-label="Profile completion"
            className="size-20"
            value={completionPercentage}
          >
            <ProgressCircle.Track className="size-full">
              <ProgressCircle.TrackCircle />
              <ProgressCircle.FillCircle />
            </ProgressCircle.Track>
          </ProgressCircle>
          <div className="group absolute inset-0.5 cursor-pointer">
            <Avatar
              className="size-full rounded-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar.Image
                src={`https://api.dicebear.com/9.x/shapes/svg?seed=${name}`}
              />
              <Avatar.Fallback className="font-semibold text-2xl">
                {initials}
              </Avatar.Fallback>
            </Avatar>
            <button
              aria-label="Upload profile photo"
              className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
              type="button"
            >
              <Camera className="size-5 text-white" />
            </button>
            <input
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  // Photo upload triggered
                }
              }}
              ref={fileInputRef}
              type="file"
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-row flex-wrap items-center gap-3">
            <p className="font-semibold text-2xl tracking-tight">{name}</p>
            {isVerified ? (
              <Chip size="sm" variant="primary">
                Verified professional
              </Chip>
            ) : (
              <Chip size="sm" variant="secondary">
                <AlertTriangle className="size-3" />
                Pending verification
              </Chip>
            )}
          </div>
          <p className="max-w-2xl font-light text-muted-foreground text-sm">
            Manage your public directory listing, therapeutic credentials, and
            introductory materials.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Chip size="lg">ID: {doctorId}</Chip>
            <Button
              onPress={handleCopyDoctorId}
              size="sm"
              variant={copiedDoctorId ? "primary" : "outline"}
            >
              <CopyIcon className="size-3" />
              {copiedDoctorId ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
