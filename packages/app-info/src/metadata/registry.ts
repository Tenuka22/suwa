import type {
  RouteKey,
  LandingRouteKey,
  WebRouteKey,
  NativeRouteKey,
  RouteMeta,
  SeoConfig,
  OpenGraphConfig,
  TwitterCardConfig,
} from "./types";

const BASE_URL = "https://suwa.life";
const SITE_NAME = "Suwa";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-default.png`;

interface BaseSeoParams {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  robots?: SeoConfig["robots"];
  og?: Partial<OpenGraphConfig>;
  twitter?: Partial<TwitterCardConfig>;
}

function baseSeo(config: BaseSeoParams): SeoConfig {
  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    canonical: config.canonical,
    robots: config.robots ?? { index: true, follow: true },
    og: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      images: [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME }],
      title: config.title,
      description: config.description,
      ...config.og,
    },
  };
}

export const LANDING_ROUTES: Record<LandingRouteKey, RouteMeta> = {
  "landing:home": {
    key: "landing:home",
    platform: "landing",
    path: "/",
    seo: baseSeo({
      title: "Suwa - Mental Health Support for Students and Healthcare Workers",
      description:
        "Connect with licensed therapists and mental health professionals through secure video sessions. Designed for students and healthcare workers. Book your first appointment today.",
      keywords: [
        "mental health",
        "therapy",
        "telehealth",
        "video therapy",
        "mental wellness",
        "stress management",
        "student mental health",
        "healthcare worker support",
      ],
      canonical: BASE_URL,
      og: {
        title: "Suwa - Mental Health Support for Students and Healthcare Workers",
        description:
          "Connect with licensed therapists and mental health professionals through secure video sessions. Designed for students and healthcare workers.",
      },
      twitter: {
        title: "Suwa - Mental Health Support for Students and Healthcare Workers",
        description:
          "Connect with licensed therapists and mental health professionals through secure video sessions.",
      },
    }),
    native: {
      screenTitle: "Suwa",
      navBarTitle: "Home",
    },
  },
  "landing:pricing": {
    key: "landing:pricing",
    platform: "landing",
    path: "/pricing",
    seo: baseSeo({
      title: "Pricing - Suwa | Affordable Mental Health Plans",
      description:
        "Explore flexible mental health plans starting at accessible prices. No subscriptions required. Pay per session or choose a monthly plan. Transparent pricing with no hidden fees.",
      keywords: [
        "mental health pricing",
        "therapy cost",
        "affordable therapy",
        "mental health plans",
        "subscription plans",
        "pay per session",
      ],
      canonical: `${BASE_URL}/pricing`,
      og: {
        title: "Pricing - Affordable Mental Health Plans | Suwa",
        description:
          "Flexible mental health plans at accessible prices. No subscriptions required. Pay per session or monthly.",
      },
    }),
    native: {
      screenTitle: "Pricing",
      navBarTitle: "Pricing",
    },
  },
  "landing:contact": {
    key: "landing:contact",
    platform: "landing",
    path: "/contact",
    seo: baseSeo({
      title: "Contact Us - Suwa | Get in Touch",
      description:
        "Have questions about Suwa? Contact our team for support, partnership inquiries, or feedback. We typically respond within 24 hours.",
      keywords: [
        "contact suwa",
        "mental health support",
        "telehealth support",
        "suwa contact",
      ],
      canonical: `${BASE_URL}/contact`,
      og: {
        title: "Contact Us - Get in Touch | Suwa",
        description:
          "Have questions about Suwa? Contact our team for support, partnership inquiries, or feedback.",
      },
    }),
    native: {
      screenTitle: "Contact",
      navBarTitle: "Contact",
    },
  },
};

export const WEB_ROUTES: Record<WebRouteKey, RouteMeta> = {
  "web:index": {
    key: "web:index",
    platform: "web",
    path: "/",
    seo: baseSeo({
      title: "Suwa Dashboard",
      description: "Manage your appointments, sessions, and health data.",
      robots: { index: false, follow: false },
    }),
  },
  "web:sign-in": {
    key: "web:sign-in",
    platform: "web",
    path: "/sign-in",
    seo: baseSeo({
      title: "Sign In - Suwa",
      description: "Sign in to your Suwa account to access your appointments and health sessions.",
      robots: { index: false, follow: false },
    }),
  },
  "web:sign-up": {
    key: "web:sign-up",
    platform: "web",
    path: "/sign-up",
    seo: baseSeo({
      title: "Create Account - Suwa",
      description: "Create your Suwa account and start your mental health journey.",
      robots: { index: false, follow: false },
    }),
  },
  "web:onboarding": {
    key: "web:onboarding",
    platform: "web",
    path: "/onboarding",
    seo: baseSeo({
      title: "Complete Your Profile - Suwa",
      description: "Set up your profile to get personalized mental health recommendations.",
      robots: { index: false, follow: false },
    }),
  },
  "web:admin:index": {
    key: "web:admin:index",
    platform: "web",
    path: "/admin",
    seo: baseSeo({
      title: "Admin Dashboard - Suwa",
      description: "Manage doctors, patients, sessions, and platform settings.",
      robots: { index: false, follow: false },
    }),
  },
  "web:admin:doctors:index": {
    key: "web:admin:doctors:index",
    platform: "web",
    path: "/admin/doctors",
    seo: baseSeo({
      title: "Manage Doctors - Suwa Admin",
      description: "View and manage all registered doctors on the Suwa platform.",
      robots: { index: false, follow: false },
    }),
  },
  "web:admin:doctors:detail": {
    key: "web:admin:doctors:detail",
    platform: "web",
    path: "/admin/doctors/:doctorId",
    seo: baseSeo({
      title: "Doctor Profile - Suwa Admin",
      description: "View detailed profile and credentials for a specific doctor.",
      robots: { index: false, follow: false },
    }),
  },
  "web:admin:patients:index": {
    key: "web:admin:patients:index",
    platform: "web",
    path: "/admin/patients",
    seo: baseSeo({
      title: "Manage Patients - Suwa Admin",
      description: "View and manage all patients registered on the Suwa platform.",
      robots: { index: false, follow: false },
    }),
  },
  "web:admin:sessions:index": {
    key: "web:admin:sessions:index",
    platform: "web",
    path: "/admin/sessions",
    seo: baseSeo({
      title: "All Sessions - Suwa Admin",
      description: "View and manage all therapy sessions across the platform.",
      robots: { index: false, follow: false },
    }),
  },
  "web:admin:sessions:detail": {
    key: "web:admin:sessions:detail",
    platform: "web",
    path: "/admin/session",
    seo: baseSeo({
      title: "Session Details - Suwa Admin",
      description: "View details of a specific therapy session.",
      robots: { index: false, follow: false },
    }),
  },
  "web:admin:plans:index": {
    key: "web:admin:plans:index",
    platform: "web",
    path: "/admin/plans",
    seo: baseSeo({
      title: "Manage Plans - Suwa Admin",
      description: "Configure therapy plans, pricing, and session packages.",
      robots: { index: false, follow: false },
    }),
  },
  "web:admin:doc-requests:index": {
    key: "web:admin:doc-requests:index",
    platform: "web",
    path: "/admin/doc-requests",
    seo: baseSeo({
      title: "Document Requests - Suwa Admin",
      description: "Review and manage pending document verification requests.",
      robots: { index: false, follow: false },
    }),
  },
  "web:admin:chat-settings": {
    key: "web:admin:chat-settings",
    platform: "web",
    path: "/admin/chat-settings",
    seo: baseSeo({
      title: "Chat Settings - Suwa Admin",
      description: "Configure AI chat settings and moderation preferences.",
      robots: { index: false, follow: false },
    }),
  },
  "web:doctor:index": {
    key: "web:doctor:index",
    platform: "web",
    path: "/doctor",
    seo: baseSeo({
      title: "Doctor Portal - Suwa",
      description: "Manage your appointments, availability, and patient sessions.",
      robots: { index: false, follow: false },
    }),
  },
  "web:doctor:availability": {
    key: "web:doctor:availability",
    platform: "web",
    path: "/doctor/availability",
    seo: baseSeo({
      title: "Set Availability - Suwa Doctor Portal",
      description: "Configure your weekly schedule and appointment availability.",
      robots: { index: false, follow: false },
    }),
  },
  "web:doctor:plans": {
    key: "web:doctor:plans",
    platform: "web",
    path: "/doctor/plans",
    seo: baseSeo({
      title: "My Plans - Suwa Doctor Portal",
      description: "Manage your therapy plans and service offerings.",
      robots: { index: false, follow: false },
    }),
  },
  "web:doctor:profile": {
    key: "web:doctor:profile",
    platform: "web",
    path: "/doctor/profile",
    seo: baseSeo({
      title: "My Profile - Suwa Doctor Portal",
      description: "Update your professional profile, credentials, and bio.",
      robots: { index: false, follow: false },
    }),
  },
  "web:doctor:sessions:index": {
    key: "web:doctor:sessions:index",
    platform: "web",
    path: "/doctor/sessions",
    seo: baseSeo({
      title: "My Sessions - Suwa Doctor Portal",
      description: "View and manage your upcoming and past therapy sessions.",
      robots: { index: false, follow: false },
    }),
  },
  "web:doctor:sessions:detail": {
    key: "web:doctor:sessions:detail",
    platform: "web",
    path: "/doctor/sessions/:sessionId",
    seo: baseSeo({
      title: "Session - Suwa Doctor Portal",
      description: "View details of a specific therapy session.",
      robots: { index: false, follow: false },
    }),
  },
  "web:doctor:hub": {
    key: "web:doctor:hub",
    platform: "web",
    path: "/doctor/hub",
    seo: baseSeo({
      title: "Health Hub - Suwa Doctor Portal",
      description: "Access resources, guides, and professional development materials.",
      robots: { index: false, follow: false },
    }),
  },
  "web:doctor:hub:detail": {
    key: "web:doctor:hub:detail",
    platform: "web",
    path: "/doctor/hub/:materialId",
    seo: baseSeo({
      title: "Resource Details - Suwa Doctor Portal",
      description: "View detailed health resource material.",
      robots: { index: false, follow: false },
    }),
  },
  "web:tenant:index": {
    key: "web:tenant:index",
    platform: "web",
    path: "/tenant",
    seo: baseSeo({
      title: "Organization Dashboard - Suwa",
      description: "Manage your organization's healthcare providers and settings.",
      robots: { index: false, follow: false },
    }),
  },
  "web:tenant:create": {
    key: "web:tenant:create",
    platform: "web",
    path: "/tenant/create",
    seo: baseSeo({
      title: "Create Organization - Suwa",
      description: "Set up a new organization on the Suwa platform.",
      robots: { index: false, follow: false },
    }),
  },
  "web:tenant:detail": {
    key: "web:tenant:detail",
    platform: "web",
    path: "/tenant/:tenantId",
    seo: baseSeo({
      title: "Organization - Suwa",
      description: "View and manage your organization settings and team.",
      robots: { index: false, follow: false },
    }),
  },
  "web:tenant:doctors": {
    key: "web:tenant:doctors",
    platform: "web",
    path: "/tenant/:tenantId/doctors",
    seo: baseSeo({
      title: "Doctors - Suwa Organization",
      description: "Manage doctors affiliated with your organization.",
      robots: { index: false, follow: false },
    }),
  },
  "web:tenant:settings": {
    key: "web:tenant:settings",
    platform: "web",
    path: "/tenant/:tenantId/settings",
    seo: baseSeo({
      title: "Organization Settings - Suwa",
      description: "Configure organization profile, branding, and preferences.",
      robots: { index: false, follow: false },
    }),
  },
  "web:tenant:attendance": {
    key: "web:tenant:attendance",
    platform: "web",
    path: "/tenant/:tenantId/attendance",
    seo: baseSeo({
      title: "Attendance - Suwa Organization",
      description: "Track and manage appointment attendance for your organization.",
      robots: { index: false, follow: false },
    }),
  },
  "web:tenant:invite": {
    key: "web:tenant:invite",
    platform: "web",
    path: "/tenant/:tenantId/invite",
    seo: baseSeo({
      title: "Invite Team Members - Suwa Organization",
      description: "Send invitations to doctors and staff to join your organization.",
      robots: { index: false, follow: false },
    }),
  },
  "web:tenant:clinics:index": {
    key: "web:tenant:clinics:index",
    platform: "web",
    path: "/tenant/:tenantId/clinics",
    seo: baseSeo({
      title: "Clinics - Suwa Organization",
      description: "Manage clinics and locations within your organization.",
      robots: { index: false, follow: false },
    }),
  },
  "web:tenant:clinics:detail": {
    key: "web:tenant:clinics:detail",
    platform: "web",
    path: "/tenant/:tenantId/clinics/:clinicId",
    seo: baseSeo({
      title: "Clinic Details - Suwa Organization",
      description: "View and manage a specific clinic within your organization.",
      robots: { index: false, follow: false },
    }),
  },
};

export const NATIVE_ROUTES: Record<NativeRouteKey, RouteMeta> = {
  "native:patient:index": {
    key: "native:patient:index",
    platform: "native",
    path: "/(patient)",
    seo: baseSeo({
      title: "Suwa - Home",
      description: "Your personal mental health companion. Access appointments, AI guidance, and care resources.",
      robots: { index: false, follow: false },
    }),
    native: {
      screenTitle: "Home",
      navBarTitle: "Home",
    },
  },
  "native:patient:ai": {
    key: "native:patient:ai",
    platform: "native",
    path: "/(patient)/ai",
    seo: baseSeo({
      title: "Ask Suwa - AI Health Guide",
      description: "Get personalized mental health guidance from Suwa's AI assistant. Ask questions, find resources, and discover care options.",
      robots: { index: false, follow: false },
    }),
    native: {
      screenTitle: "Ask Suwa",
      navBarTitle: "Ask Suwa",
    },
  },
  "native:patient:appointments:index": {
    key: "native:patient:appointments:index",
    platform: "native",
    path: "/(patient)/appointments",
    seo: baseSeo({
      title: "My Appointments - Suwa",
      description: "View and manage your upcoming and past therapy appointments.",
      robots: { index: false, follow: false },
    }),
    native: {
      screenTitle: "Appointments",
      navBarTitle: "Appointments",
    },
  },
  "native:patient:appointments:detail": {
    key: "native:patient:appointments:detail",
    platform: "native",
    path: "/(patient)/appointments/:sessionId",
    seo: baseSeo({
      title: "Session - Suwa",
      description: "Join your therapy session with secure video call.",
      robots: { index: false, follow: false },
    }),
    native: {
      screenTitle: "Session",
      navBarTitle: "Session",
    },
  },
  "native:patient:doctors:index": {
    key: "native:patient:doctors:index",
    platform: "native",
    path: "/(patient)/doctors",
    seo: baseSeo({
      title: "Find Doctors - Suwa",
      description: "Search and connect with licensed therapists and mental health professionals.",
      robots: { index: false, follow: false },
    }),
    native: {
      screenTitle: "Find Doctors",
      navBarTitle: "Doctors",
    },
  },
  "native:patient:doctors:detail": {
    key: "native:patient:doctors:detail",
    platform: "native",
    path: "/(patient)/doctors/:doctorId",
    seo: baseSeo({
      title: "Doctor Profile - Suwa",
      description: "View doctor profile, credentials, specialties, and availability.",
      robots: { index: false, follow: false },
    }),
    native: {
      screenTitle: "Doctor Profile",
      navBarTitle: "Doctor",
    },
  },
  "native:patient:doctors:booking": {
    key: "native:patient:doctors:booking",
    platform: "native",
    path: "/(patient)/doctors/:doctorId/booking",
    seo: baseSeo({
      title: "Book Appointment - Suwa",
      description: "Schedule an appointment with a doctor. Select date and time for your consultation.",
      robots: { index: false, follow: false },
    }),
    native: {
      screenTitle: "Book Appointment",
      navBarTitle: "Booking",
    },
  },
  "native:patient:hospitals:detail": {
    key: "native:patient:hospitals:detail",
    platform: "native",
    path: "/(patient)/hospitals/:tenantId",
    seo: baseSeo({
      title: "Hospital Profile - Suwa",
      description: "View hospital details, services, and available care options.",
      robots: { index: false, follow: false },
    }),
    native: {
      screenTitle: "Hospital",
      navBarTitle: "Hospital",
    },
  },
  "native:patient:health-hub": {
    key: "native:patient:health-hub",
    platform: "native",
    path: "/(patient)/health-hub",
    seo: baseSeo({
      title: "Health Hub - Suwa",
      description: "Explore mental health resources, articles, guides, and self-care tools.",
      robots: { index: false, follow: false },
    }),
    native: {
      screenTitle: "Health Hub",
      navBarTitle: "Health Hub",
    },
  },
  "native:patient:profile": {
    key: "native:patient:profile",
    platform: "native",
    path: "/(patient)/profile",
    seo: baseSeo({
      title: "My Profile - Suwa",
      description: "Manage your profile, preferences, and account settings.",
      robots: { index: false, follow: false },
    }),
    native: {
      screenTitle: "Profile",
      navBarTitle: "Profile",
    },
  },
  "native:patient:map": {
    key: "native:patient:map",
    platform: "native",
    path: "/(patient)/map",
    seo: baseSeo({
      title: "Care Near Me - Suwa",
      description: "Find nearby hospitals, clinics, and mental health care providers on the map.",
      robots: { index: false, follow: false },
    }),
    native: {
      screenTitle: "Care Near Me",
      navBarTitle: "Map",
    },
  },
  "native:patient:materials:index": {
    key: "native:patient:materials:index",
    platform: "native",
    path: "/(patient)/materials",
    seo: baseSeo({
      title: "My Materials - Suwa",
      description: "Access therapy notes, handouts, and resources from your sessions.",
      robots: { index: false, follow: false },
    }),
    native: {
      screenTitle: "My Materials",
      navBarTitle: "Materials",
    },
  },
  "native:patient:materials:detail": {
    key: "native:patient:materials:detail",
    platform: "native",
    path: "/(patient)/materials/:materialId",
    seo: baseSeo({
      title: "Material - Suwa",
      description: "View therapy material and session resources.",
      robots: { index: false, follow: false },
    }),
    native: {
      screenTitle: "Material",
      navBarTitle: "Material",
    },
  },
};

export const ALL_ROUTES: Record<RouteKey, RouteMeta> = {
  ...LANDING_ROUTES,
  ...WEB_ROUTES,
  ...NATIVE_ROUTES,
};

export function getRoute(key: RouteKey): RouteMeta {
  return ALL_ROUTES[key] ?? ALL_ROUTES["landing:home"];
}

export function getSeoForRoute(key: RouteKey): SeoConfig {
  return getRoute(key).seo;
}
