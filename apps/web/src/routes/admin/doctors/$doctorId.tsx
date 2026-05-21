import { SignInButton, useUser } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
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
import {
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

interface DoctorProfileView {
  approach: string | null;
  approachSteps: { id: string; text: string }[];
  bio: string | null;
  consultationModes: string[];
  createdAt: string;
  displayName: string | null;
  education: string | null;
  experienceStartYear: number | null;
  focusAreas: string[];
  headline: string | null;
  languages: string[];
  licenseNumber: string | null;
  location: string | null;
  permanent: boolean;
  placeAddress: string | null;
  placeDescription: string | null;
  placeName: string | null;
  specialties: string[];
  stripeAccountEnabled: boolean | null;
}

interface DoctorEducationView {
  degree: string;
  id: string;
  institution: string;
  year: number | null;
}

export const Route = createFileRoute("/admin/doctors/$doctorId")({
  loader: async ({
    context,
    params,
  }): Promise<{
    initialData: {
      profile: DoctorProfileView | null;
      files: {
        id: string;
        caption: string | null;
        fileKind: string;
        fileName: string;
      }[];
      education: DoctorEducationView[];
      portrait: { id: string } | null;
    };
  }> => {
    const input = { doctorId: params.doctorId };
    try {
      const initialData = await context.queryClient.fetchQuery({
        queryKey: orpc.getDoctor.queryKey({ input }),
        queryFn: () => orpc.getDoctor.call(input),
      });
      return {
        initialData: {
          profile: initialData?.profile ?? null,
          files: initialData?.files ?? [],
          education: initialData?.education ?? [],
          portrait: initialData?.portrait ?? null,
        },
      };
    } catch {
      return {
        initialData: {
          profile: null,
          files: [],
          education: [],
          portrait: null,
        },
      };
    }
  },
  component: AdminDoctorDetailRoute,
});

function AdminDoctorDetailRoute() {
  const user = useUser();
  const router = useRouter();
  const params = Route.useParams();
  const loaderData = Route.useLoaderData();
  const doctorId = params.doctorId;

  const doctorQuery = useQuery({
    queryKey: orpc.getDoctor.queryKey({ input: { doctorId } }),
    queryFn: () => orpc.getDoctor.call({ doctorId }),
    initialData: {
      profile: loaderData?.initialData.profile ?? null,
      files: loaderData?.initialData.files ?? [],
      education: loaderData?.initialData.education ?? [],
      portrait: loaderData?.initialData.portrait ?? null,
    },
    enabled: !!doctorId,
  });

  const profile = doctorQuery.data?.profile;
  const files = doctorQuery.data?.files ?? [];

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
    return <div className="p-6">Loading...</div>;
  }
  if (!user.user) {
    return (
      <div className="p-6">
        <SignInButton />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Button
          onClick={() =>
            router.navigate({
              to: "/admin/doctors",
              search: { page: 1, query: "" },
            })
          }
          size="sm"
          variant="outline"
        >
          Back to list
        </Button>
      </div>

      {profile ? (
        <>
          <Card>
            <CardHeader className="flex flex-col gap-4 border-border/30 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar
                  className="size-16 border-2 border-primary/20 shadow-md"
                  size="lg"
                >
                  {profile.placeName ? (
                    <AvatarImage alt={displayName} src={profile.placeName} />
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
                      {profile.permanent ? (
                        <>
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                          Approved
                        </>
                      ) : (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Pending Approval
                        </>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-muted-foreground text-sm">
                    {profile.headline ?? "No professional headline set yet"}
                  </p>
                </div>
              </div>
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
                    value={profile.location ?? "Not set"}
                  />
                  <SummaryItem
                    icon={
                      <Building className="size-3.5 text-muted-foreground" />
                    }
                    label="Practice Address"
                    value={profile.placeAddress ?? "Not set"}
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
                    icon={
                      <FileText className="size-3.5 text-muted-foreground" />
                    }
                    label="License Number"
                    value={profile.licenseNumber ?? "Not set"}
                  />
                  <SummaryItem
                    icon={
                      <Building className="size-3.5 text-muted-foreground" />
                    }
                    label="Practice Place Name"
                    value={profile.placeName ?? "Not set"}
                  />
                  <SummaryItem
                    icon={
                      <FileText className="size-3.5 text-muted-foreground" />
                    }
                    label="Place Description"
                    value={profile.placeDescription ?? "No description added"}
                  />
                </div>
              </div>

              <div className="space-y-2 border-border/20 border-t pt-4 md:col-span-2">
                <h3 className="font-semibold text-foreground/80 text-sm tracking-tight">
                  Biography
                </h3>
                <p className="rounded-xl border border-border/30 bg-muted/5 p-4 text-foreground/90 text-sm italic leading-relaxed">
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
                    Doctor Materials
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    Uploaded certificates, professional portraits, and video
                    bios.
                  </p>
                </div>
                <Badge
                  className="shrink-0 self-start sm:self-auto"
                  variant="outline"
                >
                  {files.length} file{files.length === 1 ? "" : "s"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <DoctorFilesPanel
            canManage={false}
            doctorId={doctorId}
            isPermanent={profile.permanent ?? false}
          />
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Doctor not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              That public profile does not exist yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
