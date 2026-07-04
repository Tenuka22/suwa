import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowUpRight,
  BadgeCheck,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  IdCard,
  Languages,
  Loader2,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  UserCircle,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ControllerRenderProps, FieldPath } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { Badge } from "@suwa/ui/components/badge";
import { Button } from "@suwa/ui/components/button";
import {
  Card,
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

function SectionCheck({ complete }: { complete: boolean }) {
  if (!complete) return null;
  return (
    <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 font-medium text-[11px] text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="size-3" />
      Complete
    </span>
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

function DoctorPreview({
  values,
  faceEmbedding,
  steps,
  completedCount,
  progressPercent,
}: {
  values: FormValues;
  faceEmbedding: number[] | null;
  steps: { id: string; label: string; complete: boolean }[];
  completedCount: number;
  progressPercent: number;
}) {
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

  return (
    <Card className="sticky top-36 overflow-hidden border-border/80 bg-card/95 shadow-sm">
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
          {faceEmbedding && (
            <BadgeCheck className="ml-auto size-5 shrink-0 text-primary" />
          )}
          </div>
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

        <div>
          <div className="mb-1.5 flex items-center justify-between text-muted-foreground text-xs">
            <span>Overall progress</span>
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

        <div className="flex items-center gap-2 rounded-lg border p-2.5">
          <div
            className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
              faceEmbedding
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {faceEmbedding ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <Camera className="size-4" />
            )}
          </div>
          <p className="text-xs">
            {faceEmbedding ? "Face verified" : "Face verification required"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export const Route = createFileRoute("/doctor/verification")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (session?.user && "role" in session.user && session.user.role === "doctor") {
      throw redirect({ to: "/doctor" });
    }
  },
  component: DoctorVerification,
});

function DoctorVerification() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [faceDialogOpen, setFaceDialogOpen] = useState(false);
  const [faceEmbedding, setFaceEmbedding] = useState<number[] | null>(null);
  const [capturedFaceSnapshot, setCapturedFaceSnapshot] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

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

  const hasAllFields = formValues.displayName.trim().length > 0 && formValues.specialties.length > 0;

  const steps = [
    {
      id: "basic",
      label: "Basic Info",
      icon: UserCircle,
      complete: !!formValues.displayName,
    },
    {
      id: "professional",
      label: "Professional",
      icon: IdCard,
      complete: !!(formValues.licenseNumber || formValues.location),
    },
    {
      id: "specialization",
      label: "Specialization",
      icon: Stethoscope,
      complete: formValues.specialties.length > 0,
    },
    {
      id: "approach",
      label: "Approach",
      icon: ArrowUpRight,
      complete: !!formValues.approach,
    },
    {
      id: "verification",
      label: "Face ID",
      icon: Camera,
      complete: !!faceEmbedding,
    },
  ];

  const formCompleted = steps.filter((s) => s.complete).length;
  const ACCOUNT_WEIGHT = 20;
  const progressPercent = Math.round(
    ACCOUNT_WEIGHT + (formCompleted / steps.length) * (100 - ACCOUNT_WEIGHT)
  );

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
          setFaceEmbedding(p.hasFaceEmbedding ? [1] : null);
          if (p.permanent) {
            navigate({ to: "/doctor" });
            return;
          }
        }
      } catch {
        // No profile yet
      }
      setLoading(false);
    })();
  }, [form, navigate]);

  const handleSaveProfile = async () => {
    const data = form.getValues();
    try {
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
      throw err;
    }
  };

  const handleFaceCaptured = async (embedding: number[], snapshot: string) => {
    try {
      await client.saveFaceEmbedding({ embedding });
      setFaceEmbedding(embedding);
      setCapturedFaceSnapshot(snapshot);
      toast.success("Face verification complete");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save face embedding"
      );
      throw err;
    }
  };

  const handleSubmitForReview = async () => {
    setSaving(true);
    try {
      await handleSaveProfile();
      if (faceEmbedding) {
        setSubmitted(true);
        toast.success("Your profile has been submitted for review");
      }
    } catch {
      // Error already handled in handleSaveProfile
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex size-full items-center justify-center bg-muted p-6">
        <Card className="w-full max-w-sm border-border/80 bg-card/95 shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Loader2 className="size-7 animate-spin" />
            </div>
            <div>
              <p className="font-medium">Loading verification</p>
              <p className="mt-1 text-muted-foreground text-sm">
                Checking your existing doctor profile.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex size-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.12),_hsl(var(--muted))_40%)] p-6 md:p-10">
        <Card className="w-full max-w-md overflow-hidden border-border/80 bg-card/95 shadow-lg">
          <CardHeader className="flex justify-center flex-col items-center text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-3xl bg-amber-500/10">
              <Clock className="size-8 text-amber-500" />
            </div>
            <CardTitle>Verification in Progress</CardTitle>
            <CardDescription>
              Your doctor profile has been submitted and is being reviewed by our team.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="size-4 animate-spin" />
              <span>Waiting for admin approval</span>
            </div>
            <p className="text-muted-foreground text-xs">
              This usually takes 1–2 business days. You'll have full access to
              the Doctor Hub once your profile is approved.
            </p>
            <Button className="mt-2 w-full" disabled variant="outline">
              Verification Pending
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex size-full flex-col items-center overflow-y-auto scroll-smooth bg-[radial-gradient(circle_at_top_left,_hsl(var(--primary)/0.10),_transparent_34rem),linear-gradient(180deg,_hsl(var(--muted)),_hsl(var(--background)))] p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-6xl">
        <div className="mb-6 overflow-hidden rounded-[2rem] border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur md:p-7">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <div>
              <Badge className="mb-4 gap-1.5" variant="secondary">
                <ShieldCheck className="size-3.5" />
                Doctor onboarding
              </Badge>
              <h1 className="max-w-2xl font-semibold text-2xl tracking-tight md:text-4xl">
                Complete your verification profile
              </h1>
              <p className="mt-3 max-w-2xl text-muted-foreground text-sm leading-relaxed md:text-base">
                Add the essentials patients and admins need to trust your profile. You can save progress, capture your face, and submit when the required checks are complete.
              </p>
            </div>

            <div className="rounded-2xl border bg-background/80 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Application readiness</span>
                <span className="text-muted-foreground">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-muted-foreground">Completed</p>
                  <p className="mt-1 font-semibold text-lg">{formCompleted}/{steps.length}</p>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-muted-foreground">Face ID</p>
                  <p className="mt-1 font-semibold text-sm">
                    {faceEmbedding ? "Verified" : "Pending"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky top-0 z-10 -mx-4 mb-6 border-y bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:-mx-10 md:px-10">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldAlert className="size-4" />
              </div>
              <p className="truncate font-medium text-sm">Verification checklist</p>
            </div>
            <Badge variant={progressPercent === 100 ? "default" : "outline"}>
              {progressPercent}% complete
            </Badge>
          </div>

          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {steps.map((step) => {
              const StepIcon = step.icon;
              return (
                <button
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all ${
                    step.complete
                      ? "border-primary/30 bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground/30"
                  }`}
                  key={step.id}
                  onClick={() => scrollToSection(step.id)}
                  type="button"
                >
                  {step.complete ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <StepIcon className="size-3.5" />
                  )}
                  {step.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Form {...form}>
              <Card className="scroll-mt-40 border-border/80 bg-card/95 shadow-sm" id="basic">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <UserCircle className="size-4" />
                    </div>
                    <CardTitle className="text-base">Basic Information</CardTitle>
                    <SectionCheck complete={steps[0].complete} />
                  </div>
                  <CardDescription>
                    Your public profile details
                  </CardDescription>
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
                            placeholder="Tell patients about yourself, your approach, and what they can expect..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="scroll-mt-40 border-border/80 bg-card/95 shadow-sm" id="professional">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <IdCard className="size-4" />
                    </div>
                    <CardTitle className="text-base">
                      Professional Details
                    </CardTitle>
                    <SectionCheck complete={steps[1].complete} />
                  </div>
                  <CardDescription>
                    Your credentials and specialization
                  </CardDescription>
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

              <Card className="scroll-mt-40 border-border/80 bg-card/95 shadow-sm" id="specialization">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Stethoscope className="size-4" />
                    </div>
                    <CardTitle className="text-base">Specialization</CardTitle>
                    <SectionCheck complete={steps[2].complete} />
                  </div>
                  <CardDescription>
                    Your areas of practice
                  </CardDescription>
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

              <Card className="scroll-mt-40 border-border/80 bg-card/95 shadow-sm" id="approach">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <ArrowUpRight className="size-4" />
                    </div>
                    <CardTitle className="text-base">Your Approach</CardTitle>
                    <SectionCheck complete={steps[3].complete} />
                  </div>
                  <CardDescription>
                    Describe your therapeutic approach and methods
                  </CardDescription>
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

            <Card className="scroll-mt-40 border-border/80 bg-card/95 shadow-sm" id="verification">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Camera className="size-4" />
                  </div>
                  <CardTitle className="text-base">
                    Face Verification
                  </CardTitle>
                  <SectionCheck complete={steps[4].complete} />
                </div>
                <CardDescription>
                  A face scan is required to verify your identity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`overflow-hidden rounded-2xl border ${
                    faceEmbedding ? "border-emerald-500/25 bg-emerald-500/5" : "bg-card"
                  }`}
                >
                  <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_220px]">
                    <div className="flex flex-col justify-between gap-4 p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
                            faceEmbedding
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {faceEmbedding ? (
                            <CheckCircle2 className="size-5" />
                          ) : (
                            <Camera className="size-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-sm">
                              {faceEmbedding
                                ? "Face captured and verified"
                                : "Capture your face to verify identity"}
                            </p>
                            {faceEmbedding ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400" variant="secondary">
                                Verified
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
                            {faceEmbedding
                              ? capturedFaceSnapshot
                                ? "Review the captured image before submitting your profile. You can retake it if needed."
                                : "A face verification is already saved for this profile. You can update it if needed."
                              : "Use a well-lit space, face the camera directly, and keep your head inside the frame."}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Button
                          className="sm:w-fit"
                          onClick={() => setFaceDialogOpen(true)}
                          variant={faceEmbedding ? "outline" : "default"}
                        >
                          <Camera className="size-4" />
                          {faceEmbedding ? "Retake face capture" : "Open face capture"}
                        </Button>
                        <p className="text-muted-foreground text-xs">
                          {faceDialogOpen
                            ? "Camera dialog is open."
                            : faceEmbedding
                              ? "Ready for profile review."
                              : "Required before submission."}
                        </p>
                      </div>
                    </div>

                    <div className="border-t bg-muted/40 p-4 md:border-l md:border-t-0">
                      {capturedFaceSnapshot ? (
                        <div className="relative overflow-hidden rounded-xl border bg-black">
                          <img
                            alt="Captured face verification"
                            className="aspect-[4/3] w-full object-cover"
                            src={capturedFaceSnapshot}
                          />
                          <div className="absolute right-2 top-2 rounded-full bg-emerald-500/90 px-2 py-1 font-medium text-[10px] text-white">
                            Captured
                          </div>
                        </div>
                      ) : (
                        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-background text-center">
                          {faceEmbedding ? (
                            <CheckCircle2 className="size-8 text-emerald-500" />
                          ) : (
                            <Camera className="size-8 text-muted-foreground" />
                          )}
                          <p className="max-w-36 text-muted-foreground text-xs">
                            {faceEmbedding
                              ? "Verification is saved"
                              : "Captured face preview appears here"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="sticky bottom-4 z-10 pb-8">
              <div className="rounded-2xl border bg-card/95 p-3 shadow-lg backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${
                        hasAllFields && faceEmbedding
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {hasAllFields && faceEmbedding ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <ShieldAlert className="size-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {hasAllFields && faceEmbedding
                          ? "Ready to submit"
                          : "Finish required steps"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {!hasAllFields
                          ? "Add your full name and select at least one specialty."
                          : !faceEmbedding
                            ? "Complete face verification to continue."
                            : "Your profile will be reviewed by an admin before full access is enabled."}
                      </p>
                    </div>
                  </div>

                  <Button
                    className="sm:min-w-44"
                    disabled={!hasAllFields || !faceEmbedding || saving}
                    onClick={() => void handleSubmitForReview()}
                    size="lg"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Submit for Review
                        <ChevronRight className="size-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <DoctorPreview
              completedCount={formCompleted}
              faceEmbedding={faceEmbedding}
              progressPercent={progressPercent}
              steps={steps}
              values={formValues}
            />
          </div>
        </div>
      </div>

      <FaceCaptureDialog
        onFaceCaptured={(embedding, snapshot) => handleFaceCaptured(embedding, snapshot)}
        onOpenChange={setFaceDialogOpen}
        open={faceDialogOpen}
      />
    </div>
  );
}
