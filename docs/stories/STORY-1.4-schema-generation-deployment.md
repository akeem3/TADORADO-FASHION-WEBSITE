# Story 1.4: Schema Generation and Deployment

## User Story
**As a database administrator,**  
**I want to** generate the new Prisma client and push the schema to Supabase,  
**So that** the database tables are physically created in the cloud.

## Description
This is the "Go Live" moment for the new database structure. We will sync the code-defined schema with the live Supabase PostgreSQL instance.

## Pre-requisites
- Story 1.2 (Schema Translation) complete.
- Story 1.3 (Env Config) complete.
- Internet access to connect to Supabase.

## Detailed Action Items
1. **Prisma Client Regeneration:**
   - [ ] Run `npx prisma generate`.
2. **Schema Push:**
   - [ ] Run `npx prisma db push`.
   - [ ] *Note:* Since we are starting fresh in Supabase, we use `db push`. For future incremental changes, we will use migrations.
3. **Verification in Supabase:**
   - [ ] Log into the [Supabase Dashboard](https://supabase.com/dashboard).
   - [ ] Navigate to the **Table Editor**.
   - [ ] Confirm that all tables (`Product`, `User`, `Order`, `OrderItem`, `Newsletter`) have been created.
   - [ ] Check column types and constraints to ensure they match expectations.
4. **Application Smoke Test:**
   - [ ] Run the application locally (`npm run dev`).
   - [ ] Verify that the shop page loads (it should be empty, but not crash).

## Files to be Modified
- None (Side effects on the database and `node_modules/@prisma/client`).

## Acceptance Criteria
- [ ] `npx prisma db push` finishes with success.
- [ ] Supabase Dashboard shows the expected table structure.
- [ ] Local application connects to Supabase without errors.

## Technical Notes
- **Data Loss Warning:** If Supabase had existing data (it shouldn't in this phase), `db push` might warn about data loss. Since this is a fresh project, it's safe.
- **Prisma Client:** Every time the schema changes, `prisma generate` must be run to update TypeScript types.
