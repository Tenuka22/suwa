import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  BadgeCheckIcon,
  CameraIcon,
  CircleAlertIcon,
  FingerprintIcon,
  Loader2Icon,
  ShieldCheckIcon,
  StethoscopeIcon,
  UserCircleIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { client } from "@/utils/orpc";
import { Alert, AlertDescription, AlertTitle } from "@suwa/ui/components/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@suwa/ui/components/alert-dialog";
import { Badge } from "@suwa/ui/components/badge";
import { Button } from "@suwa/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@suwa/ui/components/card";
import { Progress } from "@suwa/ui/components/progress";

export const Route = createFileRoute("/admin/doctor/requests/$doctorId")({
  loader: async ({ params }) => {
    const doctor = await client.doctorRequest({ userId: params.doctorId });
    const faceVideo = await client
      .getFaceVideo({ userId: params.doctorId })
      .catch(() => null);

    return { doctor, faceVideo };
  },
  component: AdminDoctorRequestDetailRoute,
});

const REQUESTS_SEARCH = {
  page: 1,
  perPage: 10,
  query: "",
  sortBy: "name",
  sortDirection: "asc",
} as const;

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function FieldValue({
  label,
  value,
  required = false,
}: {
  label: string;
  value: unknown;
  required?: boolean;
}) {
  const displayValue = Array.isArray(value) ? value.join(", ") : value;
  const isEmpty = !displayValue;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-muted-foreground text-sm">{label}</p>
      {isEmpty ? (
        <Badge className="w-fit" variant={required ? "destructive" : "outline"}>
          {required ? "Missing" : "Not provided"}
        </Badge>
      ) : (
        <p className="font-medium text-sm">{String(displayValue)}</p>
      )}
    </div>
  );
}

function BadgeList({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-sm">{label}</p>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <Badge key={value} variant="outline">
              {formatLabel(value)}
            </Badge>
          ))}
        </div>
      ) : (
        <Badge className="w-fit" variant="outline">Not provided</Badge>
      )}
    </div>
  );
}

function ReviewStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserCircleIcon;
  label: string;
  value: string | number;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
        <CardAction>
          <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon />
          </div>
        </CardAction>
      </CardHeader>
    </Card>
  );
}

function EmbeddingVisualization({ values }: { values: number[] }) {
  if (values.length === 0) {
    return <p className="text-muted-foreground text-sm">No embedding sample available.</p>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const normalized = values.map((value) => (value - min) / range);

  return (
    <div className="grid gap-3">
      <div className="flex h-28 items-end gap-1 rounded-md border bg-muted/30">
        {normalized.map((value, index) => (
          <div
            aria-label={`Embedding value ${index + 1}`}
            className="min-h-1 flex-1 rounded-sm bg-primary/70"
            key={index}
            style={{ height: `${Math.max(value * 100, 4)}%` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <FieldValue label="Sample values" value={values.length} />
        <FieldValue label="Min" value={min.toFixed(4)} />
        <FieldValue label="Max" value={max.toFixed(4)} />
      </div>
    </div>
  );
}

function AdminDoctorRequestDetailRoute() {
  const router = useRouter();
  const navigate = Route.useNavigate();
  const { doctor, faceVideo } = Route.useLoaderData();
  const [approving, setApproving] = useState(false);
  const [faceVideoUrl, setFaceVideoUrl] = useState<string | null>(null);

  const displayName = doctor.displayName ?? doctor.name ?? "Doctor";
  const initials = getInitials(displayName);
  const specialties = Array.isArray(doctor.specialties) ? doctor.specialties : [];
  const languages = Array.isArray(doctor.languages) ? doctor.languages : [];
  const focusAreas = Array.isArray(doctor.focusAreas) ? doctor.focusAreas : [];
  const consultationModes = Array.isArray(doctor.consultationModes)
    ? doctor.consultationModes
    : [];
  const embeddingPreview = Array.isArray(doctor.faceEmbeddingPreview)
    ? doctor.faceEmbeddingPreview
    : [];
  const embeddingDimension = doctor.faceEmbeddingDimension ?? 0;

  const blockers = useMemo(() => {
    const issues: string[] = [];
    if (!doctor.licenseNumber) issues.push("License number is missing");
    if (specialties.length === 0) issues.push("No specialties listed");
    if (!doctor.hasFaceEmbedding) issues.push("Face embedding was not captured");
    if (!faceVideo) issues.push("No face verification video on file");
    return issues;
  }, [doctor.licenseNumber, doctor.hasFaceEmbedding, faceVideo, specialties.length]);

  useEffect(() => {
    if (!faceVideo) {
      setFaceVideoUrl(null);
      return;
    }

    const url = URL.createObjectURL(faceVideo);
    setFaceVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [faceVideo]);

  async function handleApprove() {
    setApproving(true);
    try {
      await client.approveDoctor({ userId: doctor.userId });
      toast.success("Doctor approved");
      await router.invalidate();
      await navigate({ search: REQUESTS_SEARCH, to: "/admin/doctor/requests" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve doctor");
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full border bg-muted font-semibold text-lg">
              {initials || "DR"}
            </div>
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Doctor request</Badge>
                <Badge variant="secondary">Pending approval</Badge>
                {doctor.hasFaceEmbedding ? (
                  <Badge>
                    <BadgeCheckIcon />
                    Face verified
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <CircleAlertIcon />
                    Face missing
                  </Badge>
                )}
              </div>
              <div>
                <CardTitle className="text-2xl">{displayName}</CardTitle>
                <CardDescription className="mt-1 max-w-2xl">
                  {doctor.headline ?? "No headline provided."}
                </CardDescription>
              </div>
              <code className="w-fit rounded-md bg-muted font-mono text-muted-foreground text-xs">
                ID: {doctor.userId}
              </code>
            </div>
          </div>
          <CardAction>
            <div className="flex flex-wrap gap-2">
              <Button render={<Link search={REQUESTS_SEARCH} to="/admin/doctor/requests" />} variant="outline">
                <ArrowLeftIcon />
                Back
              </Button>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button disabled={approving}>
                      {approving ? <Loader2Icon className="animate-spin" /> : null}
                      Approve doctor
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve {displayName}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This grants the doctor a live profile on the platform.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  {blockers.length > 0 ? (
                    <Alert variant="destructive">
                      <AlertTriangleIcon />
                      <AlertTitle>{blockers.length} issue{blockers.length > 1 ? "s" : ""} found</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc pl-4">
                          {blockers.map((issue) => (
                            <li key={issue}>{issue}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleApprove}>
                      {blockers.length > 0 ? "Approve anyway" : "Confirm approval"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardAction>
        </CardHeader>
      </Card>

      {blockers.length > 0 ? (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>Review needed before approval</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {blockers.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <BadgeCheckIcon />
          <AlertTitle>Ready for approval</AlertTitle>
          <AlertDescription>All required review signals are present.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReviewStat icon={UserCircleIcon} label="Profile completeness" value={`${doctor.completeness}%`} />
        <ReviewStat icon={StethoscopeIcon} label="Specialties" value={specialties.length} />
        <ReviewStat icon={CameraIcon} label="Face video" value={faceVideo ? "Stored" : "Missing"} />
        <ReviewStat icon={FingerprintIcon} label="Embedding dimensions" value={embeddingDimension} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile data</CardTitle>
              <CardDescription>Core fields submitted by the doctor.</CardDescription>
              <CardAction>
                <Badge variant={doctor.completeness >= 80 ? "secondary" : "outline"}>
                  {doctor.completeness}% complete
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FieldValue label="Full name" value={displayName} required />
              <FieldValue label="Email" value={doctor.email} />
              <FieldValue label="License number" value={doctor.licenseNumber} required />
              <FieldValue label="Experience start year" value={doctor.experienceStartYear} />
              <FieldValue label="Location" value={doctor.location} />
              <FieldValue label="Place name" value={doctor.placeName} />
              <div className="md:col-span-2">
                <Progress value={doctor.completeness} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Practice scope</CardTitle>
              <CardDescription>What the doctor says they can support.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <BadgeList label="Specialties" values={specialties} />
              <BadgeList label="Focus areas" values={focusAreas} />
              <BadgeList label="Languages" values={languages} />
              <BadgeList label="Consultation modes" values={consultationModes} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Written profile</CardTitle>
              <CardDescription>Long-form content that patients may see.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FieldValue label="Bio" value={doctor.bio} />
              <FieldValue label="Approach" value={doctor.approach} />
              <FieldValue label="Education" value={doctor.education} />
              <FieldValue label="Place address" value={doctor.placeAddress} />
              <div className="md:col-span-2">
                <FieldValue label="Place description" value={doctor.placeDescription} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Face verification</CardTitle>
              <CardDescription>Captured identity evidence for this request.</CardDescription>
              <CardAction>
                <Badge variant={faceVideo && doctor.hasFaceEmbedding ? "secondary" : "destructive"}>
                  {faceVideo && doctor.hasFaceEmbedding ? "Complete" : "Incomplete"}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border bg-muted">
                {faceVideoUrl ? (
                  <video className="size-full object-cover" controls src={faceVideoUrl} />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <CameraIcon />
                    <p className="text-sm">No face video stored</p>
                  </div>
                )}
              </div>
              <div className="grid gap-3">
                <FieldValue label="Face embedding" value={doctor.hasFaceEmbedding ? "Stored" : ""} required />
                <FieldValue label="Video file" value={faceVideo ? faceVideo.name : ""} required />
                <FieldValue label="Embedding key" value={doctor.faceEmbeddingKvKey} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Embedding visualization</CardTitle>
              <CardDescription>Normalized sample from the stored embedding vector.</CardDescription>
              <CardAction>
                <Badge variant="outline">
                  <ShieldCheckIcon />
                  {embeddingDimension} dims
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <EmbeddingVisualization values={embeddingPreview} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
