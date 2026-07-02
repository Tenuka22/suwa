"use client";

import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Stethoscope } from "lucide-react";
import type { ReactNode } from "react";

import { getMediaUrl } from "../../../utils/media-url";
import { orpc } from "../../../utils/orpc";

interface LandingDoctor {
  affiliations: Array<{ tenantName: string }>;
  hasAvailability: boolean;
  portrait?: {
    fileKey: string | null;
    thumbnailKey: string | null;
  } | null;
  profile: {
    displayName: string | null;
    focusAreas: string[];
    headline: string | null;
    languages: string[];
    specialties: string[];
    userId: string;
  };
}

function DoctorPortrait({
  portrait,
  name,
}: {
  name: string;
  portrait?: { fileKey: string | null; thumbnailKey: string | null } | null;
}) {
  const src = getMediaUrl(portrait?.thumbnailKey ?? portrait?.fileKey);

  if (!src) {
    return (
      <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-[24px] bg-primary-subtle text-primary">
        <Stethoscope aria-hidden="true" size={34} />
      </div>
    );
  }

  return (
    <img
      alt={name}
      className="h-[88px] w-[88px] shrink-0 rounded-[24px] object-cover"
      height={88}
      src={src}
      width={88}
    />
  );
}

function formatList(items: string[]): string {
  return items.join(" · ");
}

export function Doctors() {
  const { data, isPending } = useQuery(
    orpc.listDoctors.queryOptions({
      input: { page: 1, pageSize: 4, search: "" },
    })
  );

  const doctorsData = data as { doctors?: LandingDoctor[] } | undefined;
  const doctors = doctorsData?.doctors ?? [];

  let doctorCards: ReactNode;

  if (isPending) {
    doctorCards = [1, 2, 3, 4].map((i) => (
      <article
        className="rounded-[22px] border border-border bg-[rgb(255_253_248_/_80%)] p-[22px] shadow-[0_12px_30px_rgb(52_66_59_/_5%)]"
        key={i}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 rounded-full bg-foreground/10" />
          <div className="h-4 w-28 rounded-full bg-foreground/10" />
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full bg-foreground/10" />
            <div className="h-6 w-20 rounded-full bg-foreground/10" />
            <div className="h-6 w-24 rounded-full bg-foreground/10" />
          </div>
          <div className="h-12 rounded-[18px] bg-foreground/10" />
        </div>
      </article>
    ));
  } else if (doctors.length === 0) {
    doctorCards = (
      <article className="rounded-[22px] border border-border border-dashed bg-[rgb(255_253_248_/_72%)] p-[28px] text-center shadow-[0_12px_30px_rgb(52_66_59_/_5%)] lg:col-span-2">
        <p className="m-0 font-normal font-serif text-[24px] leading-[1.1] tracking-[-0.03em]">
          No doctors are published yet.
        </p>
        <p className="mx-auto mt-[10px] mb-0 max-w-[420px] text-[13px] text-foreground-muted leading-[1.7]">
          Published profiles will appear here with specialties and language
          support.
        </p>
      </article>
    );
  } else {
    doctorCards = doctors.map(({ profile, hasAvailability, portrait }) => (
      <article
        className="rounded-[22px] border border-border bg-[rgb(255_253_248_/_80%)] p-[24px] shadow-[0_12px_30px_rgb(52_66_59_/_5%)]"
        key={profile.userId}
      >
        <div className="flex items-start gap-[14px]">
          <DoctorPortrait
            name={profile.displayName ?? "Doctor"}
            portrait={portrait}
          />
          <div className="min-w-0 flex-1">
            <h3 className="m-0 font-normal font-serif text-[24px] leading-[1.05] tracking-[-0.035em]">
              {profile.displayName ?? "Doctor"}
            </h3>
            <p className="m-0 mt-[6px] text-[11px] text-foreground-muted uppercase tracking-[0.08em]">
              {profile.headline ?? "Licensed professional"}
            </p>
          </div>
          <span className="whitespace-nowrap rounded-full bg-[#426156]/12 px-[10px] py-[5px] text-[#426156] text-[8px]">
            <BadgeCheck aria-hidden="true" className="inline" size={11} />{" "}
            Verified
          </span>
        </div>

        <div className="mt-[18px] flex flex-wrap gap-[8px] text-[12px]">
          <span className="rounded-full bg-[#edf2ed] px-[10px] py-[5px] text-[#31423d]">
            {profile.specialties.length > 0
              ? formatList(profile.specialties.slice(0, 2))
              : "Specialty pending"}
          </span>
          <span className="rounded-full bg-[#f5efe3] px-[10px] py-[5px] text-[#31423d]">
            {profile.languages.length > 0
              ? formatList(profile.languages.slice(0, 2))
              : "Language pending"}
          </span>
          <span className="rounded-full bg-[#efe9f4] px-[10px] py-[5px] text-[#31423d]">
            {hasAvailability ? "Available" : "Availability pending"}
          </span>
        </div>

        <div className="mt-[18px] text-[14px] text-foreground-secondary leading-[1.65]">
          <div className="flex items-start gap-[10px]">
            <Stethoscope
              aria-hidden="true"
              className="mt-[1px] shrink-0"
              size={16}
            />
            <span>
              {profile.focusAreas.length > 0
                ? formatList(profile.focusAreas.slice(0, 2))
                : "Focus areas not listed yet."}
            </span>
          </div>
        </div>
      </article>
    ));
  }

  return (
    <section className="page-shell pt-[96px] pb-[110px] max-xl:pt-[76px] max-xl:pb-[82px]">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-[34px] max-w-[720px]">
          <span className="block font-medium text-[12px] text-accent uppercase tracking-[0.12em]">
            Doctors on the platform
          </span>
          <h2 className="mt-[12px] mb-[14px] font-normal font-serif text-[clamp(38px,4vw,54px)] leading-[1.08] tracking-[-0.04em]">
            Real doctors, real profiles.
          </h2>
          <p className="m-0 text-[14px] text-foreground-muted leading-[1.8]">
            Browse verified doctors from the same data model used by the web and
            native apps.
          </p>
        </div>

        <div className="grid gap-[18px] lg:grid-cols-2">{doctorCards}</div>
      </div>
    </section>
  );
}
