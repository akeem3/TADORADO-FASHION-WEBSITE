# EPIC 1: Database Migration (MySQL to Supabase PostgreSQL)

## Overview
This epic covers the foundational migration of the application's database from Aiven MySQL to Supabase PostgreSQL. This transition is an absolute prerequisite to enable native connection pooling via Supavisor. Connection pooling is essential for deploying serverless Next.js API routes securely on Vercel without encountering database exhaustion limits, 504 Gateway Timeouts, or broken transactions during high-traffic checkout events.

## Objectives
- Completely decouple the application from the Aiven MySQL database.
- Translate the existing Prisma schema to support PostgreSQL natively, adjusting data types where necessary.
- Eradicate legacy MongoDB artifacts (`lib/mongoose.ts`) to clean the codebase and reduce bundle size.
- Safely transition environment variables and configure Prisma to use both a transaction connection (for the app) and a direct session connection (for schema migrations).
- Provide a clear pathway for data migration from the old database to the new one.

---

## User Stories

### Story 1.1: Legacy Database Code Cleanup
**As a developer, I want to remove all traces of Mongoose/MongoDB from the codebase so that the project is lean, secure, and free of confusing legacy connections.**

- **Detailed Description:** During a codebase audit, a dormant `lib/mongoose.ts` file was discovered. Since the application actively uses Prisma for SQL databases, this file and its associated dependencies represent technical debt and potential security vulnerabilities.
- **Action Items:**
  - Delete the file `lib/mongoose.ts` completely.
  - Run `npm uninstall mongoose` to remove the package.
  - Review `.env` and `.env.example` and remove any `MONGODB_URI` keys.
  - Search the entire repository for the word `mongoose` to guarantee complete eradication.

### Story 1.2: Prisma Schema PostgreSQL Translation
**As a backend developer, I want to rewrite the `schema.prisma` file to map perfectly to PostgreSQL so that Prisma can seamlessly generate the new database structure in Supabase.**

- **Detailed Description:** The current Prisma schema is strictly typed for MySQL. Specifically, the `@db.VarChar(255)`, `@db.Text`, and `@db.Decimal(10, 2)` decorators need to be translated or removed to align with standard PostgreSQL mappings.
- **Action Items:**
  - Modify the `datasource db` block: change `provider` from `"mysql"` to `"postgresql"`.
  - Add `directUrl = env("DIRECT_URL")` alongside `url = env("DATABASE_URL")` in the `datasource` block.
  - Review the `Product` model: adjust MySQL-specific `@db.Text` or `@db.VarChar` to standard `String` mappings (Postgres handles `TEXT` by default for `String`).
  - Review `User`, `Order`, `OrderItem`, and `Newsletter` models similarly. Ensure all `DateTime` and `Boolean` fields will map correctly to Postgres equivalents.
  - Run `npx prisma format` to ensure schema syntax is flawless.

### Story 1.3: Supabase Environment Configuration
**As a DevOps engineer, I want to properly configure the Supabase connection strings in the local and production environment variables so that Prisma utilizes Supavisor for connection pooling.**

- **Detailed Description:** Serverless functions open and close database connections constantly. If we provide a direct connection string to Vercel, the database will exhaust its limits immediately. We must use Supabase's transaction pooler (port 6543) for the app, and the direct connection (port 5432) for running schema migrations.
- **Action Items:**
  - Obtain the Supabase Transaction Pooler connection string (`DATABASE_URL`). Ensure it has `?pgbouncer=true&connection_limit=1` appended.
  - Obtain the Supabase Session connection string (`DIRECT_URL`).
  - Update local `.env` with these precise strings.
  - Update `.env.example` to reflect the new structure so future developers understand the setup.

### Story 1.4: Schema Generation and Deployment
**As a database administrator, I want to generate the new Prisma client and push the schema to Supabase so that the database tables are physically created in the cloud.**

- **Detailed Description:** Once the schema is translated and the environment variables are active, the physical tables must be instantiated in the Supabase PostgreSQL instance.
- **Action Items:**
  - Execute `npx prisma generate` to rebuild the local TypeScript typings for the new provider.
  - Execute `npx prisma db push` to force the schema onto the Supabase database.
  - Log into the Supabase Dashboard UI to visually confirm that `Product`, `User`, `Order`, `OrderItem`, and `Newsletter` tables exist with the correct columns.

### Story 1.5: Data Migration Strategy (Execution)
**As a business owner, I want existing products and orders safely transferred from MySQL to PostgreSQL so that no historical data or active products are lost during the platform renovation.**

- **Detailed Description:** Migrating database engines requires extracting the data into an intermediate format (CSV or raw SQL) and importing it into the new engine.
- **Action Items:**
  - Connect to the existing Aiven MySQL database using a GUI tool (like TablePlus or DBeaver).
  - Export the `Product` table as a CSV file.
  - Import the CSV into the new Supabase `Product` table using the Supabase Table Editor UI.
  - Repeat the export/import process for `User`, `Order`, and `OrderItem` tables.
  - Run test queries via `npx prisma studio` to ensure relationships (Foreign Keys) remain intact.

---

## Acceptance Criteria
- [ ] Application compiles successfully with the new Prisma Postgres client without type errors.
- [ ] `mongoose` is completely absent from the codebase and `package.json`.
- [ ] The local development server can connect to Supabase.
- [ ] Reading products and creating test orders via the frontend completes without Prisma connection timeout errors.
- [ ] Supabase Dashboard shows active tables populated with data.
