# Product Requirements Document (PRD): Tadorado Fashion Platform Renovation

**Version:** 1.2
**Status:** Approved for Implementation

---

## 1. Executive Summary
The Tadorado Fashion platform currently suffers from fragmented backend services (Aiven MySQL + Firebase Storage), slow initial page loads due to over-reliance on client-side rendering (CSR), and a lack of modern discoverability tools. 

This renovation aims to:
1. **Unify the Backend:** Eradicate Firebase and migrate to a fully unified PostgreSQL and Storage solution using **Supabase**, eliminating fragmented costs and improving maintainability.
2. **Optimize Performance:** Transition hosting to **Vercel** and aggressively optimize Next.js rendering patterns to achieve near-instant page loads.
3. **Future-Proof Discoverability:** Implement Generative Engine Optimization (GEO) alongside traditional SEO, making the site easily digestible for both Google Search and AI models (like ChatGPT and Claude).

---

## 2. Current Architecture vs. Proposed Architecture

| Feature | Current State | Proposed State |
| :--- | :--- | :--- |
| **Hosting** | Render | Vercel (Edge-optimized, Serverless) |
| **Database** | Aiven MySQL | Supabase PostgreSQL |
| **Connection Pooling**| None | Supavisor (Built into Supabase) |
| **Asset Storage** | Firebase Storage | Supabase Storage Buckets |
| **Rendering** | Heavy Client-Side (`"use client"` on home) | Server Components (SSR / SSG) default |
| **Image Delivery** | Unoptimized (`unoptimized: true`) | Next.js Image Optimization (WebP/AVIF) |
| **Discoverability** | None (No sitemap, robots, or metadata) | Dynamic Sitemap, OpenGraph, JSON-LD, `llms.txt` |

---

## 3. Scope of Work & Detailed Implementation Steps

### Phase 1: Database Migration (MySQL to Supabase PostgreSQL)
Vercel serverless functions require connection pooling to prevent database exhaustion. Supabase natively provides this.
*   **Action 1:** Provision a new Supabase project.
*   **Action 2:** Update `prisma/schema.prisma`:
    *   Change `provider = "mysql"` to `provider = "postgresql"`.
    *   Refactor database-specific annotations (e.g., changing `@db.VarChar(255)` to standard Postgres strings, and mapping Decimal/Boolean types).
*   **Action 3:** Update Environment Variables:
    *   `DATABASE_URL`: Transaction pooler URL (port `6543`, `pgbouncer=true`).
    *   `DIRECT_URL`: Session URL (port `5432`) for Prisma migrations.
*   **Action 4:** Execute data migration from Aiven to Supabase (exporting tables to CSV/SQL and importing them into the new Postgres instance).

### Phase 2: Firebase Eradication & Storage Migration
Firebase will be entirely removed from the codebase to avoid arbitrary billing and keep all infrastructure under Supabase.
*   **Action 1:** Remove the `firebase` npm package and delete `app/firebaseConfig.tsx`.
*   **Action 2:** Install `@supabase/supabase-js`.
*   **Action 3:** Create a Supabase Storage bucket (e.g., `tadorado-assets`) and configure public read access policies.
*   **Action 4:** Create a new utility (`lib/supabase.ts`) for server/client Supabase initialization.
*   **Action 5:** Refactor all Admin Dashboard upload components to push images to Supabase instead of Firebase.
*   **Action 6:** Run a script to download existing Firebase images and bulk-upload them to Supabase Storage, updating the respective database rows with the new URLs.

### Phase 3: Performance & Core Web Vitals Optimization
Fixing the "slow and draggy" UI by leaning into Next.js 15 capabilities.
*   **Action 1 (Server Components):** Remove `"use client"` from `app/page.tsx`. Ensure interactive child components (like Carousels or Add-to-Cart buttons) handle their own client logic, leaving the main layout to render instantly on the server.
*   **Action 2 (Image Optimization):** Remove `unoptimized: true` from `next.config.ts`. Add the Supabase storage domain to `remotePatterns`. This ensures all heavy product images are automatically compressed, resized, and served in next-gen formats (WebP/AVIF).
*   **Action 3 (Font Optimization):** Ensure `next/font` is properly implemented to prevent layout shifts (CLS) during text rendering.

### Phase 4: SEO and Generative Engine Optimization (GEO)
Ensuring the site is perfectly formatted for traditional crawlers (Google) and AI Agents (LLMs).
*   **Action 1 (Traditional SEO):**
    *   Create a dynamic `app/sitemap.ts` that queries Prisma to generate URLs for all active products and categories.
    *   Create `app/robots.ts` to guide crawlers.
*   **Action 2 (AI Crawlability - `llms.txt`):**
    *   Implement an `llms.txt` file at the root level. This plain-text/markdown file will act as a "treasure map" for AI agents, summarizing the brand context, linking to key product categories, and explaining how to parse the site.
*   **Action 3 (Structured Data / JSON-LD):**
    *   Inject Schema.org JSON-LD `<script>` tags into `app/collections/product/[id]/page.tsx`. This explicitly tells AI models the exact `Price`, `Availability`, and `Description` of the product, preventing hallucinations.
*   **Action 4 (Metadata & OpenGraph):**
    *   Use Next.js `generateMetadata()` on product pages to dynamically pull the product title, description, and image for rich social media sharing cards.

---

## 4. Risk Assessment & Mitigation Strategy
During the migration from Render to Vercel and Aiven to Supabase, several third-party integrations pose risks of breakage. The following mitigations will be strictly enforced:

### Risk 1: Google Sheets Environment Variable Parsing
*   **Vulnerability:** `lib/googleSheets.ts` relies on the `GOOGLE_SERVICE_ACCOUNT` environment variable. Vercel notoriously corrupts multi-line JSON strings (like RSA Private Keys) when pasted into their dashboard, leading to instant authorization failures.
*   **Mitigation:** The deployment process will document exactly how to escape `\n` characters before pasting the JSON into Vercel. We will test the Google Sheets API route on a staging Vercel deployment before switching production traffic.

### Risk 2: Vercel Serverless Timeout Limits (Checkout Flow)
*   **Vulnerability:** Vercel enforces strict execution limits (10-15 seconds on lower tiers). During checkout, the app performs multiple synchronous operations: (1) Paystack validation, (2) Supabase Database write, (3) Google Sheets append, and (4) Nodemailer email dispatch (`lib/email.ts`). This chain risks timing out and causing a 504 error.
*   **Mitigation:** We will audit the checkout API. Non-critical tasks (like sending the confirmation email and appending to Google Sheets) will be verified to ensure they do not block the critical Paystack validation and database write, possibly decoupling them or using `waitUntil()` if available in Vercel.

### Risk 3: Legacy Database Conflict (`lib/mongoose.ts`)
*   **Vulnerability:** The codebase contains a dormant `lib/mongoose.ts` file indicating a previous MongoDB connection, despite the active use of Prisma/MySQL.
*   **Mitigation:** During Phase 1, `lib/mongoose.ts` and the `mongoose` npm package will be completely deleted to prevent dead code compilation and reduce the build size.

### Risk 4: Paystack Webhook Cold Starts
*   **Vulnerability:** Serverless cold starts on Vercel can cause the initial connection to the Supabase database to delay by a few seconds, potentially causing Paystack webhooks to timeout and fail to register a successful payment.
*   **Mitigation:** We are implementing **Supavisor** (Supabase's built-in connection pooler) via the `DATABASE_URL` specifically to keep connections warm and instantly available to Vercel Edge/Serverless functions.

---

## 5. Acceptance Criteria (Definition of Done)

✅ **Infrastructure:** 
- The application deploys successfully on Vercel without Prisma timeout errors.
- The Aiven MySQL database is deprecated; the app reads/writes exclusively to Supabase Postgres.
- `mongoose` is eradicated.

✅ **Integrations:**
- Google Sheets successfully receives new order data from the Vercel production deployment.
- Paystack checkout succeeds without serverless timeouts.
- Confirmation emails are dispatched successfully.

✅ **Storage:**
- Firebase SDK is completely removed from `package.json` and the codebase.
- New product image uploads successfully save to Supabase Storage and render correctly on the frontend.

✅ **Performance:**
- The homepage initial load relies on Server-Side Rendering (SSR).
- Images are served via Next.js `_next/image` optimization engine.

✅ **Discoverability:**
- `/sitemap.xml` returns a valid, dynamically generated XML tree.
- `/robots.txt` exists.
- `/llms.txt` exists at the root domain and correctly describes the site context for AI.
- Product pages pass Google's Rich Results Test for Schema Markup.

---

## 6. Next Steps
1. Client to create a [Supabase Project](https://supabase.com).
2. Client to provide the `DATABASE_URL`, `DIRECT_URL`, and `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`.
3. Development begins sequentially, starting with Phase 1 (Database Migration).
