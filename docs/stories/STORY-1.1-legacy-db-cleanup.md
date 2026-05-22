# Story 1.1: Legacy Database Code Cleanup

## User Story
**As a developer,**  
**I want to** remove all traces of Mongoose/MongoDB from the codebase,  
**So that** the project is lean, secure, and free of confusing legacy connections.

## Description
During a codebase audit, a dormant `lib/mongoose.ts` file was discovered. Since the application actively uses Prisma for SQL databases, this file and its associated dependencies represent technical debt and potential security vulnerabilities. Removing this ensures that the team is focused on the actual stack (Prisma/Postgres) and avoids accidental usage of outdated patterns.

## Pre-requisites
- Access to the codebase.
- Terminal access for running npm commands.

## Detailed Action Items
1. **File Removal:**
   - [ ] Delete `d:\Personal Projects\Tadorado Fashion\tado-site\lib\mongoose.ts`
2. **Dependency Cleanup:**
   - [ ] Run `npm uninstall mongoose` in the project root.
   - [ ] Run `npm uninstall @types/mongoose` if it exists.
3. **Environment Cleanup:**
   - [ ] Open `.env` and delete any line containing `MONGODB_URI`.
   - [ ] Open `env.example` and delete any line containing `MONGODB_URI`.
4. **Global Search & Verification:**
   - [ ] Search the entire repository for the string "mongoose".
   - [ ] Search the entire repository for the string "mongodb".
   - [ ] Remove any dead imports or references found during the search.
5. **Lockfile Refresh:**
   - [ ] Run `npm install` to ensure `package-lock.json` is updated.

## Files to be Modified
- `d:\Personal Projects\Tadorado Fashion\tado-site\lib\mongoose.ts` (DELETE)
- `d:\Personal Projects\Tadorado Fashion\tado-site\package.json` (MODIFY)
- `d:\Personal Projects\Tadorado Fashion\tado-site\.env` (MODIFY)
- `d:\Personal Projects\Tadorado Fashion\tado-site\env.example` (MODIFY)

## Acceptance Criteria
- [ ] `lib/mongoose.ts` no longer exists.
- [ ] `mongoose` is not listed in `package.json` dependencies.
- [ ] No `MONGODB_URI` exists in environment files.
- [ ] A global search for "mongoose" returns 0 results.
- [ ] The application still builds and runs without errors.

## Technical Notes
- **Risk:** Low. Since the project uses Prisma/MySQL, Mongoose is likely unused.
- **Verification:** Run `npm run build` after removal to ensure no components were secretly depending on it.
