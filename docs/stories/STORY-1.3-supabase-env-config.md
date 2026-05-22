# Story 1.3: Supabase Environment Configuration

## User Story
**As a DevOps engineer,**  
**I want to** properly configure the Supabase connection strings in the local and production environment variables,  
**So that** Prisma utilizes Supavisor for connection pooling.

## Description
Serverless functions (Vercel) open and close database connections constantly. Direct connections will exhaust database limits almost immediately. We must use Supabase's transaction pooler (Supavisor) for the application and the direct connection for migrations.

## Pre-requisites
- A Supabase project created by the user.
- Supabase Project Settings -> Database -> Connection string (URI) accessible.

## Detailed Action Items
1. **Credentials Collection:**
   - [ ] Obtain the **Transaction** connection string from Supabase (Port 6543).
   - [ ] Obtain the **Session/Direct** connection string from Supabase (Port 5432).
2. **Local Environment Setup:**
   - [ ] Open `.env`.
   - [ ] Update `DATABASE_URL` with the Transaction URI.
   - [ ] Add `?pgbouncer=true&connection_limit=1` to the `DATABASE_URL` if not present.
   - [ ] Add `DIRECT_URL` with the Session URI.
3. **Template Update:**
   - [ ] Update `env.example` to include placeholders for `DATABASE_URL` and `DIRECT_URL` with comments explaining their purpose.
4. **Connection Test:**
   - [ ] Verify the strings are correctly formatted (no accidental spaces or quotes).

## Files to be Modified
- `d:\Personal Projects\Tadorado Fashion\tado-site\.env` (MODIFY)
- `d:\Personal Projects\Tadorado Fashion\tado-site\env.example` (MODIFY)

## Acceptance Criteria
- [ ] `.env` contains valid `DATABASE_URL` and `DIRECT_URL`.
- [ ] `DATABASE_URL` uses port 6543 (pooling).
- [ ] `DIRECT_URL` uses port 5432 (direct).
- [ ] `env.example` reflects these new requirements.

## Technical Notes
- **Pooling:** Supavisor is Supabase's replacement for PgBouncer. It handles connection pooling at the edge.
- **PGBouncer Flag:** The `?pgbouncer=true` flag is critical for Prisma to handle prepared statements correctly over a pooled connection.
