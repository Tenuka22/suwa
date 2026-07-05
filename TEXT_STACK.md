# Doca — Technology Stack

## 1. Monorepo & Project Orchestration
| Technology | Where |
|---|---|
| **Turborepo** | Root (`turbo.json`) — orchestrates all apps/packages |
| **Bun** 1.3.10 | Root — package manager, runtime |
| **npm workspaces** | Root — workspace config for `apps/*` and `packages/*` |

## 2. Frontend — Web (TanStack Start)
| Technology | Where |
|---|---|
| **React** ^19.2 | `apps/web`, `packages/ui`, `apps/landing-page` |
| **TanStack React Start** ^1.167 | `apps/web` — full-stack SSR framework |
| **TanStack React Router** ^1.168 | `apps/web`, `apps/landing-page` — routing |
| **TanStack React Query** ^5.99 | `apps/web`, `apps/native`, `apps/landing-page` — server state |
| **Vite** ^8 | `apps/web`, `apps/landing-page` — build tool |
| **@cloudflare/vite-plugin** | `apps/web` — Cloudflare Workers integration |
| **Alchemy** ^0.93 | `apps/web`, `apps/landing-page`, `apps/server`, `packages/infra` — Cloudflare IaC & plugin |

## 3. Frontend — Mobile (Expo / React Native)
| Technology | Where |
|---|---|
| **Expo** ~55 | `apps/native` — RN framework |
| **Expo Router** ~55 | `apps/native` — file-based routing |
| **React Native** 0.83 | `apps/native` — core mobile framework |
| **React Native Reanimated** 4.2 | `apps/native` — animations |
| **React Native Gesture Handler** | `apps/native` — gestures |
| **React Native Maps** | `apps/native` — map component |
| **React Native MMKV** | `apps/native` — key-value storage |
| **React Native WebRTC** | `apps/native` — WebRTC video calls |
| **React Native Voice** | `apps/native` — speech recognition |
| **React Native SVG** | `apps/native` — SVG rendering |
| **@react-navigation/bottom-tabs** | `apps/native` — tab navigation |
| **@react-navigation/drawer** | `apps/native` — drawer navigation |
| **React Native CSS** ^3 | `apps/native` — CSS support |
| **React Native Nitro Modules** | `apps/native` — turbo module system |

## 4. Styling & UI Components
| Technology | Where |
|---|---|
| **Tailwind CSS v4** | `apps/web`, `packages/ui`, `apps/landing-page` |
| **NativeWind v5** | `apps/native` — Tailwind for RN |
| **shadcn/ui** ^4 | `packages/ui`, root — component generation |
| **@base-ui/react** ^1.4 | `apps/web`, `packages/ui` — headless primitives |
| **Lucide React** | `apps/web`, `packages/ui` — web icons |
| **Lucide React Native** | `apps/native` — mobile icons |
| **class-variance-authority** | `apps/web`, `packages/ui` — component variants |
| **tailwind-merge** | `apps/web`, `packages/ui` — class merging |
| **clsx** | `apps/web`, `packages/ui` — conditional classes |
| **cmdk** | `apps/web`, `packages/ui` — command menu |
| **vaul** | `apps/web`, `packages/ui` — drawer component |
| **embla-carousel-react** | `apps/web`, `packages/ui` — carousel |
| **input-otp** | `apps/web`, `packages/ui` — OTP input |
| **react-resizable-panels** | `apps/web`, `packages/ui` — resizable panels |
| **next-themes** | `packages/ui`, `apps/web` — dark/light theme |
| **Sonner** | `apps/web`, `packages/ui` — toast notifications |

## 5. Backend — API Server (Cloudflare Workers)
| Technology | Where |
|---|---|
| **Hono** ^4.8 | `apps/server`, `packages/api` — HTTP framework |
| **oRPC** ^1.13 | `apps/server`, `packages/api`, `apps/web`, `apps/native` — E2E type-safe RPC |
| **Cloudflare Workers** | `apps/server` — deployment target |
| **wrangler** ^4 | `apps/server` — Workers CLI |
| **tsdown** | `apps/server` — bundler |
| **Alchemy** | `apps/server`, `packages/infra` — Cloudflare IaC |

## 6. Database & ORM
| Technology | Where |
|---|---|
| **Drizzle ORM** ^0.45 | `packages/db`, `apps/server`, `packages/api`, `packages/auth` |
| **Drizzle Kit** ^0.31 | `packages/db` — migrations |
| **Turso / libSQL** | `packages/db` — serverless edge SQLite |
| **Cloudflare D1** | `packages/db` — production database |
| **@libsql/client** | `packages/db` — libSQL client |
| **SQLite** (dialect) | `packages/db` |

## 7. Authentication & Authorization
| Technology | Where |
|---|---|
| **Better Auth** ^1.6 | `packages/auth`, `apps/web`, `apps/native` |
| **@better-auth/expo** | `packages/auth`, `apps/native` — Expo integration |
| **Better Auth plugins** | `packages/auth` — expo, admin, multiSession |
| **Drizzle adapter** | `packages/auth` — auth persistence |
| **bcryptjs** ^3 | `apps/server` — password hashing |
| **svix** ^1.94 | `apps/server` — webhook signing (Clerk legacy) |

## 8. Payments & Subscriptions
| Technology | Where |
|---|---|
| **Polar.sh** (SDK) | `packages/api` — checkout, refunds |
| **@polar-sh/hono** | `apps/server` — webhook verification |
| **@polar-sh/better-auth** | `packages/auth`, `apps/web`, `apps/native` — auth plugin |

## 9. Video & Real-Time Communication
| Technology | Where |
|---|---|
| **LiveKit** (client) ^2 | `apps/web`, `apps/native` — WebRTC video |
| **LiveKit Server SDK** ^2.10 | `packages/api` — token/room management |
| **react-native-webrtc** | `apps/native` — native WebRTC transport |

## 10. AI / ML / LLM
| Technology | Where |
|---|---|
| **LangChain Core** ^1.1 | `packages/api` — LLM framework |
| **LangChain LangGraph** ^1.4 | `packages/api` — agent orchestration |
| **LangChain Google GenAI** ^2.1 | `packages/api` — Gemini integration |
| **LangChain Cloudflare** ^1.0 | Root — Workers AI integration |
| **LangSmith** ^0.7 | `packages/api` — LLM observability |
| **Vercel AI SDK** ^6 | `packages/api` — AI SDK |
| **@ai-sdk/google** ^3 | `packages/api` — Google AI provider |
| **Cloudflare AI** | `packages/api`, `apps/server` — Workers AI bindings |
| **MediaPipe Tasks Vision** ^0.10 | `apps/web` — face landmark detection |
| **ONNX Runtime (Node)** ^1.26 | `packages/api` — ML inference |

## 11. Data Visualization & Maps
| Technology | Where |
|---|---|
| **Recharts** ^3.8 | `apps/web`, `packages/ui` — charts |
| **MapLibre GL JS** ^5.24 | `apps/native` — maps |
| **@vis.gl/react-maplibre** ^8.1 | `apps/native` — React MapLibre bindings |

## 12. State Management & Forms
| Technology | Where |
|---|---|
| **TanStack React Query** ^5 | All apps — server state |
| **React Hook Form** ^7.6 | `apps/web`, `apps/native` — forms |
| **@hookform/resolvers** ^5 | `apps/web`, `apps/native` — Zod resolvers |
| **Zod** ^4 | All packages — schema validation |
| **TanStack React Form** | `apps/landing-page` — forms |

## 13. Utilities
| Technology | Where |
|---|---|
| **date-fns** ^4 | `apps/web` — date formatting |
| **react-day-picker** ^10 | `packages/ui` — date picker |
| **@t3-oss/env-core** ^0.13 | `packages/env` — env validation |
| **@faker-js/faker** ^9 | `apps/server` — fake data |

## 14. Landing Page (`apps/landing-page`)
| Technology | Where |
|---|---|
| **TanStack React Start** | `apps/landing-page` — SSR framework |
| **GSAP** ^3.15 | `apps/landing-page` — animations |
| **@gsap/react** ^2.1 | `apps/landing-page` — GSAP React |
| **Lenis** ^1.3 | `apps/landing-page` — smooth scroll |
| **Sharp** ^0.35 | `apps/landing-page` (dev) — image opt |
| **@tanstack/router-plugin** + **CLI** | `apps/landing-page` — route generation |

## 15. Python / ML Services
| Technology | Where |
|---|---|
| **Python** >=3.12 | All Python apps |
| **FastAPI** | `apps/stress-predictor-service` — ML API |
| **uvicorn** | `apps/stress-predictor-service` — ASGI server |
| **TensorFlow** >=2.21 | `apps/stress-predictor-service`, `apps/model-trainer` |
| **scikit-learn** | `apps/model-trainer` — traditional ML |
| **pandas** | `apps/model-trainer` — data manipulation |
| **NumPy** | `apps/stress-predictor-service`, `apps/model-trainer` |
| **ONNX / onnxruntime / tf2onnx** | `apps/model-trainer` — model export |
| **matplotlib** + **seaborn** | `apps/model-trainer` — plotting |
| **kagglehub** | `apps/model-trainer` — dataset download |
| **jupytext** | `apps/model-trainer` — notebook conversion |
| **Scrapling** | `apps/map-scraper` — web scraping |
| **yt-dlp** | `apps/youtube-suggestion-scraper` — YouTube download |
| **uv** (package manager) | All Python apps |

## 16. Infrastructure & Deployment
| Technology | Where |
|---|---|
| **Cloudflare Workers** | `apps/server` — API runtime |
| **Cloudflare D1** | `packages/db` — edge SQLite database |
| **Cloudflare R2** | `apps/server` — object storage |
| **Cloudflare KV** | `apps/server` — key-value storage |
| **Cloudflare AI** | `packages/api` — Workers AI inference |
| **Alchemy** ^0.93 | `packages/infra` — IaC |
| **Upstash Redis** | `packages/api` — real-time stress data |

## 17. Development Tools & Code Quality
| Technology | Where |
|---|---|
| **TypeScript** ^6 / ~5.9 | All packages |
| **Biome** 2.4 | Root — linting & formatting |
| **Ultracite** 7.7 | Root — Biome preset |
| **Vitest** ^4 | `apps/landing-page`, `apps/web` — tests |
| **@testing-library/react** ^16 | `apps/web`, `apps/landing-page` |
| **jsdom** | `apps/web`, `apps/landing-page` — test DOM |
| **Babel** ^7.28 + **babel-preset-expo** | `apps/native` — JS transpilation |
| **Metro bundler** | `apps/native` — RN bundler |
| **web-vitals** | `apps/web` — performance metrics |
| **shadcn CLI** ^4 | Root — component scaffolding |

## 18. Documentation
| Technology | Where |
|---|---|
| **Obsidian** | `knowledge-base/.obsidian/` — product docs vault |
| **Markdown** | `knowledge-base/*.md` — system docs |
