# Project Architecture: Doca

Doca is a polyglot monorepo project designed to handle data collection, machine learning modeling, and cross-platform application delivery. It utilizes a Turborepo-managed workspace for efficient orchestration of shared code and services.

## High-Level Overview

The system is architected to separate core logic, data infrastructure, and user-facing applications while maintaining a shared source of truth for configurations, types, and database schemas.

- **Monorepo Structure:** Managed via [Turborepo](https://turbo.build/).
- **Polyglot Strategy:**
  - **TypeScript/Node.js:** Backend services, web applications, mobile applications, and core shared packages.
  - **Python:** Data scraping, model training, and specialized AI/ML services.

---

## Workspace Layout

### Apps (`/apps`)
Standalone applications and services:
- **`web`**: Main web-based frontend.
- **`native`**: Cross-platform mobile frontend (React Native).
- **`server`**: Primary backend service (Node.js/TS).
- **`map-scraper`, `youtube-suggestion-scraper`**: Python-based data ingestion services.
- **`model-trainer`**: Python-based machine learning pipeline.
- **`stress-predictor-service`**: Dedicated AI service for stress analysis.

### Packages (`/packages`)
Shared reusable logic and configurations:
- **`db`**: Database definitions, schemas, and migrations (using [Drizzle](https://orm.drizzle.team/)).
- **`ui`**: Shared UI component library.
- **`api`**: Shared API clients and contract definitions.
- **`crypto`**: Security and cryptographic utilities.
- **`env`**: Shared environment variable validation and management.
- **`config`**: Project-wide TypeScript and build configurations.
- **`app-info`**: Metadata and application information.
- **`infra`**: Infrastructure definitions and deployment orchestration.

---

## Authentication & Security

Doca utilizes a centralized approach to authentication and security, ensuring consistent enforcement across web, mobile, and backend services.

- **Authentication Provider**: [Clerk](https://clerk.com/) is used as the unified authentication provider for both web (`@clerk/tanstack-react-start`) and native mobile (`@clerk/expo`) applications.
- **API Security**:
  - **Contextual Auth**: `packages/api` defines an ORPC-based context that propagates authentication state (`userId`, `session`) from the client to the server.
  - **Middleware & Procedures**: The backend utilizes auth-aware procedures (`protectedProcedure`) which require valid authentication via middleware (`requireAuth`) to access sensitive data and services.
  - **Token Bridge**: The frontend utilizes a `ClerkApiAuthBridge` to inject Clerk authentication tokens into request headers, ensuring secure API communication.
- **Shared Security Utilities**: The `packages/crypto` package contains centralized security and cryptographic utilities, ensuring a single source of truth for encryption, hashing, and secure data handling across the monorepo.

---

## System Interaction & Data Flow

1.  **Data Ingestion:** Python scrapers (`apps/map-scraper`, `apps/youtube-suggestion-scraper`) ingest raw data.
2.  **ML Processing:** The `model-trainer` app processes data to create models, which are then utilized by services like the `stress-predictor-service`.
3.  **Backend & Persistence:** The `server` coordinates requests and business logic, leveraging the shared `db` package to persist/retrieve data.
4.  **Frontend Consumption:** Both `web` and `native` frontends consume services provided by the `server` and utilize the `api` and `ui` packages to ensure consistency.

---

## Technology Stack

| Domain | Tools |
| :--- | :--- |
| **Language** | TypeScript, Python |
| **Monorepo** | Turborepo |
| **Frontend** | React, React Native, TailwindCSS/NativeWind |
| **Backend** | Node.js |
| **Database** | Drizzle ORM |
| **ML/Data** | Python (uv managed) |
| **Configuration** | TypeScript, Biome (linting/formatting) |
