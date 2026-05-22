# Story 1.2: Prisma Schema PostgreSQL Translation

## User Story
**As a backend developer,**  
**I want to** rewrite the `schema.prisma` file to map perfectly to PostgreSQL,  
**So that** Prisma can seamlessly generate the new database structure in Supabase.

## Description
The current Prisma schema is strictly typed for MySQL. PostgreSQL has slightly different data types and mapping requirements. We need to transition the provider and clean up MySQL-specific attributes to ensure a smooth deployment to Supabase.

## Pre-requisites
- Completion of Story 1.1 (Cleanup).
- Understanding of the current data model.

## Detailed Action Items
1. **Provider Update:**
   - [ ] Open `prisma/schema.prisma`.
   - [ ] Change `provider = "mysql"` to `provider = "postgresql"`.
2. **Connection Configuration:**
   - [ ] Add `directUrl = env("DIRECT_URL")` to the `datasource db` block.
   - [ ] Ensure `url = env("DATABASE_URL")` remains.
3. **Data Type Refactoring:**
   - [ ] **Product Model:**
     - Review `@db.VarChar(255)` -> Change to standard `String` or `@db.VarChar(255)` (Postgres supports VarChar but standard `String` is often preferred for flexibility unless strict limits are needed).
     - Review `@db.Text` -> Standardize for Postgres (Postgres `TEXT` is equivalent).
     - Review `@db.Decimal(10, 2)` -> Ensure it maps to Postgres `DECIMAL`.
   - [ ] **User Model:**
     - Review and standardize field types.
   - [ ] **Order/OrderItem Models:**
     - Review and standardize field types.
     - Review `@db.Decimal` usage.
   - [ ] **Newsletter Model:**
     - Review and standardize.
4. **Schema Validation:**
   - [ ] Run `npx prisma format` to check for syntax errors and standardize formatting.
5. **Client Regeneration (Dry Run):**
   - [ ] Run `npx prisma generate` to see if the client can be generated for the new provider (even before connecting to a live DB).

## Files to be Modified
- `d:\Personal Projects\Tadorado Fashion\tado-site\prisma\schema.prisma` (MODIFY)

## Acceptance Criteria
- [ ] `prisma/schema.prisma` has `provider = "postgresql"`.
- [ ] `directUrl` is configured in the schema.
- [ ] All MySQL-specific decorators (like `@db.VarChar`) are either removed or validated for Postgres compatibility.
- [ ] `npx prisma format` runs without errors.
- [ ] `npx prisma generate` succeeds.

## Technical Notes
- **Key Difference:** MySQL uses `INT` for primary keys usually, while Postgres often uses `SERIAL` or `BIGSERIAL`. Prisma's `autoincrement()` handles this abstraction well.
- **Decimal:** Ensure `Decimal` fields are handled correctly in the frontend as Postgres returns them as strings/objects depending on the driver.
