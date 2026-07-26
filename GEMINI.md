# Clarity - Spending Visualizer

A clean, high-contrast dashboard for tracking personal spending, optimized for quick insights and trend analysis. It features a premium design with full dark mode support, fluid micro-interactions, and AI-driven features.

## Tech Stack
- **Framework:** Next.js 16+ (App Router)
- **Language:** TypeScript
- **Database/Auth:** Supabase
- **Styling:** Tailwind CSS (Dark Mode enabled via `next-themes` using `dark:` classes)
- **Animations:** Framer Motion, React CountUp
- **Icons:** Lucide React
- **Charts:** Recharts
- **AI Integration:** `@google/genai` (Gemini 2.5 Flash / Gemini Pro)

## Architecture & Data Flow
- **Transaction Entry:** Transactions are synced securely via the Plaid API (`src/lib/services/plaid.ts`) into the Supabase `transactions` table.
- **Categorization:** A Supabase Edge Function (`supabase/functions/categorize-transaction`) is triggered on insertion. It uses the Gemini API to automatically categorize merchants.
- **AI Coaching:** A Next.js Server Action (`src/app/dashboard/actions/ai.ts`) leverages Gemini to analyze the user's spending habits over the last 30 days and provide a witty "Roast" and financial advice on the Dashboard.
- **Data Fetching:** The dashboard (`src/app/dashboard/page.tsx`) and trends page (`src/app/dashboard/trends/page.tsx`) fetch data directly from Supabase using concurrent Server Components (`Promise.all`).
- **Pagination & Performance:** Aggregation queries (e.g., `getDailySpending`) support `limit` and `page` parameters to prevent memory bloat, processed efficiently on the server.
- **Service Layer:** `src/lib/services/transactions.ts` contains all logic for aggregations, trend calculations (e.g. `getSubscriptions`), and fetching activity. Shared constants (like category colors) are stored in `src/lib/constants.ts`.

## Key Features
- **Subscription Sentinel:** A "Safe to Spend" metric that calculates total liquid cash (checking/savings from Plaid balances) minus upcoming predicted recurring subscriptions.
- **AI Financial Coach:** A dynamic widget (`AIRoastWidget`) providing personalized feedback based on recent transactions.
- **Budgeting System:** Includes division-by-zero guards, prevents zero/negative budgets, and utilizes an amber "warning zone" (80-100% of budget) in the progress UI.
- **Dark Mode:** A fully integrated dark mode switch (`ThemeToggle`) that transforms the UI into a sleek, low-light optimized experience using `dark:` variants.
- **Robust Error Handling:** Features a global `error.tsx` boundary for the dashboard, alongside component-level error and empty states (e.g. in `CardBalances`).

## Key Files
- `src/lib/services/transactions.ts`: The "brain" of the data fetching.
- `src/lib/services/plaid.ts`: Plaid integration and balance fetching.
- `src/app/dashboard/page.tsx`: Main entry point for the summary view and dashboard widgets.
- `src/app/dashboard/actions/ai.ts`: Server action for the AI Financial Coach.
- `src/lib/constants.ts`: Shared configuration and color schemes.
- `supabase/functions/categorize-transaction/index.ts`: AI categorization logic.

## Deployments
- **Hosting:** The application is deployed on Vercel.
- **Environment Variables:** Requires `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV`, and `GEMINI_API_KEY` to be configured in the Vercel dashboard.
- **Build Process:** Uses the standard Next.js build pipeline (`npm run build`). Vercel automatically detects the Next.js framework and builds the app.
- **Edge Functions:** Supabase edge functions (like `categorize-transaction`) are deployed separately via the Supabase CLI to the linked Supabase project.

## Known Patterns
- **User-Specific Data:** The application relies on Supabase Row Level Security (RLS) policies to ensure users only access their own data. Auth context (`supabase.auth.getUser()`) is checked at the root of protected routes.
- **Caching:** The application relies heavily on Next.js Server Components. Data fetching is configured with `export const dynamic = 'force-dynamic'` in key routes to reflect real-time updates from Plaid webhooks.
- **Client vs Server Components:** Animations (`framer-motion`), interactions (`react-countup`), and interactive widgets are isolated into `"use client"` components (e.g., `NumberTicker`, `AIRoastWidget`), which are then imported into Server Components.
