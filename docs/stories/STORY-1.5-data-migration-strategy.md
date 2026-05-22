# Story 1.5: Data Migration Strategy (Execution)

## User Story
**As a business owner,**  
**I want** existing products and orders safely transferred from MySQL to PostgreSQL,  
**So that** no historical data or active products are lost during the platform renovation.

## Description
This story handles the manual or semi-automated transfer of data from the old Aiven MySQL database to the new Supabase PostgreSQL database. This ensures business continuity.

## Pre-requisites
- Access to the Aiven MySQL database (credentials).
- Access to the Supabase Dashboard.
- GUI Database Tool (TablePlus, DBeaver, or similar) is recommended.

## Detailed Action Items
1. **Data Export (from Aiven MySQL):**
   - [ ] Connect to Aiven MySQL.
   - [ ] Export the `Product` table as CSV.
   - [ ] Export the `User` table as CSV.
   - [ ] Export the `Order` table as CSV.
   - [ ] Export the `OrderItem` table as CSV.
2. **Data Transformation (if needed):**
   - [ ] Check CSV files for data format differences (e.g., Boolean 0/1 in MySQL vs true/false in Postgres).
   - [ ] Ensure date formats are compatible.
3. **Data Import (to Supabase):**
   - [ ] Log into Supabase.
   - [ ] Use the **Table Editor** -> **Import data via CSV** for each table.
   - [ ] *Sequence:* Import Users first, then Products, then Orders, then OrderItems (to maintain relation integrity).
4. **Relational Integrity Check:**
   - [ ] Verify that `OrderItems` are still correctly linked to `Orders` and `Products`.
   - [ ] Verify that `Orders` are linked to `Users`.
5. **Final Validation:**
   - [ ] Open the application storefront.
   - [ ] Confirm products are visible and details are correct.
   - [ ] Log into the Admin panel and confirm orders are visible.

## Files to be Modified
- None (Data operation only).

## Acceptance Criteria
- [ ] All product data is visible in the new system.
- [ ] All order history is accurately reflected in Supabase.
- [ ] Images (currently still in Firebase) load correctly using the old URLs (until Epic 2).
- [ ] No data corruption found in primary or foreign keys.

## Technical Notes
- **ID Sync:** Ensure `autoincrement` values in Postgres are reset to the next available ID after import so new records don't collide with imported IDs.
- **SQL Command to reset serial:** `SELECT setval('table_id_seq', (SELECT MAX(id) FROM table));`
