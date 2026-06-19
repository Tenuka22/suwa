import { SignInButton, useUser } from "@clerk/tanstack-react-start";
import { Avatar, Button, Chip, Separator, Skeleton } from "@heroui/react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  Award,
  Building,
  Clock,
  FileText,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useMemo } from "react";

import {
  DoctorFilesPanel,
  SummaryBlock,
  SummaryItem,
} from "@/components/doctors";
import { BodyText, PageTitle } from "@/components/typography";
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
  parseApproachSteps,
  parseEducationRows,
} from "@/utils/doctor/profile-utils";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/admin/doctors/$doctorId")({
  loader: async ({ context, params }) => {
    const input = { doctorId: params.doctorId };
    return context.queryClient.ensureQueryData(
      orpc.getDoctor.queryOptions({ input })
    );
  },
  component: AdminDoctorDetailRoute,
});

function AdminDoctorDetailRoute() {
  const user = useUser();
  const router = useRouter();
  const params = Route.useParams();
  const data = Route.useLoaderData();
  const doctorId = params.doctorId;

  const profile = data?.profile;
  const files = data?.files ?? [];

  const displayName =
    profile?.displayName ?? profile?.licenseNumber ?? "Doctor";
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

  if (!user.isLoaded) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-52 rounded-[2rem]" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }
  if (!user.user) {
    return (
      <div className="p-6">
        <SignInButton />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="relative h-44 overflow-hidden rounded-[2rem] bg-gradient-to-b from-accent/10 via-accent/5 to-background md:h-52" />

      <div className="relative z-10 -mt-16 flex flex-col gap-4 px-6">
        <Button
          className="w-fit"
          onPress={() =>
            router.navigate({
              to: "/admin/doctors",
              search: { page: 1, query: "" },
            })
          }
          size="sm"
          variant="outline"
        >
          <ArrowLeftIcon className="size-4" />
          Back to list
        </Button>

        <div className="flex items-center gap-5">
          <Avatar
            className="size-16 border-2 border-primary/20 shadow-md"
            size="lg"
          >
            {profile?.placeName ? (
              <Avatar.Image alt={displayName} src={profile.placeName} />
            ) : null}
            <Avatar.Fallback className="bg-primary/10 font-semibold text-lg text-primary">
              {displayName.slice(0, 2).toUpperCase()}
            </Avatar.Fallback>
          </Avatar>

          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3">
              <h1 className="font-light text-2xl tracking-tight">
                {displayName}
              </h1>
              {profile?.permanent ? (
                <Chip color="success" variant="soft">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Approved
                </Chip>
              ) : (
                <Chip color="warning" variant="soft">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Pending
                </Chip>
              )}
            </div>
            <BodyText className="max-w-2xl">
              {profile?.headline ?? "No professional headline set yet"}
            </BodyText>
          </div>
        </div>
      </div>

      {profile ? (
        <>
          <Separator />

          <section className="flex flex-col gap-2 px-6">
            <PageTitle>Profile details</PageTitle>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <h3 className="flex items-center gap-2 font-medium text-foreground/60 text-xs uppercase tracking-wide">
                  <Building className="size-4 text-primary" />
                  Practice Details
                </h3>
                <div className="grid gap-4 rounded-xl border border-border px-4 py-3">
                  <SummaryItem
                    icon={<Clock className="size-3.5 text-foreground/60" />}
                    label="Experience"
                    value={experienceLabel}
                  />
                  <SummaryItem
                    icon={<MapPin className="size-3.5 text-foreground/60" />}
                    label="Location"
                    value={profile.location ?? "Not set"}
                  />
                  <SummaryItem
                    icon={<Building className="size-3.5 text-foreground/60" />}
                    label="Practice Address"
                    value={profile.placeAddress ?? "Not set"}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="flex items-center gap-2 font-medium text-foreground/60 text-xs uppercase tracking-wide">
                  <Award className="size-4 text-primary" />
                  Professional Info
                </h3>
                <div className="grid gap-4 rounded-xl border border-border px-4 py-3">
                  <SummaryItem
                    icon={<FileText className="size-3.5 text-foreground/60" />}
                    label="License Number"
                    value={profile.licenseNumber ?? "Not set"}
                  />
                  <SummaryItem
                    icon={<Building className="size-3.5 text-foreground/60" />}
                    label="Practice Place Name"
                    value={profile.placeName ?? "Not set"}
                  />
                  <SummaryItem
                    icon={<FileText className="size-3.5 text-foreground/60" />}
                    label="Place Description"
                    value={profile.placeDescription ?? "No description added"}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 border-border/20 border-t pt-4 md:col-span-2">
                <h3 className="font-medium text-foreground/60 text-xs uppercase tracking-wide">
                  Biography
                </h3>
                <p className="rounded-xl border border-border px-4 py-3 text-foreground/90 text-sm italic leading-relaxed">
                  "{profile.bio ?? "No biography provided yet."}"
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
                <div className="flex flex-col gap-3 border-border/20 border-t pt-4 md:col-span-2">
                  <h3 className="flex items-center gap-2 font-medium text-foreground/60 text-xs uppercase tracking-wide">
                    <Sparkles className="size-4 text-primary" />
                    Therapeutic Approach
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {stepsList.map((step, idx) => (
                      <div
                        className="relative rounded-xl border border-border px-4 py-3 transition-colors hover:bg-foreground/5"
                        key={step.id}
                      >
                        <span className="absolute top-2.5 right-3 rounded-full bg-foreground/10 font-mono text-[10px] text-foreground/40 uppercase tracking-wider">
                          Step {idx + 1}
                        </span>
                        <p className="font-light text-foreground/80 text-sm leading-relaxed">
                          {step.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsedEducation.length > 0 && (
                <div className="flex flex-col gap-3 border-border/20 border-t pt-4 md:col-span-2">
                  <h3 className="flex items-center gap-2 font-medium text-foreground/60 text-xs uppercase tracking-wide">
                    <Award className="size-4 text-primary" />
                    Education & Credentials
                  </h3>
                  <div className="divide-y divide-border/30 overflow-hidden rounded-xl border border-border">
                    {parsedEducation.map((edu) => (
                      <div
                        className="flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-foreground/5"
                        key={edu.id}
                      >
                        <div className="flex flex-col gap-0.5">
                          <p className="text-foreground/80">{edu.degree}</p>
                          <p className="text-foreground/60 text-xs">
                            {edu.institution}
                          </p>
                        </div>
                        {edu.year && (
                          <span className="rounded-full border bg-foreground/5 px-2 py-0.5 font-mono text-foreground/60 text-xs">
                            {edu.year}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4 rounded-xl border border-border border-dashed px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:col-span-2">
                <div className="flex flex-col gap-1">
                  <h3 className="flex items-center gap-1.5 font-medium text-foreground/60 text-xs uppercase tracking-wide">
                    <FileText className="size-4" />
                    Doctor Materials
                  </h3>
                  <p className="text-foreground/60 text-xs">
                    Uploaded certificates, professional portraits, and video
                    bios.
                  </p>
                </div>
                <Chip
                  className="shrink-0 self-start sm:self-auto"
                  variant="secondary"
                >
                  {files.length} file{files.length === 1 ? "" : "s"}
                </Chip>
              </div>
            </div>
          </section>

          <Separator />

          <section className="flex flex-col gap-3 px-6">
            <div>
              <PageTitle>Doctor materials</PageTitle>
              <p className="font-light text-foreground/60 text-sm">
                Uploaded certificates, professional portraits, and video bios.
              </p>
            </div>
            <DoctorFilesPanel
              canManage={false}
              doctorId={doctorId}
              isPermanent={profile.permanent ?? false}
            />
          </section>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-16">
          <div className="rounded-full border border-border border-dashed bg-foreground/5 p-4">
            <Award className="size-8 text-foreground/40" />
          </div>
          <p className="font-light text-sm">Doctor not found</p>
          <p className="max-w-xs font-light text-foreground/60 text-sm">
            That public profile does not exist yet.
          </p>
        </div>
      )}
    </div>
  );
}
