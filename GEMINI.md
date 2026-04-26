# Clarity - Spending Visualizer

A clean, high-contrast dashboard for tracking personal spending, optimized for quick insights and trend analysis.

## Tech Stack
- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Database/Auth:** Supabase
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Charts:** Recharts

## Architecture & Data Flow
- **Transaction Entry:** Transactions are **NOT** added through this web interface. They are inserted directly into the Supabase `transactions` table via **iPhone Shortcuts**.
- **Categorization:** A Supabase Edge Function (`supabase/functions/categorize-transaction`) is triggered on insertion. It uses the Gemini API to automatically categorize merchants.
- **Data Fetching:** The dashboard (`src/app/dashboard/page.tsx`) and trends page (`src/app/dashboard/trends/page.tsx`) fetch data directly from Supabase using Server Components.
- **Service Layer:** `src/lib/services/transactions.ts` contains all logic for aggregations, trend calculations, and fetching recent activity.

## Key Files
- `src/lib/services/transactions.ts`: The "brain" of the data fetching.
- `src/app/dashboard/page.tsx`: Main entry point for the summary view.
- `supabase/functions/categorize-transaction/index.ts`: AI categorization logic.

## Known Patterns
- **User-Specific:** While the code doesn't explicitly filter by `user_id` in many queries, it assumes a single-user environment where the authenticated user owns all data in the `transactions` table (managed via Supabase RLS).
- **Caching:** The application relies on Next.js Server Components. Ensure that data fetching remains dynamic to reflect real-time updates from external sources like iPhone Shortcuts.
