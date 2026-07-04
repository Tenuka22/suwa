import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BadgeCheck,
  Calendar,
  Camera,
  CheckCircle2,
  IdCard,
  Languages,
  Loader2,
  MapPin,
  ScanFaceIcon,
  Stethoscope,
  UserCircle,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ControllerRenderProps, FieldPath } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@suwa/ui/components/form";
import { Input } from "@suwa/ui/components/input";
import { Label } from "@suwa/ui/components/label";
import { Separator } from "@suwa/ui/components/separator";
import { Textarea } from "@suwa/ui/components/textarea";
import { FaceCaptureDialog } from "@/components/face-detection";
import { client } from "@/utils/orpc";

const specialtiesOptions = [
  { value: "psychiatry", label: "Psychiatry" },
  { value: "psychology", label: "Psychology" },
  { value: "counseling", label: "Counseling" },
  { value: "family_medicine", label: "Family Medicine" },
  { value: "general_practice", label: "General Practice" },
  { value: "wellness", label: "Wellness" },
] as const;

const languageOptions = [
  { value: "english", label: "English" },
  { value: "spanish", label: "Spanish" },
  { value: "french", label: "French" },
  { value: "arabic", label: "Arabic" },
  { value: "hindi", label: "Hindi" },
  { value: "sinhala", label: "Sinhala" },
  { value: "tamil", label: "Tamil" },
] as const;

const consultationModeOptions = [
  { value: "video", label: "Video" },
  { value: "in_person", label: "In-Person" },
  { value: "chat", label: "Chat" },
] as const;

const focusAreaOptions = [
  { value: "anxiety", label: "Anxiety" },
  { value: "depression", label: "Depression" },
  { value: "stress", label: "Stress" },
  { value: "trauma", label: "Trauma" },
  { value: "sleep", label: "Sleep" },
  { value: "relationships", label: "Relationships" },
  { value: "burnout", label: "Burnout" },
  { value: "addiction", label: "Addiction" },
  { value: "parenting", label: "Parenting" },
  { value: "grief", label: "Grief" },
] as const;

const formSchema = z.object({
  displayName: z.string().min(1, "Full name is required"),
  headline: z.string(),
  bio: z.string(),
  licenseNumber: z.string(),
  experienceStartYear: z.string(),
  location: z.string(),
  specialties: z.array(z.string()).min(1, "Select at least one specialty"),
  languages: z.array(z.string()),
  consultationModes: z.array(z.string()),
  focusAreas: z.array(z.string()),
  approach: z.string(),
});

type FormValues = z.infer<typeof formSchema>;
type FormFieldRender<Name extends FieldPath<FormValues>> = {
  field: ControllerRenderProps<FormValues, Name>;
};

function CheckboxGroup({
  label,
  description,
  options,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  options: readonly { value: string; label: string }[];
  value: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <Label>{label}</Label>
        {description ? (
          <p className="mt-1 text-muted-foreground text-xs">{description}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = value.includes(opt.value);
          return (
            <button
              aria-pressed={isActive}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                isActive
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
              key={opt.value}
              onClick={() => {
                onChange(
                  isActive
                    ? value.filter((v) => v !== opt.value)
                    : [...value, opt.value]
                );
              }}
              type="button"
            >
              {isActive ? <CheckCircle2 className="size-3.5" /> : null}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ProfilePreview({ values, hasFaceEmbedding }: { values: FormValues; hasFaceEmbedding: boolean }) {
  const initials = getInitials(values?.displayName ?? "");
  const experienceYears = values?.experienceStartYear
    ? new Date().getFullYear() - parseInt(values.experienceStartYear)
    : null;

  const labelMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const g of [specialtiesOptions, languageOptions, consultationModeOptions, focusAreaOptions]) {
      for (const opt of g) {
        map[opt.value] = opt.label;
      }
    }
    return map;
  }, []);

  const steps = [
    { id: "basic", label: "Basic Info", complete: !!values.displayName },
    { id: "professional", label: "Professional", complete: !!(values.licenseNumber || values.location) },
    { id: "specialization", label: "Specialization", complete: values.specialties.length > 0 },
    { id: "approach", label: "Approach", complete: !!values.approach },
  ];
  const completedCount = steps.filter((s) => s.complete).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <Card className="sticky top-6 overflow-hidden border-border/80 bg-card/95 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Profile Preview</CardTitle>
          <Badge variant="secondary">{completedCount}/{steps.length} done</Badge>
        </div>
        <CardDescription>
          How patients will see your profile
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-background font-semibold text-lg text-primary shadow-sm ring-1 ring-primary/15">
              {initials || "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">
                {values?.displayName || (
                  <span className="text-muted-foreground/50 italic">Your Name</span>
                )}
              </p>
              <p className="truncate text-muted-foreground text-xs">
                {values?.headline || (
                  <span className="text-muted-foreground/50 italic">Headline</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-muted-foreground text-xs">
            <span>Profile completeness</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-2">
          {steps.map((step) => (
            <div
              className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs"
              key={step.id}
            >
              <div
                className={`flex size-5 items-center justify-center rounded-full ${
                  step.complete
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step.complete ? <CheckCircle2 className="size-3" /> : null}
              </div>
              <span className={step.complete ? "text-foreground" : "text-muted-foreground"}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {(values?.location || values?.licenseNumber || experienceYears) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
            {values?.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" />
                {values.location}
              </span>
            )}
            {values?.licenseNumber && (
              <span className="inline-flex items-center gap-1">
                <IdCard className="size-3" />
                {values.licenseNumber}
              </span>
            )}
            {experienceYears && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3" />
                {experienceYears} yr{experienceYears !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {values && values.specialties.length > 0 && (
          <div>
            <p className="mb-1.5 text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Specialties
            </p>
            <div className="flex flex-wrap gap-1.5">
              {values.specialties.map((s) => (
                <Badge key={s} variant="outline">
                  {labelMap[s] ?? s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {values && values.focusAreas.length > 0 && (
          <div>
            <p className="mb-1.5 text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Focus Areas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {values.focusAreas.map((f) => (
                <Badge key={f} variant="secondary">
                  {labelMap[f] ?? f}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {(values?.languages.length ?? 0) > 0 ||
        (values?.consultationModes.length ?? 0) > 0 ? (
          <div className="flex flex-wrap gap-3 text-muted-foreground text-xs">
            {values?.languages.length ? (
              <span className="inline-flex items-center gap-1">
                <Languages className="size-3" />
                {values.languages.map((l) => labelMap[l] ?? l).join(", ")}
              </span>
            ) : null}
            {values?.consultationModes.length ? (
              <span className="inline-flex items-center gap-1">
                <Video className="size-3" />
                {values.consultationModes.map((c) => labelMap[c] ?? c).join(", ")}
              </span>
            ) : null}
          </div>
        ) : null}

        {values?.bio && (
          <>
            <Separator />
            <div>
              <p className="mb-1 text-muted-foreground text-xs font-medium uppercase tracking-wider">
                About
              </p>
              <p className="line-clamp-4 text-muted-foreground text-xs leading-relaxed">
                {values.bio}
              </p>
            </div>
          </>
        )}

        {values?.approach && (
          <>
            <Separator />
            <div>
              <p className="mb-1 text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Approach
              </p>
              <p className="line-clamp-3 text-muted-foreground text-xs leading-relaxed">
                {values.approach}
              </p>
            </div>
          </>
        )}

        <Separator />

        <div className="flex items-center gap-2 rounded-lg border p-2.5">
          <div
            className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
              hasFaceEmbedding
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {hasFaceEmbedding ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <Camera className="size-4" />
            )}
          </div>
          <p className="text-xs">
            {hasFaceEmbedding ? "Face verified" : "Face verification required"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export const Route = createFileRoute("/doctor/profile")({
  component: DoctorProfile,
});

function DoctorProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasFaceEmbedding, setHasFaceEmbedding] = useState(false);
  const [faceVideoData, setFaceVideoData] = useState<{ data: string; mimeType: string } | null>(null);
  const [faceEmbedding, setFaceEmbedding] = useState<number[] | null>(null);
  const [faceVideoUrl, setFaceVideoUrl] = useState<string | null>(null);
  const [faceDialogOpen, setFaceDialogOpen] = useState(false);
  const [similarity, setSimilarity] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      headline: "",
      bio: "",
      licenseNumber: "",
      experienceStartYear: "",
      location: "",
      specialties: [],
      languages: [],
      consultationModes: [],
      focusAreas: [],
      approach: "",
    },
  });

  const formValues = form.watch();

  useEffect(() => {
    void (async () => {
      try {
        const result = await client.doctorProfile();
        const p = result.profile;
        if (p) {
          form.reset({
            displayName: p.displayName ?? "",
            headline: p.headline ?? "",
            bio: p.bio ?? "",
            licenseNumber: p.licenseNumber ?? "",
            experienceStartYear: p.experienceStartYear
              ? String(p.experienceStartYear)
              : "",
            location: p.location ?? "",
            specialties: p.specialties ?? [],
            languages: p.languages ?? [],
            consultationModes: p.consultationModes ?? [],
            focusAreas: p.focusAreas ?? [],
            approach: p.approach ?? "",
          });
          setHasFaceEmbedding(p.hasFaceEmbedding);

          if (p.hasFaceEmbedding) {
            const [video, embedding] = await Promise.allSettled([
              client.myFaceVideo(),
              client.myFaceEmbedding(),
            ]);
            if (video.status === "fulfilled" && video.value) {
              setFaceVideoData(video.value as { data: string; mimeType: string });
            }
            if (embedding.status === "fulfilled" && embedding.value) {
              setFaceEmbedding(embedding.value);
            }
          }
        }
      } catch {
        // No profile yet
      }
      setLoading(false);
    })();
  }, [form]);

  function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  const handleVerificationCapture = async (
    newEmbedding: number[],
    _snapshot: string,
    _videoBase64?: string
  ) => {
    if (!faceEmbedding) return;
    const score = cosineSimilarity(newEmbedding, faceEmbedding);
    setSimilarity(score);
    setFaceDialogOpen(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const data = form.getValues();
      const input: Record<string, unknown> = {};
      if (data.displayName) input.displayName = data.displayName;
      if (data.headline) input.headline = data.headline;
      if (data.bio) input.bio = data.bio;
      if (data.licenseNumber) input.licenseNumber = data.licenseNumber;
      if (data.location) input.location = data.location;
      if (data.experienceStartYear)
        input.experienceStartYear = parseInt(data.experienceStartYear);
      if (data.specialties.length > 0) input.specialties = data.specialties;
      if (data.languages.length > 0) input.languages = data.languages;
      if (data.consultationModes.length > 0) input.consultationModes = data.consultationModes;
      if (data.focusAreas.length > 0) input.focusAreas = data.focusAreas;
      if (data.approach) input.approach = data.approach;

      await client.saveDoctorProfile(input);
      toast.success("Profile saved successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!faceVideoData) {
      setFaceVideoUrl(null);
      return;
    }

    const url = `data:${faceVideoData.mimeType};base64,${faceVideoData.data}`;
    setFaceVideoUrl(url);
  }, [faceVideoData]);

  if (loading) {
    return (
      <div className="flex size-full items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Loader2 className="size-7 animate-spin text-primary" />
            <p className="font-medium">Loading profile</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex size-full flex-col items-center p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-6xl">
        <div className="mb-6">
          <h1 className="font-bold text-2xl">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your public profile information
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Form {...form}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <UserCircle className="size-4" />
                    </div>
                    <CardTitle className="text-base">Basic Information</CardTitle>
                  </div>
                  <CardDescription>Your public profile details</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }: FormFieldRender<"displayName">) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Dr. Jane Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="headline"
                    render={({ field }: FormFieldRender<"headline">) => (
                      <FormItem>
                        <FormLabel>Headline</FormLabel>
                        <FormControl>
                          <Input placeholder="Licensed Clinical Psychologist" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }: FormFieldRender<"bio">) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            className="min-h-24 resize-y"
                            placeholder="Tell patients about yourself..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <IdCard className="size-4" />
                    </div>
                    <CardTitle className="text-base">Professional Details</CardTitle>
                  </div>
                  <CardDescription>Your credentials and specialization</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="licenseNumber"
                      render={({ field }: FormFieldRender<"licenseNumber">) => (
                        <FormItem>
                          <FormLabel>License Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. MED-12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="experienceStartYear"
                      render={({ field }: FormFieldRender<"experienceStartYear">) => (
                        <FormItem>
                          <FormLabel>Experience Start Year</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 2015" type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }: FormFieldRender<"location">) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="City, Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Stethoscope className="size-4" />
                    </div>
                    <CardTitle className="text-base">Specialization</CardTitle>
                  </div>
                  <CardDescription>Your areas of practice</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <FormField
                    control={form.control}
                    name="specialties"
                    render={({ field }: FormFieldRender<"specialties">) => (
                      <FormItem>
                        <CheckboxGroup
                          description="Choose the primary disciplines patients should find you under."
                          label="Specialties *"
                          onChange={field.onChange}
                          options={specialtiesOptions}
                          value={field.value}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="focusAreas"
                    render={({ field }: FormFieldRender<"focusAreas">) => (
                      <FormItem>
                        <CheckboxGroup
                          description="Pick the concerns you are most comfortable supporting."
                          label="Focus Areas"
                          onChange={field.onChange}
                          options={focusAreaOptions}
                          value={field.value}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="consultationModes"
                    render={({ field }: FormFieldRender<"consultationModes">) => (
                      <FormItem>
                        <CheckboxGroup
                          description="Set expectations for how patients can meet with you."
                          label="Consultation Modes"
                          onChange={field.onChange}
                          options={consultationModeOptions}
                          value={field.value}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="languages"
                    render={({ field }: FormFieldRender<"languages">) => (
                      <FormItem>
                        <CheckboxGroup
                          description="Languages you can confidently use during consultation."
                          label="Languages"
                          onChange={field.onChange}
                          options={languageOptions}
                          value={field.value}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <BadgeCheck className="size-4" />
                    </div>
                    <CardTitle className="text-base">Your Approach</CardTitle>
                  </div>
                  <CardDescription>Describe your therapeutic approach</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="approach"
                    render={({ field }: FormFieldRender<"approach">) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            className="min-h-24 resize-y"
                            placeholder="Describe your approach to patient care..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </Form>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Camera className="size-4" />
                  </div>
                  <CardTitle className="text-base">Face Verification</CardTitle>
                  <Badge
                    className={
                      hasFaceEmbedding
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }
                    variant={hasFaceEmbedding ? "secondary" : "outline"}
                  >
                    {hasFaceEmbedding ? "Verified" : "Pending"}
                  </Badge>
                </div>
                <CardDescription>
                  {hasFaceEmbedding
                    ? "Compare your current face against the stored embedding to verify your identity"
                    : "Complete face verification on the verification page first."}
                </CardDescription>
              </CardHeader>
              {hasFaceEmbedding ? (
                <CardContent className="flex flex-col gap-4">
                  <div>
                    <p className="mb-2 font-medium text-sm">Recorded Face Video</p>
                    {faceVideoUrl ? (
                      <video
                        className="w-full rounded-lg border"
                        controls
                        ref={videoRef}
                        src={faceVideoUrl}
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed bg-muted/30 text-muted-foreground text-sm">
                        No video available
                      </div>
                    )}
                  </div>

                  {similarity !== null ? (
                    <div className="rounded-xl border p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                            similarity > 0.7
                              ? "bg-emerald-500/10 text-emerald-500"
                              : similarity > 0.5
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          <ScanFaceIcon className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">Verification Result</p>
                          <p className="mt-0.5 text-2xl font-bold tracking-tight">
                            {(similarity * 100).toFixed(1)}%
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {similarity > 0.7
                              ? "Your face matches, identity confirmed"
                              : similarity > 0.5
                                ? "Partial match, some differences detected"
                                : "Low match, this may not be the same person"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => setFaceDialogOpen(true)}
                      variant="outline"
                    >
                      <ScanFaceIcon className="size-4" />
                      Verify your face
                    </Button>
                    {similarity !== null ? (
                      <Button
                        onClick={() => {
                          setSimilarity(null);
                          setFaceDialogOpen(true);
                        }}
                        variant="ghost"
                      >
                        Retry
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              ) : (
                <CardAction>
                  <Button asChild variant="outline">
                    <a href="/doctor/verification">
                      <Camera className="size-4" />
                      Go to verification
                    </a>
                  </Button>
                </CardAction>
              )}
            </Card>
            <FaceCaptureDialog
              onFaceCaptured={handleVerificationCapture}
              onOpenChange={setFaceDialogOpen}
              open={faceDialogOpen}
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Save Changes</CardTitle>
                <CardDescription>
                  Your profile updates will be visible to patients immediately after saving.
                </CardDescription>

                <CardAction>
                  <Button
                    className="w-full sm:w-auto"
                    disabled={saving}
                    onClick={handleSaveProfile}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save profile"
                    )}
                  </Button>
                </CardAction>
              </CardHeader>
            </Card>
          </div>

          <div className="hidden lg:block">
            <ProfilePreview hasFaceEmbedding={hasFaceEmbedding} values={formValues} />
          </div>
        </div>
      </div>
    </div>
  );
}
