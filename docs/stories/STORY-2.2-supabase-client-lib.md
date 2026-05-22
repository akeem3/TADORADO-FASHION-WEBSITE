# Story 2.2: Supabase Client & Lib Initialization

## User Story
**As a developer,**  
**I want to** initialize the Supabase client in a centralized utility file,  
**So that** the entire application can interact with Supabase Storage and DB via a single instance.

## Description
We need to set up the official `@supabase/supabase-js` client. This will replace the Firebase SDK as our primary gateway for storage operations.

## Pre-requisites
- Story 2.1 (Firebase Removal) complete.
- Supabase Project URL and Anon Key obtained from the user.

## Detailed Action Items
1. **Library Installation:**
   - [ ] Run `npm install @supabase/supabase-js`. (Already executed).
2. **Library Setup:**
   - [ ] Create `lib/supabase.ts`.
   - [ ] Import `createClient` from `@supabase/supabase-js`.
   - [ ] Initialize and export the `supabase` client using `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. **Environment Variable Configuration:**
   - [ ] Add placeholders to `.env`.
   - [ ] Add placeholders to `env.example`.

## Files to be Created/Modified
- `d:\Personal Projects\Tadorado Fashion\tado-site\lib\supabase.ts` (NEW)
- `d:\Personal Projects\Tadorado Fashion\tado-site\.env` (MODIFY)
- `d:\Personal Projects\Tadorado Fashion\tado-site\env.example` (MODIFY)

## Acceptance Criteria
- [ ] `lib/supabase.ts` exports a valid client instance.
- [ ] No build errors related to missing Supabase dependencies.
