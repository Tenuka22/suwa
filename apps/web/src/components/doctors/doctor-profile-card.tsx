import { useUser } from "@clerk/tanstack-react-start";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  doctorConsultationModeValues,
  doctorFocusAreaValues,
  doctorLanguageValues,
  doctorSpecialtyValues,
} from "@zen-doc/db/doctor-profile";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@zen-doc/ui/components/avatar";
import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";
import { Checkbox } from "@zen-doc/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@zen-doc/ui/components/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@zen-doc/ui/components/field";
import { Input } from "@zen-doc/ui/components/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@zen-doc/ui/components/tabs";
import { Textarea } from "@zen-doc/ui/components/textarea";
import { cn } from "@zen-doc/ui/lib/utils";
import {
  Award,
  Building,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  GripVertical,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  consultationModeLabels,
  type DoctorConsultationMode,
  type DoctorFocusArea,
  type DoctorLanguage,
  type DoctorSpecialty,
  focusAreaLabels,
  languageLabels,
  specialtyLabels,
} from "@/utils/doctor/profile-labels";
import {
  type ApproachStep,
  type EducationRow,
  parseApproachSteps,
  parseEducationRows,
} from "@/utils/doctor/profile-utils";
import { orpc } from "@/utils/orpc";
import { SummaryBlock, SummaryItem } from "./summary-components";

const doctorProfileFormSchema = z.object({
  displayName: z.preprocess(
    emptyToUndefined,
    z.string().trim().min(2).max(100).optional()
  ),
  headline: z.preprocess(
    emptyToUndefined,
    z.string().trim().min(2).max(140).optional()
  ),
  bio: z.preprocess(emptyToUndefined, z.string().trim().max(500).optional()),
  licenseNumber: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(64).optional()
  ),
  location: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(120).optional()
  ),
  placeName: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(120).optional()
  ),
  placeAddress: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(240).optional()
  ),
  placeDescription: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(500).optional()
  ),
  experienceStartYear: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1900).max(2100).optional()
  ),
  specialties: z.array(z.enum(doctorSpecialtyValues)).max(5).default([]),
  languages: z.array(z.enum(doctorLanguageValues)).max(8).default([]),
  consultationModes: z
    .array(z.enum(doctorConsultationModeValues))
    .max(3)
    .default([]),
  focusAreas: z.array(z.enum(doctorFocusAreaValues)).max(10).default([]),
});

type DoctorProfileFormInput = z.input<typeof doctorProfileFormSchema>;
type DoctorProfileFormValues = z.output<typeof doctorProfileFormSchema>;

export function DoctorProfileCard() {
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [approachSteps, setApproachSteps] = useState<ApproachStep[]>([]);
  const [educationRows, setEducationRows] = useState<EducationRow[]>([]);
  const [draggedStepIndex, setDraggedStepIndex] = useState<number | null>(null);

  const doctorProfileQuery = useQuery(orpc.doctorProfile.queryOptions());

  const saveDoctorProfile = useMutation(
    orpc.saveDoctorProfile.mutationOptions({
      onSuccess: async () => {
        await doctorProfileQuery.refetch();
        setOpen(false);
        toast.success("Doctor profile updated");
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Save failed");
      },
    })
  );

  const profile = doctorProfileQuery.data?.profile;
  const form = useForm<
    DoctorProfileFormInput,
    undefined,
    DoctorProfileFormValues
  >({
    resolver: zodResolver(doctorProfileFormSchema),
    defaultValues: getDoctorProfileFormValues(profile ?? null),
  });

  useEffect(() => {
    form.reset(getDoctorProfileFormValues(profile ?? null));
    setApproachSteps(parseApproachSteps(profile?.approachSteps ?? null));
  }, [form, profile]);

  useEffect(() => {
    if (open && educationRows.length === 0) {
      setEducationRows(parseEducationRows(profile?.education ?? null));
    }
  }, [educationRows.length, open, profile]);

  const submitProfile = form.handleSubmit(
    (values) => {
      saveDoctorProfile.mutate({
        ...values,
        approachSteps,
        educationEntries: educationRows
          .filter((row) => row.institution.trim() && row.degree.trim())
          .map((row) => ({
            id: row.id,
            institution: row.institution.trim(),
            degree: row.degree.trim(),
            year: row.year ? Number(row.year) : null,
          })),
      });
    },
    (errors) => {
      const messages = Object.entries(errors)
        .map(([field, error]) => {
          const message =
            typeof error?.message === "string" ? error.message : null;

          if (!message) {
            return null;
          }

          return `${doctorProfileFieldLabels[field as keyof typeof doctorProfileFieldLabels]}: ${message}`;
        })
        .filter((message): message is string => message !== null);

      toast.error(
        messages.length > 0
          ? `Please fix these fields: ${messages.join(", ")}`
          : "Please fill in the missing or invalid fields."
      );
    }
  );

  const displayName = profile
    ? (profile.displayName ?? profile.licenseNumber ?? "Doctor")
    : "Unknown";
  const specialties = (profile?.specialties ?? []) as DoctorSpecialty[];
  const languages = (profile?.languages ?? []) as DoctorLanguage[];
  const consultationModes = (profile?.consultationModes ??
    []) as DoctorConsultationMode[];
  const focusAreas = (profile?.focusAreas ?? []) as DoctorFocusArea[];

  const experienceLabel = useMemo(() => {
    if (profile?.experienceStartYear) {
      return `${profile.experienceStartYear} onward`;
    }
    return "Not set";
  }, [profile?.experienceStartYear]);

  const stepsList = useMemo(
    () => parseApproachSteps(profile?.approachSteps ?? null),
    [profile?.approachSteps]
  );
  const parsedEducation = useMemo(
    () => parseEducationRows(profile?.education ?? null),
    [profile?.education]
  );

  const statusBadge = (() => {
    if (!profile) {
      return (
        <>
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
          Waiting for the name to be created
        </>
      );
    }
    if (profile.permanent) {
      return (
        <>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Approved
        </>
      );
    }
    return (
      <>
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Pending Approval
      </>
    );
  })();

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 border-border/30 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              className="size-16 border-2 border-primary/20 shadow-md"
              size="lg"
            >
              {user.user?.imageUrl ? (
                <AvatarImage alt={displayName} src={user.user.imageUrl} />
              ) : null}
              <AvatarFallback className="bg-primary/10 font-bold text-lg text-primary">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <CardTitle className="font-bold text-xl tracking-tight">
                  {displayName}
                </CardTitle>
                <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-semibold text-primary text-xs">
                  {statusBadge}
                </div>
              </div>
              <p className="mt-1 text-muted-foreground text-sm">
                {profile?.headline ?? "No professional headline set yet"}
              </p>
            </div>
          </div>
          <Button
            className="shrink-0 font-medium hover:bg-muted"
            onClick={() => setOpen(true)}
            variant="outline"
          >
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            Edit Profile
          </Button>
        </CardHeader>

        <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
          
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-semibold text-foreground/80 text-sm tracking-tight">
              <Building className="size-4 text-primary" />
              Practice Details
            </h3>
            <div className="grid gap-4 rounded-xl border border-border/50 bg-muted/5 p-4">
              <SummaryItem
                icon={<Clock className="size-3.5 text-muted-foreground" />}
                label="Experience"
                value={experienceLabel}
              />
              <SummaryItem
                icon={<MapPin className="size-3.5 text-muted-foreground" />}
                label="Location"
                value={profile?.location ?? "Not set"}
              />
              <SummaryItem
                icon={<Building className="size-3.5 text-muted-foreground" />}
                label="Practice Address"
                value={profile?.placeAddress ?? "Not set"}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-semibold text-foreground/80 text-sm tracking-tight">
              <Award className="size-4 text-primary" />
              Professional Info
            </h3>
            <div className="grid gap-4 rounded-xl border border-border/50 bg-muted/5 p-4">
              <SummaryItem
                icon={<FileText className="size-3.5 text-muted-foreground" />}
                label="License Number"
                value={profile?.licenseNumber ?? "Not set"}
              />
              <SummaryItem
                icon={<Building className="size-3.5 text-muted-foreground" />}
                label="Practice Place Name"
                value={profile?.placeName ?? "Not set"}
              />
              <SummaryItem
                icon={<FileText className="size-3.5 text-muted-foreground" />}
                label="Place Description"
                value={profile?.placeDescription ?? "No description added"}
              />
            </div>
          </div>

          
          <div className="space-y-2 border-border/20 border-t pt-4 md:col-span-2">
            <h3 className="font-semibold text-foreground/80 text-sm tracking-tight">
              Biography
            </h3>
            <p className="rounded-xl border border-border/30 bg-muted/5 p-4 text-foreground/90 text-sm italic leading-relaxed">
              "
              {profile?.bio ??
                "Welcome to my profile. Set up your biography using the edit button above."}
              "
            </p>
          </div>

          
          <div className="grid gap-6 border-border/20 border-t pt-4 md:col-span-2 md:grid-cols-2">
            <SummaryBlock
              colorTheme="primary"
              label="Specialties"
              labels={specialtyLabels}
              values={specialties}
            />
            <SummaryBlock
              colorTheme="secondary"
              label="Languages"
              labels={languageLabels}
              values={languages}
            />
            <SummaryBlock
              colorTheme="muted"
              label="Consultation Modes"
              labels={consultationModeLabels}
              values={consultationModes}
            />
            <SummaryBlock
              colorTheme="accent"
              label="Focus Areas"
              labels={focusAreaLabels}
              values={focusAreas}
            />
          </div>

          
          {stepsList.length > 0 && (
            <div className="space-y-3 border-border/20 border-t pt-4 md:col-span-2">
              <h3 className="flex items-center gap-2 font-semibold text-foreground/80 text-sm tracking-tight">
                <Sparkles className="size-4 text-primary" />
                Therapeutic Approach
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {stepsList.map((step, idx) => (
                  <div
                    className="relative rounded-xl border border-border/50 bg-muted/5 p-3.5 transition-all hover:bg-muted/15"
                    key={step.id}
                  >
                    <span className="absolute top-2.5 right-3 rounded-full bg-muted/60 px-2 py-0.5 font-bold font-mono text-[10px] text-muted-foreground/40 uppercase tracking-wider">
                      Step {idx + 1}
                    </span>
                    <p className="pr-10 font-medium text-foreground/80 text-sm leading-relaxed">
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          
          {parsedEducation.length > 0 && (
            <div className="space-y-3 border-border/20 border-t pt-4 md:col-span-2">
              <h3 className="flex items-center gap-2 font-semibold text-foreground/80 text-sm tracking-tight">
                <Award className="size-4 text-primary" />
                Education & Credentials
              </h3>
              <div className="divide-y divide-border/30 overflow-hidden rounded-xl border border-border/40 bg-muted/5">
                {parsedEducation.map((edu) => (
                  <div
                    className="flex items-center justify-between p-3.5 text-sm transition-all hover:bg-muted/10"
                    key={edu.id}
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground/80">
                        {edu.degree}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {edu.institution}
                      </p>
                    </div>
                    {edu.year && (
                      <span className="rounded-full border bg-muted px-2.5 py-1 font-mono font-semibold text-muted-foreground text-xs">
                        {edu.year}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          
          <div className="flex flex-col gap-4 rounded-xl border border-dashed bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between md:col-span-2">
            <div className="space-y-1">
              <h3 className="flex items-center gap-1.5 font-semibold text-foreground text-sm">
                <FileText className="size-4" />
                Proof of Credentials & Marketing Materials
              </h3>
              <p className="text-muted-foreground text-xs">
                Make your profile stand out by uploading certificates,
                professional portraits, and video bios in the doctor materials
                section below.
              </p>
            </div>
            <Badge
              className="shrink-0 self-start sm:self-auto"
              variant="outline"
            >
              Managed Below
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className="flex max-h-[90vh] max-w-sm flex-col gap-6 overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Doctor Profile</DialogTitle>
            <DialogDescription>
              Build a stronger public profile with structured practice and
              background details.
            </DialogDescription>
          </DialogHeader>

          <form className="flex flex-col gap-6" onSubmit={submitProfile}>
            <Tabs className="w-full" defaultValue="basic">
              <TabsList>
                <TabsTrigger
                  className="flex items-center justify-center gap-2 py-2"
                  value="basic"
                >
                  <User className="size-4 shrink-0" />
                  <span>Basic Info</span>
                </TabsTrigger>
                <TabsTrigger
                  className="flex items-center justify-center gap-2 py-2"
                  value="practice"
                >
                  <Building className="size-4 shrink-0" />
                  <span>Practice Place</span>
                </TabsTrigger>
                <TabsTrigger
                  className="flex items-center justify-center gap-2 py-2"
                  value="specialties"
                >
                  <Sparkles className="size-4 shrink-0" />
                  <span>Specialties</span>
                </TabsTrigger>
                <TabsTrigger
                  className="flex items-center justify-center gap-2 py-2"
                  value="experience"
                >
                  <Award className="size-4 shrink-0" />
                  <span>Approach & Edu</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent
                className="space-y-5 outline-none focus:outline-none"
                value="basic"
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="profile-display-name">
                      Display name
                    </FieldLabel>
                    <Input
                      id="profile-display-name"
                      placeholder="e.g. Dr. Alex Mercer"
                      {...form.register("displayName")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="profile-headline">Headline</FieldLabel>
                    <Input
                      id="profile-headline"
                      placeholder="e.g. Clinical Psychologist specializing in anxiety and trauma relief"
                      {...form.register("headline")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="profile-license">
                      License number
                    </FieldLabel>
                    <Input
                      id="profile-license"
                      placeholder="e.g. PSY-CA-987654"
                      {...form.register("licenseNumber")}
                    />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="profile-bio">Bio</FieldLabel>
                    <Textarea
                      className="min-h-[120px]"
                      id="profile-bio"
                      placeholder="Write a welcoming description of your practice, therapeutic style, and values..."
                      {...form.register("bio")}
                    />
                  </Field>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="profile-location">
                        Location
                      </FieldLabel>
                      <Input
                        id="profile-location"
                        placeholder="e.g. San Francisco, CA (or Remote)"
                        {...form.register("location")}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="profile-experience-start">
                        Experience start year
                      </FieldLabel>
                      <Input
                        id="profile-experience-start"
                        min={1900}
                        placeholder="e.g. 2018"
                        type="number"
                        {...form.register("experienceStartYear")}
                      />
                    </Field>
                  </div>
                </FieldGroup>
              </TabsContent>

              <TabsContent
                className="space-y-5 outline-none focus:outline-none"
                value="practice"
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="profile-place-name">
                      Practice / place name
                    </FieldLabel>
                    <Input
                      id="profile-place-name"
                      placeholder="e.g. Serenity Healing Center"
                      {...form.register("placeName")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="profile-place-address">
                      Place address
                    </FieldLabel>
                    <Input
                      id="profile-place-address"
                      placeholder="e.g. 456 Peaceful Valley Rd, Suite A"
                      {...form.register("placeAddress")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="profile-place-description">
                      Place description
                    </FieldLabel>
                    <Textarea
                      className="min-h-[100px]"
                      id="profile-place-description"
                      placeholder="Describe your physical clinic space or office environment..."
                      {...form.register("placeDescription")}
                    />
                  </Field>
                </FieldGroup>
              </TabsContent>

              <TabsContent
                className="space-y-6 outline-none focus:outline-none"
                value="specialties"
              >
                <FieldSet>
                  <FieldLegend
                    className="font-semibold text-sm"
                    variant="label"
                  >
                    Specialties (Select up to 5)
                  </FieldLegend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {doctorSpecialtyValues.map((value) => (
                      <Field
                        className="rounded-lg border p-3 transition-colors hover:bg-muted/10"
                        key={value}
                        orientation="horizontal"
                      >
                        <FieldLabel className="flex w-full cursor-pointer items-center gap-3">
                          <Checkbox
                            checked={(form.watch("specialties") ?? []).includes(
                              value
                            )}
                            onCheckedChange={(checked) =>
                              toggleArrayValue(
                                form,
                                "specialties",
                                value,
                                checked
                              )
                            }
                          />
                          <span className="font-medium text-sm">
                            {specialtyLabels[value]}
                          </span>
                        </FieldLabel>
                      </Field>
                    ))}
                  </div>
                </FieldSet>

                <FieldSet>
                  <FieldLegend
                    className="font-semibold text-sm"
                    variant="label"
                  >
                    Languages (Select up to 8)
                  </FieldLegend>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {doctorLanguageValues.map((value) => (
                      <Field
                        className="rounded-lg border p-3 transition-colors hover:bg-muted/10"
                        key={value}
                        orientation="horizontal"
                      >
                        <FieldLabel className="flex w-full cursor-pointer items-center gap-3">
                          <Checkbox
                            checked={(form.watch("languages") ?? []).includes(
                              value
                            )}
                            onCheckedChange={(checked) =>
                              toggleArrayValue(
                                form,
                                "languages",
                                value,
                                checked
                              )
                            }
                          />
                          <span className="font-medium text-sm">
                            {languageLabels[value]}
                          </span>
                        </FieldLabel>
                      </Field>
                    ))}
                  </div>
                </FieldSet>

                <FieldSet>
                  <FieldLegend
                    className="font-semibold text-sm"
                    variant="label"
                  >
                    Consultation modes (Select up to 3)
                  </FieldLegend>
                  <div className="flex flex-wrap gap-3">
                    {doctorConsultationModeValues.map((value) => (
                      <Button
                        className={cn(
                          "rounded-xl border px-4 py-2 font-medium text-sm transition-all",
                          (form.watch("consultationModes") ?? []).includes(
                            value
                          )
                            ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300"
                            : "border-border bg-transparent hover:bg-muted"
                        )}
                        key={value}
                        onClick={() =>
                          toggleButtonValue(form, "consultationModes", value)
                        }
                        type="button"
                        variant="outline"
                      >
                        {consultationModeLabels[value]}
                      </Button>
                    ))}
                  </div>
                </FieldSet>

                <FieldSet>
                  <FieldLegend
                    className="font-semibold text-sm"
                    variant="label"
                  >
                    Focus areas (Select up to 10)
                  </FieldLegend>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {doctorFocusAreaValues.map((value) => (
                      <Field
                        className="rounded-lg border p-3 transition-colors hover:bg-muted/10"
                        key={value}
                        orientation="horizontal"
                      >
                        <FieldLabel className="flex w-full cursor-pointer items-center gap-3">
                          <Checkbox
                            checked={(form.watch("focusAreas") ?? []).includes(
                              value
                            )}
                            onCheckedChange={(checked) =>
                              toggleArrayValue(
                                form,
                                "focusAreas",
                                value,
                                checked
                              )
                            }
                          />
                          <span className="font-medium text-sm">
                            {focusAreaLabels[value]}
                          </span>
                        </FieldLabel>
                      </Field>
                    ))}
                  </div>
                </FieldSet>
              </TabsContent>

              <TabsContent
                className="space-y-6 outline-none focus:outline-none"
                value="experience"
              >
                <StructuredListEditor
                  description="Drag steps to reorder them. Describe your care path in chronological, patient-friendly terms."
                  draggedIndex={draggedStepIndex}
                  emptyLabel="Add your first approach step to help patients understand your style."
                  items={approachSteps}
                  label="Approach steps"
                  onChange={setApproachSteps}
                  onDragStart={setDraggedStepIndex}
                  onDropIndex={(fromIndex, toIndex) => {
                    if (fromIndex === toIndex) {
                      return;
                    }
                    const next = [...approachSteps];
                    const [item] = next.splice(fromIndex, 1);
                    next.splice(toIndex, 0, item);
                    setApproachSteps(next);
                    setDraggedStepIndex(null);
                  }}
                />

                <EducationTableEditor
                  rows={educationRows}
                  setRows={setEducationRows}
                />
              </TabsContent>
            </Tabs>

            <div className="mt-2 flex justify-end gap-3 border-t pt-4">
              <Button
                onClick={() => setOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={saveDoctorProfile.isPending} type="submit">
                {saveDoctorProfile.isPending ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StructuredListEditor({
  label,
  description,
  emptyLabel,
  items,
  draggedIndex,
  onDragStart,
  onDropIndex,
  onChange,
}: {
  emptyLabel: string;
  description: string;
  draggedIndex: number | null;
  items: ApproachStep[];
  label: string;
  onDragStart: (index: number | null) => void;
  onDropIndex: (fromIndex: number, toIndex: number) => void;
  onChange: (items: ApproachStep[]) => void;
}) {
  const addItem = () =>
    onChange([...items, { id: crypto.randomUUID(), text: "" }]);
  const moveItem = (index: number, delta: number) => {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= items.length) {
      return;
    }
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    onChange(next);
  };

  return (
    <FieldSet>
      <FieldLegend>{label}</FieldLegend>
      <FieldDescription>{description}</FieldDescription>
      <div className="flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">{emptyLabel}</p>
        ) : null}
        {items.map((item, index) => (
          <div
            className={cn(
              "flex items-start gap-3 rounded-lg border bg-muted/10 p-3",
              draggedIndex === index && "border-primary bg-primary/5"
            )}
            draggable
            key={item.id}
            onDragOver={(event) => event.preventDefault()}
            onDragStart={() => onDragStart(index)}
            onDrop={() => {
              if (draggedIndex !== null) {
                onDropIndex(draggedIndex, index);
              }
            }}
          >
            <GripVertical className="mt-3 size-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />
            <div className="flex-1">
              <p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Step {index + 1}
              </p>
              <Textarea
                className="min-h-[70px]"
                onChange={(event) => {
                  const next = [...items];
                  next[index] = { ...item, text: event.target.value };
                  onChange(next);
                }}
                placeholder="e.g. Initial Consultation - Understanding your goals and assessing therapeutic options."
                value={item.text}
              />
            </div>
            <div className="flex flex-col justify-center gap-1.5">
              <Button
                className="size-8"
                disabled={index === 0}
                onClick={() => moveItem(index, -1)}
                size="icon"
                type="button"
                variant="outline"
              >
                <ChevronUp className="size-4" />
              </Button>
              <Button
                className="size-8"
                disabled={index === items.length - 1}
                onClick={() => moveItem(index, 1)}
                size="icon"
                type="button"
                variant="outline"
              >
                <ChevronDown className="size-4" />
              </Button>
              <Button
                className="size-8 border-rose-200 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 dark:border-rose-900/50"
                onClick={() =>
                  onChange(items.filter((_, current) => current !== index))
                }
                size="icon"
                type="button"
                variant="outline"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button
          className="w-full sm:w-auto"
          onClick={addItem}
          type="button"
          variant="outline"
        >
          <Plus className="mr-2 size-4" />
          Add step
        </Button>
      </div>
    </FieldSet>
  );
}

function EducationTableEditor({
  rows,
  setRows,
}: {
  rows: EducationRow[];
  setRows: (rows: EducationRow[]) => void;
}) {
  const addRow = () =>
    setRows([
      ...rows,
      { id: crypto.randomUUID(), institution: "", degree: "", year: "" },
    ]);

  return (
    <FieldSet>
      <FieldLegend>Education & Degrees</FieldLegend>
      <FieldDescription>
        Add your academic credentials and training programs so patients can
        easily verify your background.
      </FieldDescription>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/30">
        <div className="grid grid-cols-[1.3fr_1.1fr_0.6fr_auto] gap-2 border-b bg-muted/40 px-3 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
          <span>Institution</span>
          <span>Degree</span>
          <span>Year</span>
          <span />
        </div>
        <div className="flex flex-col gap-3 p-3">
          {rows.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground text-sm">
              No education history added yet.
            </p>
          ) : null}
          {rows.map((row, index) => (
            <div
              className="grid grid-cols-[1.3fr_1.1fr_0.6fr_auto] items-center gap-2"
              key={row.id}
            >
              <Input
                onChange={(event) =>
                  updateEducationRow(
                    rows,
                    setRows,
                    index,
                    "institution",
                    event.target.value
                  )
                }
                placeholder="e.g. Stanford University"
                value={row.institution}
              />
              <Input
                onChange={(event) =>
                  updateEducationRow(
                    rows,
                    setRows,
                    index,
                    "degree",
                    event.target.value
                  )
                }
                placeholder="e.g. Master of Science in Counseling"
                value={row.degree}
              />
              <Input
                onChange={(event) =>
                  updateEducationRow(
                    rows,
                    setRows,
                    index,
                    "year",
                    event.target.value
                  )
                }
                placeholder="e.g. 2018"
                type="number"
                value={row.year}
              />
              <Button
                className="border-rose-200 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 dark:border-rose-900/50"
                onClick={() =>
                  setRows(rows.filter((_, current) => current !== index))
                }
                type="button"
                variant="outline"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>
      <Button
        className="mt-2 w-full sm:w-auto"
        onClick={addRow}
        type="button"
        variant="outline"
      >
        <Plus className="mr-2 size-4" />
        Add Education Row
      </Button>
    </FieldSet>
  );
}

function updateEducationRow(
  rows: EducationRow[],
  setRows: (rows: EducationRow[]) => void,
  index: number,
  key: keyof Pick<EducationRow, "institution" | "degree" | "year">,
  value: string
) {
  const next = [...rows];
  next[index] = { ...next[index], [key]: value };
  setRows(next);
}

function toggleArrayValue<T extends string>(
  form: ReturnType<
    typeof useForm<DoctorProfileFormInput, undefined, DoctorProfileFormValues>
  >,
  field: "specialties" | "languages" | "focusAreas",
  value: T,
  checked: boolean | "indeterminate"
) {
  const current = (form.getValues(field) ?? []) as T[];
  const next = checked
    ? [...new Set([...current, value])]
    : current.filter((item) => item !== value);
  form.setValue(field, next as never, { shouldDirty: true, shouldTouch: true });
}

function toggleButtonValue<T extends string>(
  form: ReturnType<
    typeof useForm<DoctorProfileFormInput, undefined, DoctorProfileFormValues>
  >,
  field: "consultationModes",
  value: T
) {
  const current = (form.getValues(field) ?? []) as T[];
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  form.setValue(field, next as never, { shouldDirty: true, shouldTouch: true });
}

function emptyToUndefined(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

const doctorProfileFieldLabels = {
  displayName: "Display name",
  headline: "Headline",
  bio: "Bio",
  licenseNumber: "License number",
  location: "Location",
  placeName: "Practice / place name",
  placeAddress: "Place address",
  placeDescription: "Place description",
  experienceStartYear: "Experience start year",
  specialties: "Specialties",
  languages: "Languages",
  consultationModes: "Consultation modes",
  focusAreas: "Focus areas",
} as const;

function getDoctorProfileFormValues(
  profile: {
    bio: string | null;
    displayName: string | null;
    experienceStartYear: number | null;
    headline: string | null;
    licenseNumber: string | null;
    location: string | null;
    placeAddress: string | null;
    placeDescription: string | null;
    placeName: string | null;
    specialties: string[];
    languages: string[];
    consultationModes: string[];
    focusAreas: string[];
  } | null
): DoctorProfileFormValues {
  return {
    displayName: profile?.displayName ?? "",
    headline: profile?.headline ?? "",
    bio: profile?.bio ?? "",
    licenseNumber: profile?.licenseNumber ?? "",
    location: profile?.location ?? "",
    placeName: profile?.placeName ?? "",
    placeAddress: profile?.placeAddress ?? "",
    placeDescription: profile?.placeDescription ?? "",
    experienceStartYear: profile?.experienceStartYear ?? undefined,
    specialties: (profile?.specialties ?? []) as DoctorSpecialty[],
    languages: (profile?.languages ?? []) as DoctorLanguage[],
    consultationModes: (profile?.consultationModes ??
      []) as DoctorConsultationMode[],
    focusAreas: (profile?.focusAreas ?? []) as DoctorFocusArea[],
  };
}
