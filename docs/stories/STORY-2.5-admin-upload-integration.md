# Story 2.5: Integrate ImageUpload in Admin (New/Edit)

## User Story
**As an admin,**  
**I want to** use the new upload functionality while creating or editing products,  
**So that** the inventory management process is fast and seamless.

## Description
This story involves replacing the legacy text-based URL inputs in the Admin "New Product" and "Edit Product" pages with the new `ImageUpload` component.

## Pre-requisites
- Story 2.4 (ImageUpload Component) complete.

## Detailed Action Items
1. **New Product Page Refactor:**
   - [ ] Open `app/admin/products/new/page.tsx`.
   - [ ] Import the `ImageUpload` component.
   - [ ] Replace the text input for `image` with `<ImageUpload />`.
   - [ ] Replace the text input for `hoverImage` with `<ImageUpload />`.
   - [ ] Update the `form` state correctly when `onUploadSuccess` is triggered.
2. **Edit Product Page Refactor:**
   - [ ] Open `app/admin/products/edit/[id]/page.tsx`.
   - [ ] Import the `ImageUpload` component.
   - [ ] Replace image URL inputs with `<ImageUpload />`.
   - [ ] Ensure existing image URLs are passed as the `currentImage` prop for preview.
3. **Test Flow:**
   - [ ] Create a new product from scratch using the uploaders.
   - [ ] Edit an existing product and change its image via the uploader.
   - [ ] Verify both primary and hover images work as expected on the frontend.

## Files to be Modified
- `d:\Personal Projects\Tadorado Fashion\tado-site\app\admin\products\new\page.tsx`
- `d:\Personal Projects\Tadorado Fashion\tado-site\app\admin\products\edit\[id]\page.tsx`

## Acceptance Criteria
- [ ] "New Product" page no longer requires manual URL pasting.
- [ ] "Edit Product" page allows replacing images via file upload.
- [ ] New products appear on the storefront with correctly rendered images from Supabase.
- [ ] Form submission still works perfectly with the new image states.
