import { useUser } from "@clerk/tanstack-react-start";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  Outlet,
  useLoaderData,
} from "@tanstack/react-router";
import { Button, buttonVariants } from "@zen-doc/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@zen-doc/ui/components/dialog";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@zen-doc/ui/components/sidebar";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DoctorSidebar } from "@/components/doctor-sidebar";
import { orpc } from "@/utils/orpc";

export interface DoctorProfileData {
  profile: {
    userId: string;
    bio: string | null;
    licenseNumber: string | null;
    permanent: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
  role: string | null;
}

const doctorProfileFormSchema = z.object({
  bio: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(500).optional()
  ),
  licenseNumber: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(64).optional()
  ),
});

type DoctorProfileFormInput = z.input<typeof doctorProfileFormSchema>;
type DoctorProfileFormValues = z.output<typeof doctorProfileFormSchema>;

export const Route = createFileRoute("/doctor")({
  loader: async ({ context }): Promise<{ initialData: DoctorProfileData }> => {
    try {
      const initialData =
        await context.queryClient.fetchQuery<DoctorProfileData>({
          queryKey: orpc.doctorProfile.queryKey(),
          queryFn: () => orpc.doctorProfile.call(),
        });

      return { initialData };
    } catch {
      return { initialData: { profile: null, role: null } };
    }
  },
  component: DoctorLayoutRoute,
});

function DoctorLayoutRoute() {
  const user = useUser();
  const loaderData = useLoaderData({ from: "/doctor" });
  const queryKey = orpc.doctorProfile.queryKey();
  const doctorProfileQuery = useQuery({
    queryKey,
    queryFn: () => orpc.doctorProfile.call(),
    initialData: loaderData.initialData,
    enabled: user.isLoaded && !!user.user,
  });
  const saveDoctorProfile = useMutation(
    orpc.saveDoctorProfile.mutationOptions({
      onSuccess: async () => {
        await doctorProfileQuery.refetch();
      },
    })
  );

  const profile = doctorProfileQuery.data?.profile;
  const showOnboarding = !profile;
  const form = useForm<
    DoctorProfileFormInput,
    undefined,
    DoctorProfileFormValues
  >({
    resolver: zodResolver(doctorProfileFormSchema),
    defaultValues: getDoctorProfileFormValues(
      loaderData.initialData.profile ?? null
    ),
  });

  useEffect(() => {
    form.reset(getDoctorProfileFormValues(profile ?? null));
  }, [form, profile]);

  if (!user.isLoaded) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user.user) {
    return (
      <div className="fade-in flex min-h-screen animate-in items-center justify-center bg-background px-4 duration-200">
        <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center shadow-xl">
          <h1 className="font-semibold text-2xl">Sign In Required</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Please sign in to access the Doctor Portal.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              className={buttonVariants({
                variant: "default",
                className: "flex w-full justify-center py-2",
              })}
              to="/sign-in"
            >
              Sign In
            </Link>
            <Link
              className={buttonVariants({
                variant: "outline",
                className: "flex w-full justify-center py-2",
              })}
              to="/"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const name = user.user.fullName ?? user.user.username ?? "Doctor";

  const submitProfile = form.handleSubmit((values: DoctorProfileFormValues) => {
    saveDoctorProfile.mutate(values);
  });

  return (
    <SidebarProvider>
      <DoctorSidebar />
      <SidebarInset>
        <div className="flex min-h-svh flex-col">
          <header className="flex items-center gap-3 border-b px-6 py-4">
            <SidebarTrigger />
            <div className="min-w-0">
              <p className="font-medium">Doctor Portal</p>
              <p className="truncate text-muted-foreground text-sm">
                Signed in as {name}
              </p>
            </div>
          </header>
          <div className="flex-1">
            <Outlet />
          </div>
        </div>

        {showOnboarding ? (
          <Dialog onOpenChange={() => undefined} open>
            <DialogContent
              className="max-w-lg gap-6 p-6"
              showCloseButton={false}
            >
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  Doctor Onboarding
                </DialogTitle>
                <DialogDescription>
                  Please complete your profile to access the doctor portal.
                </DialogDescription>
              </DialogHeader>

              <form className="flex flex-col gap-4" onSubmit={submitProfile}>
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-sm" htmlFor="bio">
                    Bio
                  </label>
                  <textarea
                    aria-invalid={!!form.formState.errors.bio}
                    className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    id="bio"
                    placeholder="Tell us about your background, specialties, and experience..."
                    {...form.register("bio")}
                  />
                  {form.formState.errors.bio ? (
                    <p className="text-destructive text-sm">
                      {form.formState.errors.bio.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    className="font-medium text-sm"
                    htmlFor="licenseNumber"
                  >
                    License number
                  </label>
                  <input
                    aria-invalid={!!form.formState.errors.licenseNumber}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    id="licenseNumber"
                    placeholder="e.g. LIC12345678"
                    {...form.register("licenseNumber")}
                  />
                  {form.formState.errors.licenseNumber ? (
                    <p className="text-destructive text-sm">
                      {form.formState.errors.licenseNumber.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Link
                    className={buttonVariants({ variant: "outline" })}
                    to="/"
                  >
                    Home
                  </Link>
                  <Button disabled={saveDoctorProfile.isPending} type="submit">
                    {saveDoctorProfile.isPending
                      ? "Saving..."
                      : "Save & Complete"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </SidebarInset>
    </SidebarProvider>
  );
}

function getDoctorProfileFormValues(
  profile: { bio: string | null; licenseNumber: string | null } | null
): DoctorProfileFormValues {
  return {
    bio: profile?.bio ?? "",
    licenseNumber: profile?.licenseNumber ?? "",
  };
}
