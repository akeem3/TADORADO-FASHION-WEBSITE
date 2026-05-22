# EPIC 2: Firebase Eradication & Supabase Storage Integration

## Overview
This epic focuses on removing the now-redundant Firebase dependency and integrating Supabase Storage for future asset management. Since there are currently no active assets stored in Firebase, the migration phase is bypassed. The primary goal is to clean the codebase of unnecessary SDKs and prepare the application to use Supabase for all future image uploads.

## Objectives
- Completely strip the Firebase SDK and configuration files from the application.
- Ensure Google Sheets integration remains functional (verified: it uses `googleapis` and is independent of Firebase).
- Integrate the official Supabase JavaScript Client (`@supabase/supabase-js`).
- Provision a Supabase Storage bucket for future product images.
- Refactor the Admin Dashboard to support Supabase Storage uploads.

---

## User Stories

### Story 2.1: Firebase SDK Eradication
**As a developer, I want to completely remove Firebase from the codebase so that the application size decreases and the stack remains unified.**

- **Detailed Description:** The `firebase` npm package is no longer needed. We will remove the configuration files and uninstall the package.
- **Action Items:**
  - Delete `app/firebaseConfig.tsx`.
  - Execute `npm uninstall firebase`.
  - Remove all Firebase-related environment variables from `.env` and `env.example`.
  - Verify that Google Sheets integration (`lib/googleSheets.ts`) still works (confirmed: it uses `googleapis`).

### Story 2.2: Supabase Client Integration
**As a frontend developer, I want to set up the Supabase Client so that the application can communicate with Supabase Storage.**

- **Detailed Description:** Create a singleton Supabase client for storage operations.
- **Action Items:**
  - Execute `npm install @supabase/supabase-js`.
  - Create `lib/supabase.ts` and export the initialized client.
  - Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env`.

### Story 2.3: Supabase Storage Setup (Manual)
**As a business owner, I want a dedicated storage bucket in Supabase so that I can store product images securely.**

- **Detailed Description:** Create the bucket and configure public access rules in the Supabase Dashboard.
- **Action Items:**
  - User creates a public bucket named `tadorado-assets`.
  - User configures RLS policies to allow public read access and authenticated upload access.

### Story 2.4: Admin Dashboard Refactor
**As an admin, I want to upload new product images to Supabase instead of Firebase.**

- **Detailed Description:** Update any product creation or editing forms to use the new Supabase storage client.
- **Action Items:**
  - Locate upload logic in the Admin Dashboard.
  - Replace Firebase `uploadBytes` logic with `supabase.storage.from('tadorado-assets').upload()`.
  - Ensure the saved image URL follows the Supabase public URL format.

---

## Acceptance Criteria
- [ ] No `firebase` imports remain in the codebase.
- [ ] `lib/supabase.ts` is functional.
- [ ] Google Sheets integration remains 100% functional.
- [ ] Admin can successfully upload a test image to Supabase.
