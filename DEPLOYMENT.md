# 🚀 Vercel Deployment Guide for Tadorado Fashion

This guide outlines how to deploy the Tadorado Fashion Next.js 15 application to Vercel. The project has been optimized to handle serverless execution limits, prevent database connection pools from being exhausted, and run third-party integrations asynchronously after response delivery.

---

## Prerequisites

- **GitHub Repository** containing the codebase.
- **Vercel Account** connected to your GitHub account.
- **Supabase Database Instance** (PostgreSQL) with tables set up.
- **Google Cloud Service Account** (JSON credentials) for Google Sheets access.
- **Paystack Merchant Account** for handling checkouts.

---

## Step-by-Step Deployment

### 1. Link to Vercel

1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **Add New** → **Project**.
3. Import your GitHub repository.
4. Select **Next.js** as the Framework Preset (Vercel will detect it automatically).

### 2. Configure Environment Variables

Under the **Environment Variables** section in Vercel, copy and set the following configuration values:

#### Database Settings

| Key | Value Description | Example / Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | Transaction Connection Pooler URL with pool limit | Must append `&connection_limit=1` to prevent database connection exhaustion. Example: `postgresql://postgres.xxx:xxx@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Direct database connection string (port 5432) | Used by Prisma for schema push. Example: `postgresql://postgres.xxx:xxx@aws-0-eu-west-1.pooler.supabase.com:5432/postgres` |

#### Google Sheets API Integration

| Key | Value Description | Example / Notes |
| :--- | :--- | :--- |
| `GOOGLE_SERVICE_ACCOUNT` | Raw Google Cloud Service Account JSON credentials | Copy-paste the entire contents of the `.json` key file as-is. |
| `GOOGLE_SHEET_ID` | The spreadsheet unique ID | Extract from the URL. e.g., `1aBCdeFgHijKlMnOpQrStUvWxYz` |
| `GOOGLE_SHEET_FILENAME` | Tab/Sheet title to record orders | Default: `Tadorado` |

#### Paystack Integration

| Key | Value Description | Example / Notes |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack Public API Key | `pk_live_...` or `pk_test_...` |
| `PAYSTACK_SECRET_KEY` | Paystack Secret API Key | `sk_live_...` or `sk_test_...` |

#### Email Notifications (SMTP)

| Key | Value Description | Example / Notes |
| :--- | :--- | :--- |
| `SMTP_HOST` | Hostname of SMTP mail server | e.g., `smtp.gmail.com` |
| `SMTP_PORT` | Port of SMTP mail server | `465` (SSL) or `587` (TLS) |
| `SMTP_USER` | Email username | `your-email@gmail.com` |
| `SMTP_PASSWORD` | App-specific email password | Use app password if using Gmail 2FA |
| `SMTP_FROM` | Sender address | `"Tadorado Fashion" <your-email@gmail.com>` |
| `SMTP_TO` | Notification recipient address | `recipient-email@gmail.com` |

---

## Serverless Optimization Architecture

To prevent timeout limits (e.g., Vercel Hobby tier has a **10-second request timeout** limit), the codebase uses Next.js 15 `after()`:

- **Instant Checkouts:** Upon verifying a Paystack charge or validating a process order request, the endpoint returns an immediate success response to the client.
- **Asynchronous Execution:** SMTP email notifications and Google Sheets order appends run in the background after the response is delivered. This guarantees checkouts never timeout on Vercel.

---

## Verification and Monitoring

1. **Prisma Generation:**
   Vercel will run the `prisma generate` step automatically during installation via the `postinstall` script defined in `package.json`.
2. **Build Compilation:**
   Vercel compiles the static pages and API routes automatically. TypeScript checks are strict, but build-breaking warnings have been resolved.
3. **Log Checking:**
   If a customer checkouts successfully but the email or spreadsheet row is missing, check the **Vercel Logs** tab under the API endpoints. Since emails and Sheets run inside the `after()` block, errors will be printed to Vercel stdout/stderr without failing the request.
