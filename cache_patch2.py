import re

with open('src/lib/services/transactions.ts', 'r') as f:
    content = f.read()

funcs = [
    ('getTransactionsForRange', 'supabase: SupabaseClient, startDate: string, endDate: string', '`getTransactionsForRange-${startDate}-${endDate}`'),
]

for func_name, args, cache_key in funcs:
    pattern = r'export async function ' + func_name + r'\(' + re.escape(args) + r'\)\s*\{'
    replacement = f'export async function {func_name}({args}) {{\n  return withCache({cache_key}, async () => {{'
    content = re.sub(pattern, replacement, content)

# Close wrapper for getTransactionsForRange (ends before next export)
parts = re.split(r'(?=\nexport async function )', content)
for i in range(len(parts)):
    if 'getTransactionsForRange(' in parts[i] and 'return withCache(' in parts[i]:
        parts[i] = re.sub(r'}(?=\s*$)', r'  })\n}', parts[i])

with open('src/lib/services/transactions.ts', 'w') as f:
    f.write("".join(parts))

print("Patch 2 applied successfully.")
