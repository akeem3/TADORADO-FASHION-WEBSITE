# EPIC 3: Performance & Core Web Vitals Optimization

## Overview
This epic specifically targets the "slow and draggy" initial load times of the Tadorado Fashion platform. Currently, the application heavily relies on Client-Side Rendering (CSR) due to global `"use client"` directives on root pages. Furthermore, native Next.js image optimization has been explicitly disabled, forcing browsers to download massive, uncompressed images. This epic rectifies these architectural flaws to achieve near-instant perceived load times.

## Objectives
- Convert the main homepage from a Client Component to a Server Component to pre-render the DOM instantly.
- Re-enable and correctly configure the Next.js `<Image />` optimization engine for the new Supabase storage domain.
- Ensure typography and custom fonts load seamlessly without causing Cumulative Layout Shift (CLS).

---

## User Stories

### Story 3.1: Server Component Transformation (Homepage)
**As a user, I want the homepage to load instantly when I visit the URL so that I do not stare at a blank screen or experience UI dragginess while JavaScript is downloading.**

- **Detailed Description:** The `app/page.tsx` file currently begins with `"use client";`. In Next.js App Router, this forces the entire page, including static headers, footers, and structural `div`s, to be processed in the browser. By removing this, Next.js will Server-Side Render (SSR) the page, sending a complete HTML shell instantly.
- **Action Items:**
  - Open `app/page.tsx` and delete the `"use client";` directive.
  - Audit all child components imported into `page.tsx` (e.g., `BannerSection`, `AboutSection`, `CategoriesSection`).
  - If a child component uses `framer-motion`, `useState`, `useEffect`, or DOM event listeners (like `onClick`), ensure that specific component file starts with `"use client";`.
  - If a child component is purely presentational (just static HTML/Tailwind), ensure it remains a Server Component.
  - Start the development server and verify there are no hydration mismatch errors or React Server Component (RSC) payload errors.

### Story 3.2: Native Image Optimization Restoration
**As a user on a mobile network, I want product images to load quickly and consume minimal data so that my browsing experience is smooth.**

- **Detailed Description:** In `next.config.ts`, the `unoptimized: true` flag was set, likely because Firebase images were causing Next.js cache issues. With Supabase, we must rely on Next.js to dynamically compress, resize, and convert images to WebP/AVIF formats based on the user's device screen size.
- **Action Items:**
  - Open `next.config.ts`.
  - Locate the `images` configuration block and remove `unoptimized: true`.
  - Delete the old remote pattern for `firebasestorage.googleapis.com`.
  - Add a new remote pattern authorizing the Supabase storage domain. Example:
    ```javascript
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '[your-supabase-project-ref].supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ]
    ```
  - Verify that the `<Image />` components in `BannerSection.tsx` and the `ProductCard` components are using the correct `width` and `height` attributes (or `fill` with `sizes` props).

### Story 3.3: Typography and Font CLS Prevention
**As a user, I want the text on the screen to remain stable while loading so that the layout does not abruptly jump around (Cumulative Layout Shift).**

- **Detailed Description:** Custom fonts can sometimes cause layout shifts if the browser renders fallback fonts first and swaps them out later. We must ensure `next/font/google` is strictly enforcing the `swap` display property and preloading core font weights.
- **Action Items:**
  - Open `app/layout.tsx`.
  - Verify the `Poppins` font is imported from `next/font/google`.
  - Ensure the configuration object includes `display: "swap"`.
  - Verify the font class is correctly applied to the `<body>` tag so it inherits globally without stuttering.

### Story 3.4: Deferring Non-Critical Components (Dynamic Imports)
**As a performance auditor, I want heavy, below-the-fold components to load only when needed so that the initial JavaScript payload size is drastically reduced.**

- **Detailed Description:** Components like `TestimonialsSection` or `ContactSection` are at the very bottom of the homepage. Loading their JavaScript immediately delays the interactivity (TTI) of the top Banner and Shop buttons.
- **Action Items:**
  - Import Next.js `dynamic` (`import dynamic from 'next/dynamic'`).
  - Refactor the imports for below-the-fold sections in `app/page.tsx` to use dynamic imports.
  - Add a lightweight `loading` fallback (like a skeleton loader) for these sections.

---

## Acceptance Criteria
- [ ] `app/page.tsx` does not contain `"use client"`.
- [ ] The application compiles without Server Component/Client Component boundary errors.
- [ ] `next.config.ts` successfully allows Next.js to optimize images.
- [ ] Inspecting the Network tab in Chrome DevTools shows that images are being downloaded as `webp` or `avif` with highly compressed file sizes (e.g., 50kb instead of 2MB).
- [ ] Lighthouse Performance score on the homepage jumps significantly compared to the old Render/CSR deployment.
