# EPIC 5: Risk Mitigation & Vercel Deployment

## Overview
This epic ensures the safe and bulletproof transition of the application from Render to Vercel production. Serverless environments (like Vercel Edge functions) have strict limitations on execution time and asynchronous background tasks. This epic specifically addresses vulnerabilities regarding third-party integrations (Google Sheets, Paystack webhooks, Nodemailer) to guarantee they do not cause 504 Gateway Timeouts during customer checkouts. Finally, it outlines the deployment validation process.

## Objectives
- Securely format and inject complex environment variables (like Google Service Accounts) into the Vercel dashboard.
- Refactor the checkout API route to decouple slow synchronous operations (Emails and Google Sheets) from the critical payment validation path.
- Deploy the application to Vercel and perform end-to-end smoke testing.

---

## User Stories

### Story 5.1: Google Sheets Key Formatting & Validation
**As a DevOps engineer, I want the Google Sheets Service Account JSON to be parsed perfectly in the Vercel environment so that the API route does not crash with unauthorized errors.**

- **Detailed Description:** The `lib/googleSheets.ts` file utilizes a `GOOGLE_SERVICE_ACCOUNT` environment variable. Vercel notoriously corrupts multi-line JSON strings (specifically the RSA Private Keys `\n` characters) when pasted into their dashboard.
- **Action Items:**
  - Verify that the current fix (`.replace(/\\n/g, "\n")`) in `lib/googleSheets.ts` is robust.
  - Document precisely how the environment variable should be pasted into the Vercel UI (e.g., pasting it as a single minified line of JSON with explicit `\n` literals, rather than pressing enter).
  - Implement a simple test API route (or use existing debug logs) in a staging branch to confirm the Google Sheets API connects successfully before merging to production.

### Story 5.2: Checkout API Decoupling (Timeout Mitigation)
**As a customer, I want my payment checkout to process immediately without timing out so that I know my order was successful.**

- **Detailed Description:** Vercel Hobby tier limits execution to 10 seconds (15s on Pro). The current checkout flow is highly dangerous: it validates Paystack, writes to Supabase, dispatches a Nodemailer email (`lib/email.ts`), AND appends data to Google Sheets synchronously. If Google's API or SMTP is slow, the entire HTTP request times out, leaving the user with a 504 error despite a successful payment.
- **Action Items:**
  - Audit the checkout/webhook API route (wherever the payment is finalized).
  - Isolate the absolute critical path: (1) Verify Paystack signature/status, (2) Update the order status in the Supabase database. These must block the response.
  - Decouple the non-critical path: (1) Dispatching the Nodemailer confirmation email, (2) Appending the row to Google Sheets. 
  - Utilize `NextResponse` to return a `200 OK` to the user/Paystack immediately after the database write, while using Vercel's `waitUntil` (or similar edge-compatible fire-and-forget mechanisms) to process the emails and sheets in the background.

### Story 5.3: Vercel Project Setup & Environment Provisioning
**As an infrastructure manager, I want to connect the GitHub repository to Vercel and populate all variables so that the application can build automatically.**

- **Detailed Description:** Vercel needs a complete mirror of the local `.env` to build and serve the application successfully.
- **Action Items:**
  - Create a new project in the Vercel Dashboard linked to the GitHub repository.
  - Populate the following verified environment variables:
    - **Supabase:** `DATABASE_URL` (Pooler), `DIRECT_URL` (Session), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
    - **Google Sheets:** `GOOGLE_SERVICE_ACCOUNT` (formatted correctly), `GOOGLE_SHEET_ID`.
    - **Email/SMTP:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `ADMIN_EMAIL`.
    - **Paystack:** `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET`.
  - Ensure the Next.js framework preset is selected.
  - Trigger the initial production build.

### Story 5.4: End-to-End Production Validation (Smoke Test)
**As a QA tester, I want to execute a full checkout flow on the live production URL so that I can certify the renovation is 100% complete and flawless.**

- **Detailed Description:** Once deployed, the system must be tested end-to-end to ensure all components communicate correctly in the serverless environment.
- **Action Items:**
  - Navigate to the live Vercel URL.
  - Add a product to the cart and proceed to checkout.
  - Complete a test payment using Paystack test credentials.
  - **Verify 1:** The user is redirected to a success screen instantly (no 10-second hanging).
  - **Verify 2:** The Supabase database registers the order and updates the inventory.
  - **Verify 3:** The confirmation email arrives in the inbox.
  - **Verify 4:** A new row appears in the connected Google Sheet.

---

## Acceptance Criteria
- [ ] Application deploys successfully to Vercel with zero build errors.
- [ ] A complete checkout flow succeeds without triggering a 504 Gateway Timeout.
- [ ] Paystack Webhooks register instantly.
- [ ] Google Sheets and Nodemailer function perfectly in the Vercel production environment without blocking the main thread.
- [ ] The live URL is stable, fast, and ready for customers.
