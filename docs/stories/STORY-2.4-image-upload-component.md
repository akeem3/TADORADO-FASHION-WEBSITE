# Story 2.4: Create ImageUpload Component

## User Story
**As an admin,**  
**I want to** have a dedicated upload component in the dashboard,  
**So that** I can simply pick a file from my computer and have it uploaded to the cloud automatically.

## Description
Instead of requiring the admin to manually upload a file to Supabase and copy the URL, we will build a reusable `ImageUpload.tsx` component. This component will handle the file selection, show a preview, upload the file to the `tadorado-assets` bucket, and return the public URL to the parent form.

## Pre-requisites
- Story 2.2 (Supabase Client) complete.
- Story 2.3 (Storage Bucket) complete.

## Detailed Action Items
1. **Component Scaffolding:**
   - [ ] Create `components/admin/ImageUpload.tsx`.
   - [ ] Define props: `onUploadSuccess`, `label`, `currentImage`.
2. **File Handling Logic:**
   - [ ] Implement `onChange` handler for file input.
   - [ ] Add basic validation (file type: images only, max size: 5MB).
3. **Supabase Upload Integration:**
   - [ ] Import the Supabase client from `lib/supabase.ts`.
   - [ ] Implement `handleUpload` function:
     - Generate a unique filename (e.g., `products/timestamp-filename.jpg`).
     - Use `supabase.storage.from('tadorado-assets').upload()`.
     - Handle upload progress or loading states.
4. **URL Retrieval:**
   - [ ] After success, use `supabase.storage.from('tadorado-assets').getPublicUrl()`.
   - [ ] Pass the resulting URL back via the `onUploadSuccess` callback.
5. **UI/UX Enhancement:**
   - [ ] Display the uploaded image preview.
   - [ ] Add a "Clear" or "Remove" button.
   - [ ] Show a loading spinner during the upload process.

## Files to be Created
- `d:\Personal Projects\Tadorado Fashion\tado-site\components\admin\ImageUpload.tsx`

## Acceptance Criteria
- [ ] Component allows picking a file from the local machine.
- [ ] File is successfully deposited in the Supabase bucket.
- [ ] Component returns a valid public URL to the parent.
- [ ] Component handles errors (e.g., network failure) gracefully.
