# Story 2.1: Firebase SDK Eradication

## User Story
**As a developer,**  
**I want to** completely remove Firebase from the codebase,  
**So that** the application size decreases and the stack remains unified.

## Description
Firebase was only used for image storage and is no longer needed. We will remove the configuration files and uninstall the package to clean up the codebase.

## Pre-requisites
- Verification that Google Sheets is independent of Firebase (Confirmed).

## Detailed Action Items
1. **File Removal:**
   - [ ] Delete `app/firebaseConfig.tsx`. (Already executed).
2. **Dependency Cleanup:**
   - [ ] Run `npm uninstall firebase`. (Already executed).
3. **Configuration Cleanup:**
   - [ ] Search the codebase for `firebase` and remove any residual imports or comments.
4. **Environment Cleanup:**
   - [ ] Remove any Firebase-related placeholders from `env.example`.

## Files to be Modified
- `d:\Personal Projects\Tadorado Fashion\tado-site\app\firebaseConfig.tsx` (DELETE)
- `d:\Personal Projects\Tadorado Fashion\tado-site\package.json` (MODIFY)

## Acceptance Criteria
- [ ] No `firebase` imports exist in the project.
- [ ] Project builds successfully.
