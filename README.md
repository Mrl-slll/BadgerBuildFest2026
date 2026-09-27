# PHASE — Your Health, In Context

> A calm, intelligent clinical companion and longitudinal tracking platform designed to bridge the gap between patients managing Polycystic Ovary Syndrome (PCOS) and evidence-based clinical care. Built with Next.js, Databricks Mosaic AI, and Clerk.

---

## Overview

Polycystic Ovary Syndrome (PCOS) affects 8–13% of women of reproductive age worldwide, yet up to 70% remain undiagnosed and often face diagnostic delays of 2+ years. Patients juggle fragmented symptoms—irregular cycles, metabolic swings, fatigue, hyperandrogenism—while clinical visits are compressed into 15-minute consultations.

**PHASE** provides an intelligent, private space to track daily health markers, understand personal patterns through clinical phenotypes, and receive medically grounded AI interpretations powered by the **Databricks Data Intelligence Platform**.

---

## Core Features

### 1. Longitudinal Health Tracking (`/track`)
- **Daily Symptom Logging:** Track severity (mild, moderate, severe) and notes for fatigue, pelvic pain, cystic acne, brain fog, mood shifts, and sleep disturbance.
- **Interactive Cycle Wheel & History:** Visualize cycle length variability, follicular/luteal phases, and flow intensity.
- **Medications & Supplements:** Record dosages, start/end dates, adherence, and tracked side effects (e.g., Metformin, Myo-Inositol, Spironolactone).
- **Lab Panel Tracking:** Log hormone levels and metabolic markers (HbA1c, Fasting Insulin, Total/Free Testosterone, DHEA-S, LH/FSH ratio, AMH) alongside clinical reference ranges.
- **Cloud-Synced Storage:** Synchronized directly with **Databricks Delta Lake** via SQL Warehouse statements when authenticated.

### 2. Clinical AI Companion (`/ask`)
- **Grounded AI Synthesis:** Powered by **Databricks Model Serving** (`databricks-meta-llama-3-3-70b-instruct`).
- **Context-Aware Personalization:** Evaluates a sanitized 90-day window of the user's logged health metrics with consent.
- **Dual Clinical Outputs:**
  1. *Clinical Interpretation:* Empathetic, evidence-backed breakdown directly referencing logged symptom dates and patterns.
  2. *Questions for Your Clinician:* 1–3 high-yield questions for the patient's next medical appointment.
- **Databricks Lakehouse Cohort Data:** Automatically pulls aggregated, de-identified community statistics from Delta tables (e.g., treatment adherence and symptom resolution timelines).
- **Curated Literature Citations:** Cites peer-reviewed medical journals retrieved via **Databricks Vector Search**.

### 3. PCOS Phenotype Discovery Quiz (`/quiz`)
- Multi-step clinical assessment mapping reported symptoms to established PCOS phenotypes:
  - *Insulin-Resistant PCOS*
  - *Inflammatory PCOS*
  - *Adrenal PCOS*
  - *Post-Pill PCOS*
- Delivers evidence-informed nutrition, exercise, supplement, and lab testing considerations.

### 4. Insights & Clinician Visit Summary (`/insights`)
- Longitudinal correlation analysis (e.g., medication adherence vs. symptom reduction).
- Print-ready and exportable **Clinician Visit Summary** designed to save doctor time and accelerate diagnostic clarity during in-person visits.

### 5. Clinician-in-the-Loop & RLHF Review System
- Integrated expert review modal allowing healthcare professionals to rate responses on accuracy, groundedness, empathy, and safety.
- Verified responses are saved to Databricks SQL tables and dynamically fed back into Model Serving prompts as few-shot clinical gold standards.

---

## Databricks Architecture & Integration

```
                            ┌────────────────────────────────────────┐
                            │            PHASE Web App               │
                            │        (Next.js App Router)            │
                            └──────────────────┬─────────────────────┘
                                               │
                                Authenticated API Routes
                                               │
               ┌───────────────────────────────┼───────────────────────────────┐
               ▼                               ▼                               ▼
    ┌──────────────────────┐        ┌──────────────────────┐        ┌──────────────────────┐
    │   Databricks Model   │        │  Databricks Vector   │        │    Databricks SQL    │
    │       Serving        │        │        Search        │        │      Warehouse       │
    ├──────────────────────┤        ├──────────────────────┤        ├──────────────────────┤
    │ Llama 3.3 70B        │        │ Unity Catalog Index: │        │ Delta Lake Tables:   │
    │ Instruct             │        │ Peer-reviewed PCOS   │        │ • user_health_records│
    │ Context-grounded     │        │ research & clinical  │        │ • pcos_cohorts.*     │
    │ clinical synthesis   │        │ consensus guidelines │        │ • expert_reviews     │
    └──────────────────────┘        └──────────────────────┘        └──────────────────────┘
```

1. **Model Serving (`lib/server/databricks-ai.ts`):**
   - Calls `${DATABRICKS_HOST}/serving-endpoints/${DATABRICKS_SERVING_ENDPOINT}/invocations`.
   - Incorporates few-shot gold standards from expert audits to prevent clinical hallucination.
2. **Vector Search (`lib/server/databricks-research.ts`):**
   - Direct querying of `DATABRICKS_VECTOR_INDEX` in Unity Catalog.
   - Provides peer-reviewed DOI citations (ESHRE/ASRM guidelines, Lancet Diabetes & Endocrinology, AJCN).
3. **Lakehouse SQL Warehouse (`lib/server/databricks-storage.ts`, `databricks-lakehouse.ts`):**
   - Secure execution of parameterized queries against `DATABRICKS_SQL_WAREHOUSE_ID` via `/api/2.0/sql/statements`.
   - Persistent Delta Lake storage for user health records and community cohort analytics.
4. **Databricks Apps (`app/api/search/route.ts`):**
   - Optional proxy route connecting to deployed custom Databricks search applications (`DATABRICKS_APP_URL`).

*(Note: All Databricks services include graceful offline fallbacks and realistic local simulation engines for development environments without active cloud credentials.)*

---

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Server Actions, Server Components)
- **Frontend & UI:** [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), Vanilla CSS Modules
- **Animations & 3D:** [Framer Motion](https://www.framer.com/motion/), [Three.js](https://threejs.org/) / [@react-three/fiber](https://r3f.docs.pmnd.rs/), [Lenis](https://lenis.darkroom.engineering/) (Smooth Scroll)
- **Authentication:** [Clerk](https://clerk.com/)
- **Data & AI Layer:** Databricks Mosaic AI (Model Serving, Vector Search, SQL Statement Execution, Delta Lake)
- **Language & Tooling:** TypeScript 5, ESLint 9, Node.js Native Test Runner

---

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm, pnpm, or yarn
- (Optional) Active Databricks Workspace with a Model Serving endpoint, Vector Search index, and SQL Warehouse.
- (Optional) [Clerk](https://clerk.com/) account for authentication.

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/lh86474/BadgerBuildFest2026.git
cd BadgerBuildFest2026
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your configuration settings:

```env
# AI Provider: 'databricks' (live or mock fallback), 'databricks-mock', or 'development'
AI_PROVIDER=databricks

# Databricks Workspace Configuration (Server-side only)
DATABRICKS_HOST=https://<your-workspace-instance>.cloud.databricks.com
DATABRICKS_TOKEN=dapi...

# Model Serving Endpoint (e.g., Llama 3.3 70B Instruct)
DATABRICKS_SERVING_ENDPOINT=databricks-meta-llama-3-3-70b-instruct

# Vector Search Index (Unity Catalog full path)
DATABRICKS_VECTOR_INDEX=pcos.vector_search.disease_symptoms_v2_vs_index

# Databricks SQL Warehouse ID (for Delta Lake storage & cohort data)
DATABRICKS_SQL_WAREHOUSE_ID=your_warehouse_id

# (Optional) Databricks App URL
DATABRICKS_APP_URL=https://<your-app-id>.aws.databricksapps.com

# Set to true to force realistic local synthesis mode
DATABRICKS_MOCK=false

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| **Development** | `npm run dev` | Starts local Next.js dev server on port 3000 |
| **Production Build** | `npm run build` | Builds optimized production bundle |
| **Start Production** | `npm run start` | Runs built production server |
| **Typecheck** | `npm run typecheck` | Validates TypeScript types across all files |
| **Lint** | `npm run lint` | Runs ESLint validation |
| **Test Suite** | `npm test` | Runs unit & integration tests (Node native test runner) |
| **Test Ask Service** | `npm run test:ask` | Tests AI context assembly, prompts, and normalization |

---

## Security & Privacy Guardrails

- **Zero Client-Side Credentials:** All Databricks tokens, endpoints, and SQL queries run strictly inside Server Components and API route handlers (`server-only`).
- **Context De-Identification:** Raw personal identifiers, notes, and full names are stripped before health metrics are assembled into 90-day temporal context for the LLM.
- **Consent-First Personalization:** Health history sharing with the AI assistant is strictly opt-in and toggleable per query.
- **Fail-Safe Design:** If external AI services encounter timeouts or HTTP errors, the system falls back to grounded clinical rule-based heuristics without service interruption.

---

## License

This project was developed for BadgerBuildFest 2026.
