"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Stethoscope } from "lucide-react";

import { orpc } from "../../../utils/orpc";

interface LandingDoctor {
  affiliations: Array<{ tenantName: string }>;
  hasAvailability: boolean;
  profile: {
    displayName: string | null;
    focusAreas: string[];
    headline: string | null;
    languages: string[];
    specialties: string[];
    userId: string;
  };
}

function formatList(items: string[]): string {
  return items.join(" · ");
}

export function Doctors() {
  const { data, isPending } = useQuery<any>(
    orpc.listDoctors.queryOptions({
      input: { page: 1, pageSize: 3, search: "" },
    })
  );

  const doctors = ((data?.doctors ?? []) as Array<{
    affiliations: Array<{ tenantName: string }>;
    hasAvailability: boolean;
    profile: {
      displayName: string | null;
      focusAreas?: string[];
      headline: string | null;
      languages?: string[];
      specialties?: string[];
      userId: string;
    };
  }>) as LandingDoctor[];

  return (
    <section className="page-shell pt-[96px] pb-[110px] max-landing-md:pt-[76px] max-landing-md:pb-[82px]">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-[34px] max-w-[640px]">
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

        <div className="grid gap-[18px] lg:grid-cols-3">
          {isPending
            ? [1, 2, 3].map((i) => (
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
                    <div className="h-12 rounded-[18px] bg-foreground/10" />
                  </div>
                </article>
              ))
            : doctors.length === 0
              ? (
                <article className="rounded-[22px] border border-dashed border-border bg-[rgb(255_253_248_/_72%)] p-[28px] text-center shadow-[0_12px_30px_rgb(52_66_59_/_5%)] lg:col-span-3">
                  <p className="m-0 font-normal font-serif text-[24px] leading-[1.1] tracking-[-0.03em]">
                    No doctors are published yet.
                  </p>
                  <p className="mx-auto mt-[10px] mb-0 max-w-[420px] text-[13px] text-foreground-muted leading-[1.7]">
                    Once profiles are marked permanent, they’ll appear here with
                    specialties, language support, and hospital affiliations.
                  </p>
                </article>
              )
            : doctors.map(({ profile, affiliations, hasAvailability }) => (
            <article
              className="rounded-[22px] border border-border bg-[rgb(255_253_248_/_80%)] p-[22px] shadow-[0_12px_30px_rgb(52_66_59_/_5%)]"
              key={profile.userId}
            >
              <div className="flex items-start justify-between gap-[12px]">
                <div>
                  <h3 className="m-0 font-normal font-serif text-[24px] leading-[1.05] tracking-[-0.035em]">
                    {profile.displayName ?? "Doctor"}
                  </h3>
                  <p className="m-0 mt-[6px] text-[11px] text-foreground-muted uppercase tracking-[0.08em]">
                    {profile.headline ?? "Licensed professional"}
                  </p>
                </div>
                <span className="rounded-full bg-[#426156]/12 px-[10px] py-[5px] text-[8px] text-[#426156]">
                  <BadgeCheck aria-hidden="true" className="inline" size={11} />{' '}
                  Verified
                </span>
              </div>

              <div className="mt-[16px] flex flex-wrap gap-[8px] text-[10px]">
                <span className="rounded-full bg-[#edf2ed] px-[10px] py-[5px] text-[#31423d]">
                  {profile.specialties.length > 0
                    ? formatList(profile.specialties)
                    : "Specialty pending"}
                </span>
                <span className="rounded-full bg-[#f5efe3] px-[10px] py-[5px] text-[#31423d]">
                  {profile.languages.length > 0
                    ? formatList(profile.languages)
                    : "Language pending"}
                </span>
                <span className="rounded-full bg-[#efe9f4] px-[10px] py-[5px] text-[#31423d]">
                  {hasAvailability ? "Available" : "Availability pending"}
                </span>
              </div>

              <div className="mt-[16px] space-y-[10px] text-[12px] text-foreground-secondary leading-[1.65]">
                <div className="flex items-start gap-[10px]">
                  <Stethoscope aria-hidden="true" className="mt-[1px] shrink-0" size={16} />
                  <span>
                    {profile.focusAreas.length > 0
                      ? formatList(profile.focusAreas)
                      : "Focus areas not listed yet."}
                  </span>
                </div>
                <div className="flex items-start gap-[10px]">
                  <ArrowRight aria-hidden="true" className="mt-[1px] shrink-0" size={16} />
                  <span>
                    {affiliations.length > 0
                      ? affiliations.map((affiliation) => affiliation.tenantName).join(" · ")
                      : "No active hospital affiliations yet."}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
