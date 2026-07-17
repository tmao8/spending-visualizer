import re

with open('src/lib/services/transactions.ts', 'r') as f:
    content = f.read()

# 1. Insert cache helper at the top after imports
cache_helper = """
const IN_MEMORY_CACHE = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

async function withCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const cached = IN_MEMORY_CACHE.get(key)
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T
  }
  const data = await fetcher()
  IN_MEMORY_CACHE.set(key, { data, timestamp: now })
  return data
}
"""

content = re.sub(r'(function getCalendarDay)', cache_helper + r'\n\1', content, count=1)

# List of functions to wrap
funcs = [
    ('getSpendingByCategory', 'supabase: SupabaseClient, filter?: FilterOptions, startDate?: string, endDate?: string', '`getSpendingByCategory-${JSON.stringify(filter)}-${startDate}-${endDate}`'),
    ('getSpendingByCard', 'supabase: SupabaseClient, filter?: FilterOptions, startDate?: string, endDate?: string', '`getSpendingByCard-${JSON.stringify(filter)}-${startDate}-${endDate}`'),
    ('getMonthlyTotal', 'supabase: SupabaseClient', '`getMonthlyTotal`'),
    ('getRecentTransactions', 'supabase: SupabaseClient, limit = 10', '`getRecentTransactions-${limit}`'),
    ('getDailySpending', 'supabase: SupabaseClient, days = 30, offsetDays = 0, filter?: FilterOptions, groupInterval = 1, groupBy: \'day\' | \'week\' | \'month\' = \'day\'', '`getDailySpending-${days}-${offsetDays}-${JSON.stringify(filter)}-${groupInterval}-${groupBy}`'),
    ('getWeeklySpending', 'supabase: SupabaseClient, weekOffset = 0, filter?: FilterOptions', '`getWeeklySpending-${weekOffset}-${JSON.stringify(filter)}`'),
    ('getMonthlySpendingTrend', 'supabase: SupabaseClient, monthOffset = 0, filter?: FilterOptions', '`getMonthlySpendingTrend-${monthOffset}-${JSON.stringify(filter)}`'),
    ('getYearlySpending', 'supabase: SupabaseClient, yearOffset = 0, filter?: FilterOptions', '`getYearlySpending-${yearOffset}-${JSON.stringify(filter)}`'),
    ('getFirstTransactionDate', 'supabase: SupabaseClient', '`getFirstTransactionDate`'),
    ('getHistoricalMonthlyAverage', 'supabase: SupabaseClient', '`getHistoricalMonthlyAverage`'),
    ('getSubscriptions', 'supabase: SupabaseClient', '`getSubscriptions`'),
    ('getBudgets', 'supabase: SupabaseClient', '`getBudgets`'),
]

for func_name, args, cache_key in funcs:
    # Match the function signature and the opening brace
    pattern = r'export async function ' + func_name + r'\(' + re.escape(args) + r'\)\s*\{'
    # Replacement string injects the return withCache wrapper
    replacement = f'export async function {func_name}({args}) {{\n  return withCache({cache_key}, async () => {{'
    
    # We also need to close the `});` at the end of the function.
    # We can do this by finding the next `export async function` or end of file, and replacing the last `}` before it.
    
    # First replace the signature
    content = re.sub(pattern, replacement, content)

# Now we need to close the wrappers.
# Since we know each function ends before the next export (or EOF),
# we can use a quick regex to replace the last `}` before `export` with `  })\n}`
parts = re.split(r'(?=\nexport async function )', content)
for i in range(len(parts)):
    if 'return withCache(' in parts[i]:
        # Replace the last occurrence of `}` with `  })\n}`
        parts[i] = re.sub(r'}(?=\s*$)', r'  })\n}', parts[i])

new_content = "".join(parts)

with open('src/lib/services/transactions.ts', 'w') as f:
    f.write(new_content)

print("Patch applied successfully.")
