# Supabase Admin Image Upload Guide

A step-by-step guide to implementing admin-only image uploads in a Next.js (App Router) project using Supabase Storage with the `service_role` key, bypassing RLS restrictions.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Step 1: Get Your Supabase Keys](#3-step-1-get-your-supabase-keys)
4. [Step 2: Create the Supabase Bucket](#4-step-2-create-the-supabase-bucket)
5. [Step 3: Install Dependencies](#5-step-3-install-dependencies)
6. [Step 4: Environment Variables](#6-step-4-environment-variables)
7. [Step 5: Create the Admin Supabase Client](#7-step-5-create-the-admin-supabase-client)
8. [Step 6: Create the Upload API Route](#8-step-6-create-the-upload-api-route)
9. [Step 7: Create the ImageUpload Client Component](#9-step-7-create-the-imageupload-client-component)
10. [Step 8: Wire It Into a Form](#10-step-8-wire-it-into-a-form)
11. [Step 9: Configure next.config.ts for Remote Images](#11-step-9-configure-nextconfigts-for-remote-images)
12. [Step 10: Deploy to Vercel](#12-step-10-deploy-to-vercel)

---

## 1. Architecture Overview

### The Problem

When you try to upload files to Supabase Storage directly from the browser using the **anon (public) key**, Supabase blocks the upload unless you have proper Row Level Security (RLS) policies on the `storage.objects` table. Writing these policies requires Supabase Auth (user login), which your admin panel may not have.

### The Solution

Instead of uploading directly from the browser, you send the file to your **own server** (a Next.js API route), which then uploads it to Supabase using the **`service_role` key**. The `service_role` key **bypasses RLS entirely** — it has full access to everything.

### Data Flow

```
Browser                          Next.js Server                     Supabase
┌──────────┐   POST /api/upload   ┌────────────────┐   upload()     ┌────────┐
│  User     │ ──── FormData ────→ │  API Route     │ ────────────→ │Storage │
│ selects   │                     │  (service_role)│               │ Bucket │
│ file      │ ←─── { url } ───── │                │ ←─── publicUrl─│        │
└──────────┘                     └────────────────┘               └────────┘
                                        │
                                        │ save url to DB
                                        ▼
                                  ┌──────────────┐
                                  │   Database    │
                                  │ (Prisma/SQL)  │
                                  └──────────────┘
```

**Key principle:** The `service_role` key **never touches the browser**. It stays in your server-side code and Vercel environment variables.

---

## 2. Prerequisites

- A Next.js project using the **App Router** (`app/` directory)
- A **Supabase project** (free tier works)
- Node.js 18+

---

## 3. Step 1: Get Your Supabase Keys

In your Supabase Dashboard:

1. Go to **Settings → API** in the left sidebar
2. Under **Project API keys**, you'll find:

| Key | Example | Where to use |
|-----|---------|--------------|
| **Project URL** | `https://xxxxx.supabase.co` | `.env` as `NEXT_PUBLIC_SUPABASE_URL` |
| **Anon / Publishable key** | `sb_publishable_xxx` or `eyJ...` | `.env` as `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **Secret / Service Role key** | `sb_secret_xxx` or `eyJ...` | `.env` as `SUPABASE_SERVICE_ROLE_KEY` (server-only) |

> **Important:** The old key format (`eyJ...` JWT) is being deprecated. Use the new `sb_publishable_` and `sb_secret_` keys if available. Both work the same way architecturally.

---

## 4. Step 2: Create the Supabase Bucket

In your Supabase Dashboard:

1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Name: `tadorado-assets` (or whatever you like)
4. **Public bucket** checked (images need to be publicly viewable)
5. Click **Create bucket**

> **Why public?** Product images on a fashion site need to be visible to anyone who visits the site — no login required. A public bucket means the URL `https://xxxxx.supabase.co/storage/v1/object/public/tadorado-assets/products/photo.jpg` is accessible to anyone with the link. That's what you want.

If you want the bucket private (more secure), you'd need to use signed URLs everywhere images are displayed. For a public e-commerce site, a public bucket is appropriate.

---

## 5. Step 3: Install Dependencies

```bash
npm install @supabase/supabase-js
```

That's the only dependency needed. The `@supabase/supabase-js` package is the official Supabase client that works both client-side and server-side.

---

## 6. Step 4: Environment Variables

Create or update your `.env` file:

```env
# Supabase — replace with your actual values
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_your_anon_key_here

# Server-only — do NOT prefix with NEXT_PUBLIC_
SUPABASE_SERVICE_ROLE_KEY=sb_secret_your_secret_key_here
```

Two things to understand here:

- **`NEXT_PUBLIC_` prefix**: Variables prefixed with `NEXT_PUBLIC_` are inlined into the client-side JavaScript bundle at build time. They are visible in the browser. The `SUPABASE_SERVICE_ROLE_KEY` does NOT have this prefix, so it stays server-side only.

- **The anon key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) is safe in the browser because Supabase enables RLS by default — the anon key can only do what your RLS policies allow (which is nothing by default).

Also update `.env.example` so future developers know what's needed:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

---

## 7. Step 5: Create the Admin Supabase Client

Create `lib/supabase-admin.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL env var");
}

if (!supabaseServiceKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY env var");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
```

### What this does

- `createClient(url, key)` initializes a Supabase client. When you pass the `service_role` key, all operations bypass RLS.
- The `if (!...)` checks ensure the app crashes early with a clear message if env vars are missing, rather than failing silently at runtime.
- The exported `supabaseAdmin` client is **only safe to use in Server Components, API routes, Server Actions, or any code that never runs in the browser.**

### Why not `lib/supabase.ts`?

Your project might already have a `lib/supabase.ts` that uses the anon key for client-side operations. Keep them separate — having two files with different purposes prevents accidentally importing the wrong one:

- `lib/supabase.ts` — anon key, safe for client components (but limited by RLS)
- `lib/supabase-admin.ts` — service_role key, SERVER ONLY

---

## 8. Step 6: Create the Upload API Route

Create `app/api/admin/upload/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    // ── Validation ──────────────────────────────────────────

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type "${file.type}". Allowed: ${ALLOWED_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.`,
        },
        { status: 400 }
      );
    }

    // ── Generate unique filename ────────────────────────────

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const filePath = `products/${fileName}`;

    // ── Upload to Supabase ──────────────────────────────────

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from("tadorado-assets")
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // ── Get public URL ──────────────────────────────────────

    const { data } = supabaseAdmin.storage
      .from("tadorado-assets")
      .getPublicUrl(filePath);

    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
```

### Breaking down each section

**Validation:**
- **File existence check** — returns 400 immediately if no file, rather than crashing later with an obscure error
- **File type whitelist** — only allows common web image formats. This prevents someone from uploading an SVG (which could contain XSS), a PDF, or an executable. The check uses the MIME type from the browser, which is trustworthy enough for a server-side file check (the actual bytes are what get stored)
- **File size limit** — 5MB cap prevents abuse and large uploads filling up your Supabase storage quota. The Supabase free plan gives 1GB total

> **Why validate on the server?** Client-side validation is for user experience (instant feedback). Server-side validation is for security (the trust boundary). Never skip server-side validation — a user can bypass client code easily.

**Filename:**
- Uses `Date.now()` + random string + original extension. This guarantees uniqueness even if two admins upload files simultaneously. The original filename is NOT used to prevent collisions and path traversal attacks (e.g., a file named `../../../etc/passwd`)
- Files are stored under `products/` prefix to organize by use case. You might have `avatars/`, `banners/`, etc. for different purposes

**Upload:**
- `Buffer.from(await file.arrayBuffer())` converts the browser `File` to a Node.js `Buffer`. In Next.js App Router API routes, files from `formData()` are `File` objects. Supabase's Node.js client accepts `Buffer`
- `supabaseAdmin.storage.from("tadorado-assets").upload()` uses the service_role key, so it bypasses RLS entirely. This is why no RLS policies are needed
- `cacheControl: "3600"` tells browsers and CDNs to cache the image for 1 hour, improving performance for repeat visitors

**Error handling:**
- The outer try/catch catches unexpected errors (like network failures, Supabase downtime, etc.) and returns a clean 500 response instead of crashing the API route

### Warning: Do NOT use this pattern for user uploads

This API route uses the `service_role` key which has **unrestricted access** to your Supabase project. In this project, it's used for an **admin dashboard** that's only accessible to you. For user-generated uploads (e.g., profile pictures), you should use Supabase Auth + RLS policies instead, so users can only upload to their own folder.

---

## 9. Step 7: Create the ImageUpload Client Component

Create `components/admin/ImageUpload.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
  label?: string;
  currentImage?: string;
}

export default function ImageUpload({
  onUploadSuccess,
  label = "Upload Image",
  currentImage,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(
    currentImage || null
  );

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      setUploading(true);

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Upload failed");
      }

      setPreview(result.url);
      onUploadSuccess(result.url);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert("Error uploading image: " + errorMessage);
      console.error("Upload error details:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUploadSuccess("");
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative w-24 h-24 border rounded-lg overflow-hidden group">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
            />
            <button
              onClick={handleRemove}
              type="button"
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
        )}

        <div className="flex-1">
          <input
            type="file"
            id={`file-${label}`}
            className="hidden"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            asChild
          >
            <label
              htmlFor={`file-${label}`}
              className="cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Choose File"
              )}
            </label>
          </Button>
          <p className="mt-1 text-xs text-gray-500">
            PNG, JPG or WEBP. Max 5MB.
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Component props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onUploadSuccess` | `(url: string) => void` | required | Called when upload completes, passes back the public URL |
| `label` | `string` | `"Upload Image"` | The text label above the upload area |
| `currentImage` | `string` | `undefined` | Existing image URL to show as preview (for edit forms) |

### How it works

1. User clicks "Choose File" and picks an image
2. `handleUpload` fires on file selection
3. Creates a `FormData` with the file
4. POSTs it to `/api/admin/upload`
5. On success, shows the uploaded image preview
6. Calls `onUploadSuccess(url)` so the parent form can store the URL
7. The remove button clears the preview and passes empty string back

### Why `"use client"`?

This component uses `useState`, file input events, and `fetch` — all browser-only features. It must be a Client Component. However, the actual file upload is handled by the server API route, so no `service_role` key is exposed in the browser.

### Why no direct Supabase import?

Previous versions of this component imported `supabase` from `@/lib/supabase` and uploaded directly. That approach fails because the anon key has no RLS policy allowing INSERT. By removing the Supabase client import entirely and routing through your own API, you avoid both the RLS issue and keep the `service_role` key secure.

---

## 10. Step 8: Wire It Into a Form

Here's how to use the `ImageUpload` component in a product creation form:

```typescript
"use client";
import { useState } from "react";
import ImageUpload from "@/components/admin/ImageUpload";

export default function NewProductPage() {
  const [form, setForm] = useState({
    name: "",
    category: "male",
    subCategory: "senator",
    ageGroup: "adult",
    price: 0,
    image: "",
    hoverImage: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      // redirect or show success
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Other form fields... */}

      <ImageUpload
        label="Product Image"
        onUploadSuccess={(url) =>
          setForm((prev) => ({ ...prev, image: url }))
        }
        currentImage={form.image}
      />

      <ImageUpload
        label="Hover Image (Optional)"
        onUploadSuccess={(url) =>
          setForm((prev) => ({ ...prev, hoverImage: url }))
        }
        currentImage={form.hoverImage}
      />

      <button type="submit">Add Product</button>
    </form>
  );
}
```

### The flow end-to-end

1. Admin fills in product details (name, price, category, etc.)
2. Admin uploads an image via `ImageUpload` — this calls `/api/admin/upload` which:
   - Validates the file on the server
   - Uploads to Supabase Storage using `service_role` key
   - Returns the public URL
3. The URL is stored in the `form.image` state
4. Admin submits the form — the URL (not the file) is sent to `/api/admin/products`
5. The API route stores the URL string in the database's `image` column
6. The frontend renders the image using the stored URL via `<Image src={product.image} ... />`

### Key insight: The URL is what persists

You don't store the file in your database. You store the **URL** (a string) that points to the file in Supabase Storage. The file itself lives in Supabase, not in your database or on your server. This keeps your database small and your app fast.

---

## 11. Step 9: Configure next.config.ts for Remote Images

If you use Next.js `<Image>` component to display uploaded images, you need to add your Supabase storage domain to `remotePatterns`:

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "your-project-id.supabase.co",
      },
    ],
  },
};

export default nextConfig;
```

Without this, Next.js will refuse to optimize images from your Supabase storage URL and throw an error in development.

---

## 12. Step 10: Deploy to Vercel

When deploying to Vercel, add all three Supabase environment variables:

1. Go to your project on [Vercel Dashboard](https://vercel.com)
2. **Settings → Environment Variables**
3. Add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |

4. Deploy

> **Important:** The `SUPABASE_SERVICE_ROLE_KEY` (without `NEXT_PUBLIC_` prefix) must be added manually to Vercel. It is NOT included in your Git repository (it's in `.gitignore`). If you forget it, the build will succeed but the upload API will return a 500 error with "Missing SUPABASE_SERVICE_ROLE_KEY".

---

## Troubleshooting

### "Bucket not found" error

The bucket needs to be created in the Supabase Dashboard under **Storage**. The API route doesn't create it automatically.

### "Upload failed: The resource already exists"

By default, Supabase Storage does not overwrite existing files. Since we use `Date.now()` + random string in filenames, this is very unlikely. If it happens, add `{ upsert: true }` to the upload options to overwrite.

### Upload works locally but fails on Vercel

You likely forgot to add `SUPABASE_SERVICE_ROLE_KEY` to Vercel's environment variables. Check your Vercel project settings.

### "Hostname not configured" error from Next.js Image

Add your Supabase project hostname to `next.config.ts` → `images.remotePatterns` as shown in Step 9.

### CORS errors

Supabase Storage allows requests from all origins by default. If you get CORS errors, go to your Supabase Dashboard → **Storage** → **Configuration** → **CORS** and add your domain.

---

## Security Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is never prefixed with `NEXT_PUBLIC_`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is not hardcoded in any client component
- [ ] The API route validates file type and size on the server
- [ ] Filenames are sanitized — no user-provided names used directly
- [ ] The upload API is only accessible by admin (put it under `/api/admin/*` path)
- [ ] The bucket is public (for public-facing images) or uses signed URLs (for private content)
- [ ] No `supabaseAdmin` import exists in any `"use client"` file

---

## Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        Architecture                             │
│                                                                 │
│   Browser                  Server                    Supabase   │
│   ┌──────┐   FormData      ┌──────────┐   upload()    ┌──────┐ │
│   │ File │ ──────────────→ │ /api/   │ ─────────────→│Storage│ │
│   │      │                 │ admin/  │                │      │ │
│   │      │                 │ upload  │                │      │ │
│   │      │ ←── { url } ───│         │ ←──── URL ─────│      │ │
│   └──────┘                 └──────────┘               └──────┘ │
│       │                        │                                │
│       │  save url to form      │  no RLS needed                 │
│       ▼                        │  (service_role                 │
│   ┌──────────┐                 │   bypasses RLS)                │
│   │ Form     │                 │                                │
│   │ state    │                 │                                │
│   └──────────┘                 │                                │
└─────────────────────────────────────────────────────────────────┘
```

**Three files to copy to a new project:**

| File | Purpose |
|------|---------|
| `lib/supabase-admin.ts` | Server-only Supabase client with `service_role` key |
| `app/api/admin/upload/route.ts` | API route that validates and uploads files |
| `components/admin/ImageUpload.tsx` | Reusable client component with preview + upload UI |

**Three environment variables:**

| Variable | Where |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Local `.env` + Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Local `.env` + Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | Local `.env` + Vercel (server-only) |

**One bucket created in Supabase Dashboard:**
- Name: `tadorado-assets` (or your choice)
- Public: ✅
