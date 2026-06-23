import {
  Alert,
  Button,
  Card,
  Chip,
  cn,
  Description,
  FieldError,
  Fieldset,
  Form,
  Input,
  Label,
  Modal,
  Separator,
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
  GripVertical,
  Languages,
  Monitor,
  Pen,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TriangleAlert,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { type FieldPath, type UseFormRegister, useForm } from "react-hook-form";
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

  const register = form.register;

  return (
    <>
      {profile ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {profile.permanent ? (
              <Chip variant="primary">Approved</Chip>
            ) : (
              <Alert className="w-full" color="warning">
                <Alert.Indicator>
                  <TriangleAlert className="size-4" />
                </Alert.Indicator>
                <Alert.Content>
                  <Alert.Description>
                    Your profile is under review. You&apos;ll be notified once
                    verified.
                  </Alert.Description>
                </Alert.Content>
              </Alert>
            )}
            <Button onPress={() => setOpen(true)} size="sm" variant="primary">
              <Sparkles className="size-3.5" />
              Edit Profile
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ProfileInfoCard
              icon={<Building className="size-3.5 text-primary" />}
              title="Practice Details"
            >
              <ProfileField
                label="Experience"
                onAdd={() => setOpen(true)}
                value={experienceLabel === "Not set" ? null : experienceLabel}
              />
              <Separator />
              <ProfileField
                label="Location"
                onAdd={() => setOpen(true)}
                value={profile?.location ?? null}
              />
              <Separator />
              <ProfileField
                label="Practice Address"
                onAdd={() => setOpen(true)}
                value={profile?.placeAddress ?? null}
              />
            </ProfileInfoCard>

            <ProfileInfoCard
              icon={<Award className="size-3.5 text-primary" />}
              title="Professional Info"
            >
              <ProfileField
                label="License Number"
                onAdd={() => setOpen(true)}
                value={profile?.licenseNumber ?? null}
              />
              <Separator />
              <ProfileField
                label="Practice Place Name"
                onAdd={() => setOpen(true)}
                value={profile?.placeName ?? null}
              />
              <Separator />
              <ProfileField
                label="Place Description"
                onAdd={() => setOpen(true)}
                value={profile?.placeDescription ?? null}
              />
            </ProfileInfoCard>
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-semibold text-foreground/80 text-xs uppercase tracking-wider">
              Biography
            </p>
            {profile?.bio ? (
              <Card>
                <Card.Content>
                  <p className="text-foreground/80 text-sm italic leading-relaxed">
                    &ldquo;{profile.bio}&rdquo;
                  </p>
                </Card.Content>
              </Card>
            ) : (
              <Card>
                <Card.Content className="flex flex-col items-center gap-3 py-10 text-center">
                  <Pen className="size-5 text-muted-foreground/60" />
                  <p className="text-muted-foreground text-sm">
                    No biography added yet
                  </p>
                  <Button onPress={() => setOpen(true)} variant="secondary">
                    Add Biography
                  </Button>
                </Card.Content>
              </Card>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TagCard
              icon={<Award className="size-3.5 text-primary" />}
              items={specialties}
              labelMap={specialtyLabels}
              onAdd={() => setOpen(true)}
              title="Specialties"
            />
            <TagCard
              icon={<Languages className="size-3.5 text-primary" />}
              items={languages}
              labelMap={languageLabels}
              onAdd={() => setOpen(true)}
              title="Languages"
            />
            <TagCard
              icon={<Monitor className="size-3.5 text-primary" />}
              items={consultationModes}
              labelMap={consultationModeLabels}
              onAdd={() => setOpen(true)}
              title="Consultation Modes"
            />
            <TagCard
              icon={<Target className="size-3.5 text-primary" />}
              items={focusAreas}
              labelMap={focusAreaLabels}
              onAdd={() => setOpen(true)}
              title="Focus Areas"
            />
          </div>

          {stepsList.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="flex items-center gap-1.5 font-semibold text-foreground/80 text-xs uppercase tracking-wider">
                <Sparkles className="size-3.5 text-primary" />
                Therapeutic Approach
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {stepsList.map((step, idx) => (
                  <Card key={step.id}>
                    <Card.Content className="gap-1">
                      <p className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-wider">
                        Step {idx + 1}
                      </p>
                      <p className="text-foreground/80 text-sm leading-relaxed">
                        {step.text}
                      </p>
                    </Card.Content>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {parsedEducation.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="flex items-center gap-1.5 font-semibold text-foreground/80 text-xs uppercase tracking-wider">
                <Award className="size-3.5 text-primary" />
                Education &amp; Credentials
              </p>
              <Card>
                <Card.Content className="gap-0 p-0">
                  {parsedEducation.map((edu, idx) => (
                    <div key={edu.id}>
                      {idx > 0 && <Separator />}
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <p className="font-semibold text-foreground/80 text-sm">
                            {edu.degree}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {edu.institution}
                          </p>
                        </div>
                        {edu.year && <Chip variant="tertiary">{edu.year}</Chip>}
                      </div>
                    </div>
                  ))}
                </Card.Content>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <Card.Content className="flex flex-col items-center gap-5 py-16 text-center">
            <div className="rounded-full bg-muted/30 p-4">
              <User className="size-7 text-muted-foreground/60" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-base">
                No professional profile yet
              </p>
              <p className="max-w-sm text-muted-foreground text-sm">
                Create your professional profile to appear in patient searches.
                An admin will review your information before you can start using
                the platform.
              </p>
            </div>
            <Button onPress={() => setOpen(true)}>
              <Sparkles className="size-3.5" />
              Create Profile
            </Button>
          </Card.Content>
        </Card>
      )}

      <Modal.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Modal.Container>
          <Modal.Dialog className="flex flex-col gap-5 overflow-y-auto bg-background">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Edit Doctor Profile</Modal.Heading>
              <p className="text-muted-foreground text-sm">
                Build a stronger public profile with structured practice and
                background details.
              </p>
            </Modal.Header>
            <Modal.Body>
              <Form
                className="flex flex-col gap-5"
                onSubmit={submitProfile}
                validationBehavior="aria"
              >
                <Tabs defaultSelectedKey="basic">
                  <Tabs.ListContainer>
                    <Tabs.List
                      aria-label="Profile tabs"
                      className="gap-1 rounded-lg p-1"
                    >
                      <Tabs.Tab
                        className={cn(
                          "h-7 rounded-md px-3 font-normal text-sm transition-colors data-[selected=false]:bg-[var(--surface-secondary)] data-[selected=true]:bg-[var(--accent)] data-[selected=true]:text-[var(--accent-foreground)]",
                          hasBasicErrors &&
                            "data-[selected=false]:ring-2 data-[selected=false]:ring-red-500/70"
                        )}
                        id="basic"
                      >
                        Info
                      </Tabs.Tab>
                      <Tabs.Tab
                        className={cn(
                          "h-7 rounded-md px-3 font-normal text-sm transition-colors data-[selected=false]:bg-[var(--surface-secondary)] data-[selected=true]:bg-[var(--accent)] data-[selected=true]:text-[var(--accent-foreground)]",
                          hasPracticeErrors &&
                            "data-[selected=false]:ring-2 data-[selected=false]:ring-red-500/70"
                        )}
                        id="practice"
                      >
                        Practice
                      </Tabs.Tab>
                      <Tabs.Tab
                        className={cn(
                          "h-7 rounded-md px-3 font-normal text-sm transition-colors data-[selected=false]:bg-[var(--surface-secondary)] data-[selected=true]:bg-[var(--accent)] data-[selected=true]:text-[var(--accent-foreground)]",
                          hasSpecialtiesErrors &&
                            "data-[selected=false]:ring-2 data-[selected=false]:ring-red-500/70"
                        )}
                        id="specialties"
                      >
                        Specialties
                      </Tabs.Tab>
                      <Tabs.Tab
                        className="h-7 rounded-md px-3 font-normal text-sm transition-colors data-[selected=false]:bg-[var(--surface-secondary)] data-[selected=true]:bg-[var(--accent)] data-[selected=true]:text-[var(--accent-foreground)]"
                        id="experience"
                      >
                        App. &amp; Edu
                      </Tabs.Tab>
                    </Tabs.List>
                  </Tabs.ListContainer>

                  <Tabs.Panel
                    className="flex flex-col gap-4 outline-none"
                    id="basic"
                  >
                    <Fieldset>
                      <Fieldset.Legend>Basic Information</Fieldset.Legend>
                      <Fieldset.Group>
                        <ProfileInputField
                          error={errors.displayName}
                          label="Display name"
                          name="displayName"
                          placeholder="e.g. Dr. Alex Mercer"
                          register={register}
                        />
                        <ProfileInputField
                          error={errors.headline}
                          label="Headline"
                          name="headline"
                          placeholder="e.g. Clinical Psychologist specializing in anxiety and trauma relief"
                          register={register}
                        />
                        <ProfileInputField
                          error={errors.licenseNumber}
                          label="License number"
                          name="licenseNumber"
                          placeholder="e.g. PSY-CA-987654"
                          register={register}
                        />
                      </Fieldset.Group>
                    </Fieldset>
                    <Fieldset>
                      <Fieldset.Legend>Bio &amp; Experience</Fieldset.Legend>
                      <Fieldset.Group>
                        <ProfileTextAreaField
                          error={errors.bio}
                          label="Bio"
                          name="bio"
                          placeholder="Write a welcoming description of your practice, therapeutic style, and values..."
                          register={register}
                        />
                        <div className="grid gap-3 md:grid-cols-2">
                          <ProfileInputField
                            error={errors.location}
                            label="Location"
                            name="location"
                            placeholder="e.g. San Francisco, CA"
                            register={register}
                          />
                          <ProfileInputField
                            error={errors.experienceStartYear}
                            label="Experience start year"
                            min={1900}
                            name="experienceStartYear"
                            placeholder="e.g. 2018"
                            register={register}
                            type="number"
                          />
                        </div>
                      </Fieldset.Group>
                    </Fieldset>
                  </Tabs.Panel>

                  <Tabs.Panel
                    className="flex flex-col gap-4 outline-none"
                    id="practice"
                  >
                    <Fieldset>
                      <Fieldset.Legend>Practice Details</Fieldset.Legend>
                      <Fieldset.Group>
                        <ProfileInputField
                          error={errors.placeName}
                          label="Practice / place name"
                          name="placeName"
                          placeholder="e.g. Serenity Healing Center"
                          register={register}
                        />
                        <ProfileInputField
                          error={errors.placeAddress}
                          label="Place address"
                          name="placeAddress"
                          placeholder="e.g. 456 Peaceful Valley Rd, Suite A"
                          register={register}
                        />
                        <ProfileTextAreaField
                          error={errors.placeDescription}
                          label="Place description"
                          name="placeDescription"
                          placeholder="Describe your physical clinic space or office environment..."
                          register={register}
                        />
                      </Fieldset.Group>
                    </Fieldset>
                  </Tabs.Panel>

                  <Tabs.Panel
                    className="flex flex-col gap-5 outline-none"
                    id="specialties"
                  >
                    <MultiSelectField
                      description="Select up to 5"
                      label="Specialties"
                      labelMap={specialtyLabels}
                      onSelectionChange={(keys) =>
                        form.setValue("specialties", [...keys] as never, {
                          shouldDirty: true,
                          shouldTouch: true,
                        })
                      }
                      options={doctorSpecialtyValues}
                      selectedKeys={new Set(form.watch("specialties") ?? [])}
                    />
                    <MultiSelectField
                      description="Select up to 8"
                      label="Languages"
                      labelMap={languageLabels}
                      onSelectionChange={(keys) =>
                        form.setValue("languages", [...keys] as never, {
                          shouldDirty: true,
                          shouldTouch: true,
                        })
                      }
                      options={doctorLanguageValues}
                      selectedKeys={new Set(form.watch("languages") ?? [])}
                    />
                    <MultiSelectField
                      description="Select up to 3"
                      label="Consultation Modes"
                      labelMap={consultationModeLabels}
                      onSelectionChange={(keys) =>
                        form.setValue("consultationModes", [...keys] as never, {
                          shouldDirty: true,
                          shouldTouch: true,
                        })
                      }
                      options={doctorConsultationModeValues}
                      selectedKeys={
                        new Set(form.watch("consultationModes") ?? [])
                      }
                    />
                    <MultiSelectField
                      description="Select up to 10"
                      label="Focus Areas"
                      labelMap={focusAreaLabels}
                      onSelectionChange={(keys) =>
                        form.setValue("focusAreas", [...keys] as never, {
                          shouldDirty: true,
                          shouldTouch: true,
                        })
                      }
                      options={doctorFocusAreaValues}
                      selectedKeys={new Set(form.watch("focusAreas") ?? [])}
                    />
                  </Tabs.Panel>

                  <Tabs.Panel
                    className="flex flex-col gap-5 outline-none"
                    id="experience"
                  >
                    <StructuredListEditor
                      description="Drag steps to reorder. Describe your care path in chronological, patient-friendly terms."
                      draggedIndex={draggedStepIndex}
                      emptyLabel="Add your first approach step to help patients understand your style."
                      items={approachSteps}
                      label="Approach Steps"
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

                <Separator />
                <div className="flex justify-end gap-2">
                  <Button onPress={() => setOpen(false)} variant="outline">
                    Cancel
                  </Button>
                  <Button
                    isDisabled={saveDoctorProfile.isPending}
                    type="submit"
                  >
                    {saveDoctorProfile.isPending
                      ? "Saving\u2026"
                      : "Save Profile"}
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

function ProfileInfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <Card.Header className="gap-1.5">
        {icon}
        <Card.Title>{title}</Card.Title>
      </Card.Header>
      <Separator />
      <Card.Content className="flex flex-col gap-0 p-0">
        {children}
      </Card.Content>
    </Card>
  );
}

function ProfileField({
  label,
  value,
  onAdd,
}: {
  label: string;
  value: string | null;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <p className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        {value ? (
          <p className="text-foreground/80 text-sm">{value}</p>
        ) : (
          <p className="text-muted-foreground/60 text-sm italic">Not set</p>
        )}
      </div>
      {!value && (
        <Button onPress={onAdd} variant="ghost">
          <Plus className="size-3" />
          Add
        </Button>
      )}
    </div>
  );
}

function TagCard({
  icon,
  title,
  items,
  labelMap,
  onAdd,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  labelMap: Record<string, string>;
  onAdd: () => void;
}) {
  return (
    <Card>
      <Card.Header className="gap-1.5">
        {icon}
        <Card.Title>{title}</Card.Title>
      </Card.Header>
      <Separator />
      <Card.Content className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {items.length > 0 ? (
            items.map((value) => (
              <Chip key={value} variant="secondary">
                {labelMap[value] ?? value}
              </Chip>
            ))
          ) : (
            <Chip className="cursor-pointer" onClick={onAdd} variant="primary">
              <Plus className="size-3" />
              Add {title}
            </Chip>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}

function ProfileInputField<N extends FieldPath<DoctorProfileFormInput>>({
  name,
  label,
  placeholder,
  type = "text",
  error,
  register,
  min,
}: {
  name: N;
  label: string;
  placeholder: string;
  type?: string;
  error?: { message?: string };
  register: UseFormRegister<DoctorProfileFormInput>;
  min?: number;
}) {
  const inputProps = { ...register(name), min, placeholder, type };
  return (
    <TextField isInvalid={!!error} name={name}>
      <Label>{label}</Label>
      <Input {...inputProps} />
      <FieldError>{error?.message as string}</FieldError>
    </TextField>
  );
}

function ProfileTextAreaField<N extends FieldPath<DoctorProfileFormInput>>({
  name,
  label,
  placeholder,
  error,
  register,
}: {
  name: N;
  label: string;
  placeholder: string;
  error?: { message?: string };
  register: UseFormRegister<DoctorProfileFormInput>;
}) {
  return (
    <TextField isInvalid={!!error} name={name}>
      <Label>{label}</Label>
      <TextArea
        className="min-h-[100px]"
        placeholder={placeholder}
        {...register(name)}
      />
      <FieldError>{error?.message as string}</FieldError>
    </TextField>
  );
}

function MultiSelectField({
  label,
  description,
  options,
  selectedKeys,
  onSelectionChange,
  labelMap,
}: {
  label: string;
  description: string;
  options: readonly string[];
  selectedKeys: "all" | Set<string | number>;
  onSelectionChange: (keys: "all" | Set<string | number>) => void;
  labelMap: Record<string, string>;
}) {
  return (
    <Fieldset>
      <Fieldset.Legend>{label}</Fieldset.Legend>
      <Description>{description}</Description>
      <Fieldset.Group>
        <ToggleButtonGroup
          className="flex flex-wrap gap-1.5 pt-2"
          isDetached
          onSelectionChange={onSelectionChange}
          selectedKeys={selectedKeys}
          selectionMode="multiple"
        >
          {options.map((value) => (
            <ToggleButton id={value} key={value}>
              {labelMap[value]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Fieldset.Group>
    </Fieldset>
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
      <Fieldset.Group className="flex flex-col gap-2">
        {items.length === 0 && (
          <p className="text-muted-foreground text-sm">{emptyLabel}</p>
        )}
        {items.map((item, index) => (
          <Card
            className={cn(draggedIndex === index && "ring-2 ring-primary/50")}
            key={item.id}
          >
            <Card.Content className="flex flex-row items-start gap-2 p-3">
              <div
                className="mt-1 cursor-grab active:cursor-grabbing"
                draggable
                onDragOver={(e) => e.preventDefault()}
                onDragStart={() => onDragStart(index)}
                onDrop={() => {
                  if (draggedIndex !== null) {
                    onDropIndex(draggedIndex, index);
                  }
                }}
              >
                <GripVertical className="size-4 text-muted-foreground/50" />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <p className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-wider">
                  Step {index + 1}
                </p>
                <TextArea
                  className="min-h-[64px]"
                  onChange={(e) => {
                    const next = [...items];
                    next[index] = { ...item, text: e.target.value };
                    onChange(next);
                  }}
                  placeholder="e.g. Initial Consultation \u2014 Understanding your goals and assessing therapeutic options."
                  value={item.text}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  isDisabled={index === 0}
                  isIconOnly
                  onPress={() => moveItem(index, -1)}
                  variant="outline"
                >
                  <ChevronUp className="size-3.5" />
                </Button>
                <Button
                  isDisabled={index === items.length - 1}
                  isIconOnly
                  onPress={() => moveItem(index, 1)}
                  variant="outline"
                >
                  <ChevronDown className="size-3.5" />
                </Button>
                <Button
                  isIconOnly
                  onPress={() => onChange(items.filter((_, i) => i !== index))}
                  variant="outline"
                >
                  <Trash2 className="size-3.5 text-rose-500" />
                </Button>
              </div>
            </Card.Content>
          </Card>
        ))}
        <Button onPress={addItem} variant="outline">
          <Plus className="size-3.5" />
          Add Step
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
      <Fieldset.Legend>Education &amp; Degrees</Fieldset.Legend>
      <Description>
        Add your academic credentials and training programs.
      </Description>
      <Fieldset.Group className="flex flex-col gap-2">
        {rows.length === 0 && (
          <p className="text-center text-muted-foreground text-sm">
            No education history added yet.
          </p>
        )}
        {rows.map((row, index) => (
          <Card key={row.id}>
            <Card.Header className="justify-between">
              <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Entry {index + 1}
              </p>
              <Button
                onPress={() => setRows(rows.filter((_, i) => i !== index))}
                variant="outline"
              >
                <Trash2 className="size-3.5 text-rose-500" />
                Remove
              </Button>
            </Card.Header>
            <Separator />
            <Card.Content className="grid gap-2 md:grid-cols-3">
              <Input
                onChange={(e) =>
                  updateEducationRow(
                    rows,
                    setRows,
                    index,
                    "institution",
                    e.target.value
                  )
                }
                placeholder="Institution (e.g. Stanford)"
                value={row.institution}
              />
              <Input
                onChange={(e) =>
                  updateEducationRow(
                    rows,
                    setRows,
                    index,
                    "degree",
                    e.target.value
                  )
                }
                placeholder="Degree (e.g. M.Sc. Counseling)"
                value={row.degree}
              />
              <Input
                onChange={(e) =>
                  updateEducationRow(
                    rows,
                    setRows,
                    index,
                    "year",
                    e.target.value
                  )
                }
                placeholder="Year (e.g. 2018)"
                type="number"
                value={row.year}
              />
            </Card.Content>
          </Card>
        ))}
        <Button onPress={addRow} variant="outline">
          <Plus className="size-3.5" />
          Add Education
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
