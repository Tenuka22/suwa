# ZenDoc Product Plan

## Product Summary

ZenDoc is a privacy-first mental health and wellness platform with three surfaces:

- Mobile app for users only.
- Web app for doctors, using a laptop/tablet-style interface.
- Web admin panel for operations, moderation, and oversight, also optimized for laptop/tablet use.

The product centers on anonymous access, licensed care, wellness tooling, credit-based bookings, and crisis safety.

## Product Rules

- `user_id` is the Clerk user ID and should be the primary key to avoid duplicate accounts.
- Users are anonymous by default and identified by alias.
- Mobile is for users only.
- Doctors do not use the mobile app.
- Doctor mode onboarding happens in the web app.
- User mode onboarding happens in the mobile app.
- Admin and doctor tools live in the web app.
- Web UX should assume larger screens, dense layouts, and dashboard-style workflows.
- Crisis handling must be conservative, fast, and auditable.

## Surface Split

### Mobile App

- Public marketing and onboarding.
- User home, activities, booking, profile, and crisis features.
- Smartwatch and health integrations.
- Self mode and relative/guardian mode.

### Doctor Web Panel

- Doctor dashboard.
- Appointment queue and session management.
- Patient lookup through alias-based records.
- Crisis alerts and review workflow.
- Availability, schedule, and session history management.

### Admin Web Panel

- User and doctor administration.
- Consent and audit review.
- Subscription and credit oversight.
- Crisis event review and escalation monitoring.
- Platform configuration and operational controls.

## Core Product Flow

1. User lands on the mobile app marketing experience or enters onboarding.
2. User selects self mode or relative/guardian mode in mobile.
3. User creates an alias-based profile and accepts consent.
4. User optionally connects a smartwatch.
5. User enters the app shell with Home, Activities, Doctors, and Profile.
6. Doctor mode onboarding happens in the web app.
7. User uses free trial or credit-based plans to book sessions.
8. Doctor manages sessions from the web panel.
9. Admin monitors platform health, compliance, and crisis events from the web panel.

## Functional Areas

### Identity

- Alias-based public identity.
- Optional guardian linkage.
- Licensed doctor profiles.
- Anonymous doctor previews for users.

### Booking And Sessions

- Doctor discovery.
- Credit-based booking.
- Session history.
- Appointment lifecycle management.
- Session notes and outcomes.

### Wellness

- Breathing.
- Yoga.
- Grounding.
- Journaling.
- Body scan.

### Monitoring And Crisis

- Smartwatch telemetry ingestion.
- Conservative AI risk scoring as a future feature, not startup scope.
- Low, medium, and high-risk routing.
- Doctor and guardian notifications when applicable.
- Emergency escalation for severe cases.

### Billing

- Trial access.
- Credit plans.
- Subscription tracking.
- Session redemption.

## Data Model

Planned core entities include:

- users keyed by Clerk `user_id`
- alias profiles
- doctor profiles
- patient private data
- guardian or relative links
- subscription plans
- user subscriptions
- user credits
- appointments
- schedules
- schedule blocks
- session usage
- wellness activity logs
- smartwatch connections
- consent records
- crisis events

## Technical Structure

### Apps

- `apps/native`: user mobile app.
- `apps/web`: web app for doctors and admins.
- `apps/server`: backend API and runtime.

### Shared Packages

- `packages/api`: shared RPC procedures and router contracts.
- `packages/db`: database schema and queries.
- `packages/env`: environment definitions per runtime.
- `packages/ui`: shared UI primitives and styles.
- `packages/infra`: deployment and infrastructure automation.
- `packages/config`: shared TypeScript and tooling config.

## AI And Safety

The AI system should stay conservative.

- Use HRV, sleep, activity, stress, and session context.
- Separate low, medium, and high risk.
- Prefer false negatives over false positives only when safety is not reduced.
- Log all risk decisions for auditability.

## UX Direction

- Mobile UI: bold, brutalist, high-contrast, user-friendly.
- Web UI: dense but readable dashboard design.
- Doctor and admin panels should prioritize speed, reviewability, and audit trails.

## Open Product Gaps

- Doctor web workflows need final screen-by-screen definition.
- Admin panel permissions and roles need final scope.
- Crisis escalation policy needs region-specific operational detail.
- Booking, credits, and subscription rules need final product thresholds.
