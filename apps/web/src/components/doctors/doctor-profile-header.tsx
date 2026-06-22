import { Avatar, Button, Card, Chip, Label, ProgressCircle } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, CopyIcon, ExternalLinkIcon } from "lucide-react";
import { useState } from "react";

export function DoctorProfileHeader({
  doctorId,
  isVerified,
  name,
  completionPercentage = 0,
  isPending = false,
  portraitUrl,
}: {
  doctorId: string;
  isVerified?: boolean;
  name: string;
  completionPercentage?: number;
  isPending?: boolean;
  portraitUrl?: string | null;
}) {
  const navigate = useNavigate();
  const [copiedDoctorId, setCopiedDoctorId] = useState(false);

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
    <Card>
      <Card.Content className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative shrink-0">
          <Avatar
            size="lg"
            >
              {portraitUrl ? (
                <Avatar.Image src={portraitUrl} />
              ) : (
                <Avatar.Image src={`https://api.dicebear.com/9.x/shapes/svg?seed=${name}`} />
              )}
              <Avatar.Fallback className="font-semibold text-2xl">
                {initials}
              </Avatar.Fallback>
            </Avatar>
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex flex-row flex-wrap items-center gap-2">
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
            {isPending ? (
              <Button
                onPress={() => navigate({ to: "/admin/doc-requests", search: { page: 1, query: "" } })}
                size="sm"
                variant="outline"
              >
                <ExternalLinkIcon className="size-3" />
                View Request
              </Button>
            ) : null}
          </div>
          <p className="max-w-2xl font-light text-muted-foreground text-sm">
            Manage your public directory listing, therapeutic credentials, and
            introductory materials.
          </p>
          <div className="flex items-center gap-2 pt-2">

            <Chip size="lg">{doctorId}</Chip>
            <Button
              onPress={handleCopyDoctorId}
              size="sm"
              variant={copiedDoctorId ? "secondary" : "outline"}
            >
              <CopyIcon className="size-3" />
              {copiedDoctorId ? "Copied" : "Copy"}
            </Button>

            <div className="flex items-center gap-3">
              <ProgressCircle
                size="sm"
                aria-label="Profile completion"
                value={completionPercentage}
              >
                  <ProgressCircle.Track>
                    <ProgressCircle.TrackCircle />
                    <ProgressCircle.FillCircle />
                  </ProgressCircle.Track>
                </ProgressCircle>
              <Label>{ completionPercentage}% Complete</Label>
              </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
