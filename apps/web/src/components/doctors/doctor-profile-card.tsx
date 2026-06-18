import {
  Button,
  Chip,
  cn,
  Description,
  FieldError,
  Fieldset,
  Form,
  Input,
  Label,
  Modal,
  Tabs,
  TextArea,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  toast,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  doctorConsultationModeValues,
  doctorFocusAreaValues,
  doctorLanguageValues,
  doctorSpecialtyValues,
} from "@suwa/db/doctor-profile";
import { useMutation, useQuery } from "@tanstack/react-query";
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
        toast.danger(error instanceof Error ? error.message : "Save failed");
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

  const errors = form.formState.errors;

  const hasBasicErrors = !!(
    errors.displayName ||
    errors.headline ||
    errors.licenseNumber ||
    errors.bio ||
    errors.location ||
    errors.experienceStartYear
  );
  const hasPracticeErrors = !!(
    errors.placeName ||
    errors.placeAddress ||
    errors.placeDescription
  );
  const hasSpecialtiesErrors = !!(
    errors.specialties ||
    errors.languages ||
    errors.consultationModes ||
    errors.focusAreas
  );

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
    () => {
      toast.danger("Please fix the highlighted fields.");
    }
  );

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

  return (
    <>
      {profile ? (
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Chip
                size="sm"
                variant={profile.permanent ? "primary" : "secondary"}
              >
                {profile.permanent ? "Approved" : "Pending Verification"}
              </Chip>
              {profile.permanent ? null : (
                <p className="text-muted-foreground text-xs">
                  Your profile is under review. You&apos;ll be notified once
                  verified.
                </p>
              )}
            </div>
            <Button onPress={() => setOpen(true)} size="sm" variant="outline">
              <Sparkles className="size-4" />
              Edit Profile
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <h3 className="flex items-center gap-2 font-semibold text-foreground/80 text-sm tracking-tight">
                <Building className="size-4 text-primary" />
                Practice Details
              </h3>
              <div className="grid gap-3 rounded-xl border border-border/50 bg-muted/5 p-4">
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
            <div className="flex flex-col gap-4">
              <h3 className="flex items-center gap-2 font-semibold text-foreground/80 text-sm tracking-tight">
                <Award className="size-4 text-primary" />
                Professional Info
              </h3>
              <div className="grid gap-3 rounded-xl border border-border/50 bg-muted/5 p-4">
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
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-foreground/80 text-sm tracking-tight">
              Biography
            </h3>
            <p className="rounded-xl border border-border/30 bg-muted/5 px-4 py-3 text-foreground/90 text-sm italic leading-relaxed">
              &ldquo;
              {profile?.bio ??
                "No biography set yet. Use the edit button above to add one."}
              &rdquo;
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
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
            <div className="flex flex-col gap-3">
              <h3 className="flex items-center gap-2 font-semibold text-foreground/80 text-sm tracking-tight">
                <Sparkles className="size-4 text-primary" />
                Therapeutic Approach
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {stepsList.map((step, idx) => (
                  <div
                    className="relative rounded-xl border border-border/50 bg-muted/5 p-4 transition-all hover:bg-muted/15"
                    key={step.id}
                  >
                    <span className="absolute top-2.5 right-3 rounded-full bg-muted/60 px-2 font-mono text-[10px] text-muted-foreground/40 uppercase tracking-wider">
                      Step {idx + 1}
                    </span>
                    <p className="font-medium text-foreground/80 text-sm leading-relaxed">
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsedEducation.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="flex items-center gap-2 font-semibold text-foreground/80 text-sm tracking-tight">
                <Award className="size-4 text-primary" />
                Education & Credentials
              </h3>
              <div className="divide-y divide-border/30 overflow-hidden rounded-xl border border-border/40 bg-muted/5">
                {parsedEducation.map((edu) => (
                  <div
                    className="flex items-center justify-between px-4 py-3 text-sm transition-all hover:bg-muted/10"
                    key={edu.id}
                  >
                    <div className="flex flex-col gap-0.5">
                      <p className="font-semibold text-foreground/80">
                        {edu.degree}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {edu.institution}
                      </p>
                    </div>
                    {edu.year && (
                      <span className="rounded-full border bg-muted px-2 font-mono font-semibold text-muted-foreground text-xs">
                        {edu.year}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 rounded-xl border border-dashed px-6 py-16 text-center">
          <div className="rounded-full bg-muted/30 p-4">
            <User className="size-8 text-muted-foreground/60" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-lg">No professional profile yet</p>
            <p className="max-w-md text-muted-foreground text-sm">
              Create your professional profile to appear in patient searches.
              After submission, an admin will review and verify your information
              before you can start using the platform.
            </p>
          </div>
          <Button onPress={() => setOpen(true)}>
            <Sparkles className="size-4" />
            Create Profile
          </Button>
        </div>
      )}

      <Modal.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Modal.Container>
          <Modal.Dialog className="flex flex-col gap-6 overflow-y-auto bg-background">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Edit Doctor Profile</Modal.Heading>
              <p className="text-muted-foreground text-sm font-light">
                Build a stronger public profile with structured practice and
                background details.
              </p>
            </Modal.Header>
            <Modal.Body>
              <Form
                className="flex flex-col gap-6"
                onSubmit={submitProfile}
                validationBehavior="aria"
              >
                <Tabs defaultSelectedKey="basic">
                  <Tabs.ListContainer>
                    <Tabs.List aria-label="Profile tabs"
                      className="*:h-8 *:px-1 *:text-sm *:font-normal *:data-[selected=true]:text-accent-foreground"
                    >
                      <Tabs.Tab
                        className={cn(
                          hasBasicErrors &&
                            "data-[selected=false]:ring-2 data-[selected=false]:ring-red-500/70"
                        )}
                        id="basic"
                      >
                        <span>Info</span>
  <Tabs.Indicator className="bg-accent" />
                      </Tabs.Tab>
                      <Tabs.Tab
                        className={cn(
                          hasPracticeErrors &&
                            "data-[selected=false]:ring-2 data-[selected=false]:ring-red-500/70"
                        )}
                        id="practice"
                      >
                        <span>Practice</span>
  <Tabs.Indicator className="bg-accent" />
                      </Tabs.Tab>
                      <Tabs.Tab
                        className={cn(
                          hasSpecialtiesErrors &&
                            "data-[selected=false]:ring-2 data-[selected=false]:ring-red-500/70"
                        )}
                        id="specialties"
                      >
                        <span>Specialties</span>
  <Tabs.Indicator className="bg-accent" />
                      </Tabs.Tab>
                      <Tabs.Tab id="experience">
                        <span>App. & Edu</span>
  <Tabs.Indicator className="bg-accent" />
                      </Tabs.Tab>
                    </Tabs.List>
                  </Tabs.ListContainer>

                  <Tabs.Panel
                    className="flex flex-col gap-5 outline-none focus:outline-none"
                    id="basic"
                  >
                    <Fieldset>
                      <Fieldset.Legend>Basic Information</Fieldset.Legend>
                      <Fieldset.Group>
                        <TextField
                          isInvalid={!!errors.displayName}
                          name="displayName"
                        >
                          <Label>Display name</Label>
                          <Input
                            placeholder="e.g. Dr. Alex Mercer"
                            {...form.register("displayName")}
                          />
                          <FieldError>
                            {errors.displayName?.message as string}
                          </FieldError>
                        </TextField>
                        <TextField
                          isInvalid={!!errors.headline}
                          name="headline"
                        >
                          <Label>Headline</Label>
                          <Input
                            placeholder="e.g. Clinical Psychologist specializing in anxiety and trauma relief"
                            {...form.register("headline")}
                          />
                          <FieldError>
                            {errors.headline?.message as string}
                          </FieldError>
                        </TextField>
                        <TextField
                          isInvalid={!!errors.licenseNumber}
                          name="licenseNumber"
                        >
                          <Label>License number</Label>
                          <Input
                            placeholder="e.g. PSY-CA-987654"
                            {...form.register("licenseNumber")}
                          />
                          <FieldError>
                            {errors.licenseNumber?.message as string}
                          </FieldError>
                        </TextField>
                      </Fieldset.Group>
                    </Fieldset>

                    <Fieldset>
                      <Fieldset.Legend>Bio & Experience</Fieldset.Legend>
                      <Fieldset.Group>
                        <TextField isInvalid={!!errors.bio} name="bio">
                          <Label>Bio</Label>
                          <TextArea
                            className="min-h-[120px]"
                            placeholder="Write a welcoming description of your practice, therapeutic style, and values..."
                            {...form.register("bio")}
                          />
                          <FieldError>
                            {errors.bio?.message as string}
                          </FieldError>
                        </TextField>
                        <div className="grid gap-4 md:grid-cols-2">
                          <TextField
                            isInvalid={!!errors.location}
                            name="location"
                          >
                            <Label>Location</Label>
                            <Input
                              placeholder="e.g. San Francisco, CA (or Remote)"
                              {...form.register("location")}
                            />
                            <FieldError>
                              {errors.location?.message as string}
                            </FieldError>
                          </TextField>
                          <TextField
                            isInvalid={!!errors.experienceStartYear}
                            name="experienceStartYear"
                          >
                            <Label>Experience start year</Label>
                            <Input
                              min={1900}
                              placeholder="e.g. 2018"
                              type="number"
                              {...form.register("experienceStartYear")}
                            />
                            <FieldError>
                              {errors.experienceStartYear?.message as string}
                            </FieldError>
                          </TextField>
                        </div>
                      </Fieldset.Group>
                    </Fieldset>
                  </Tabs.Panel>

                  <Tabs.Panel
                    className="flex flex-col gap-5 outline-none focus:outline-none"
                    id="practice"
                  >
                    <Fieldset>
                      <Fieldset.Legend>Practice Details</Fieldset.Legend>
                      <Fieldset.Group>
                        <TextField
                          isInvalid={!!errors.placeName}
                          name="placeName"
                        >
                          <Label>Practice / place name</Label>
                          <Input
                            placeholder="e.g. Serenity Healing Center"
                            {...form.register("placeName")}
                          />
                          <FieldError>
                            {errors.placeName?.message as string}
                          </FieldError>
                        </TextField>
                        <TextField
                          isInvalid={!!errors.placeAddress}
                          name="placeAddress"
                        >
                          <Label>Place address</Label>
                          <Input
                            placeholder="e.g. 456 Peaceful Valley Rd, Suite A"
                            {...form.register("placeAddress")}
                          />
                          <FieldError>
                            {errors.placeAddress?.message as string}
                          </FieldError>
                        </TextField>
                        <TextField
                          isInvalid={!!errors.placeDescription}
                          name="placeDescription"
                        >
                          <Label>Place description</Label>
                          <TextArea
                            className="min-h-[100px]"
                            placeholder="Describe your physical clinic space or office environment..."
                            {...form.register("placeDescription")}
                          />
                          <FieldError>
                            {errors.placeDescription?.message as string}
                          </FieldError>
                        </TextField>
                      </Fieldset.Group>
                    </Fieldset>
                  </Tabs.Panel>

                  <Tabs.Panel
                    className="flex flex-col gap-6 outline-none focus:outline-none"
                    id="specialties"
                  >
                    <Fieldset>
                      <Fieldset.Legend>
                        Specialties (Select up to 5)
                      </Fieldset.Legend>
                      <Fieldset.Group>
                        <ToggleButtonGroup
                          className="flex flex-wrap pt-4"
                          isDetached
                          selectedKeys={new Set(form.watch("specialties") ?? [])}
                          selectionMode="multiple"
                          onSelectionChange={(keys) =>
                            form.setValue("specialties", [...keys] as never, {
                              shouldDirty: true,
                              shouldTouch: true,
                            })
                          }
                        >
                          {doctorSpecialtyValues.map((value) => (
                            <ToggleButton id={value} key={value}>
                              {specialtyLabels[value]}
                            </ToggleButton>
                          ))}
                        </ToggleButtonGroup>
                      </Fieldset.Group>
                    </Fieldset>

                    <Fieldset>
                      <Fieldset.Legend>
                        Languages (Select up to 8)
                      </Fieldset.Legend>
                      <Fieldset.Group>
                        <ToggleButtonGroup
                          className="flex flex-wrap pt-4"
                          isDetached
                          selectedKeys={new Set(form.watch("languages") ?? [])}
                          selectionMode="multiple"
                          onSelectionChange={(keys) =>
                            form.setValue("languages", [...keys] as never, {
                              shouldDirty: true,
                              shouldTouch: true,
                            })
                          }
                        >
                          {doctorLanguageValues.map((value) => (
                            <ToggleButton id={value} key={value}>
                              {languageLabels[value]}
                            </ToggleButton>
                          ))}
                        </ToggleButtonGroup>
                      </Fieldset.Group>
                    </Fieldset>

                    <Fieldset>
                      <Fieldset.Legend>
                        Consultation modes (Select up to 3)
                      </Fieldset.Legend>
                      <Fieldset.Group>
                        <ToggleButtonGroup
                          className="flex flex-wrap pt-4"
                          isDetached
                          selectedKeys={new Set(form.watch("consultationModes") ?? [])}
                          selectionMode="multiple"
                          onSelectionChange={(keys) =>
                            form.setValue("consultationModes", [...keys] as never, {
                              shouldDirty: true,
                              shouldTouch: true,
                            })
                          }
                        >
                          {doctorConsultationModeValues.map((value) => (
                            <ToggleButton id={value} key={value}>
                              {consultationModeLabels[value]}
                            </ToggleButton>
                          ))}
                        </ToggleButtonGroup>
                      </Fieldset.Group>
                    </Fieldset>

                    <Fieldset>
                      <Fieldset.Legend>
                        Focus areas (Select up to 10)
                      </Fieldset.Legend>
                      <Fieldset.Group>
                        <ToggleButtonGroup
                          className="flex flex-wrap pt-4"
                          isDetached
                          selectedKeys={new Set(form.watch("focusAreas") ?? [])}
                          selectionMode="multiple"
                          onSelectionChange={(keys) =>
                            form.setValue("focusAreas", [...keys] as never, {
                              shouldDirty: true,
                              shouldTouch: true,
                            })
                          }
                        >
                          {doctorFocusAreaValues.map((value) => (
                            <ToggleButton id={value} key={value}>
                              {focusAreaLabels[value]}
                            </ToggleButton>
                          ))}
                        </ToggleButtonGroup>
                      </Fieldset.Group>
                    </Fieldset>
                  </Tabs.Panel>

                  <Tabs.Panel
                    className="flex flex-col gap-6 outline-none focus:outline-none"
                    id="experience"
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
                  </Tabs.Panel>
                </Tabs>

                <div className="flex justify-end gap-3">
                  <Button onPress={() => setOpen(false)} variant="outline">
                    Cancel
                  </Button>
                  <Button
                    isDisabled={saveDoctorProfile.isPending}
                    type="submit"
                  >
                    {saveDoctorProfile.isPending ? "Saving..." : "Save profile"}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
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
    <Fieldset>
      <Fieldset.Legend>{label}</Fieldset.Legend>
      <Description>{description}</Description>
      <Fieldset.Group className="flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">{emptyLabel}</p>
        ) : null}
        {items.map((item, index) => (
          <div
            className={cn(
              "flex items-start gap-3 rounded-lg border bg-muted/10",
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
            <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />
            <div className="flex-1">
              <p className="text-muted-foreground text-xs uppercase tracking-wider">
                Step {index + 1}
              </p>
              <TextArea
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
                isDisabled={index === 0}
                isIconOnly
                onPress={() => moveItem(index, -1)}
                size="sm"
                variant="outline"
              >
                <ChevronUp className="size-4" />
              </Button>
              <Button
                className="size-8"
                isDisabled={index === items.length - 1}
                isIconOnly
                onPress={() => moveItem(index, 1)}
                size="sm"
                variant="outline"
              >
                <ChevronDown className="size-4" />
              </Button>
              <Button
                className="size-8 border-rose-200 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 dark:border-rose-900/50"
                isIconOnly
                onPress={() =>
                  onChange(items.filter((_, current) => current !== index))
                }
                size="sm"
                variant="outline"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button
          className="w-full sm:w-auto"
          onPress={addItem}
          variant="outline"
        >
          <Plus className="size-4" />
          Add step
        </Button>
      </Fieldset.Group>
    </Fieldset>
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
    <Fieldset>
      <Fieldset.Legend>Education & Degrees</Fieldset.Legend>
      <Description>
        Add your academic credentials and training programs so patients can
        easily verify your background.
      </Description>
      <Fieldset.Group className="flex flex-col gap-3">
        {rows.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm">
            No education history added yet.
          </p>
        ) : null}
        {rows.map((row, index) => (
          <div
            className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/5 p-4"
            key={row.id}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Entry {index + 1}
              </p>
              <Button
                className="h-7 border-rose-200 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 dark:border-rose-900/50"
                onPress={() =>
                  setRows(rows.filter((_, current) => current !== index))
                }
                size="sm"
                variant="outline"
              >
                <Trash2 className="size-3.5" />
                Remove
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
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
                placeholder="Institution (e.g. Stanford)"
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
                placeholder="Degree (e.g. M.Sc. Counseling)"
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
                placeholder="Year (e.g. 2018)"
                type="number"
                value={row.year}
              />
            </div>
          </div>
        ))}
        <Button className="w-full sm:w-auto" onPress={addRow} variant="outline">
          <Plus className="size-4" />
          Add Education Row
        </Button>
      </Fieldset.Group>
    </Fieldset>
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

function emptyToUndefined(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

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
