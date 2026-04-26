import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// 1. Define your allowed categories
const CATEGORIES = [
  "Groceries", "Food & Drinks", "Travel", "Entertainment", 
  "Shopping", "Transportation", "Services", "Health", "Other"
];

serve(async (req) => {
  try {
    // 2. Parse the incoming webhook payload from Supabase
    const payload = await req.json();
    const record = payload.record;

    // If there's no merchant, skip it
    if (!record || !record.merchant) {
      return new Response("No merchant found", { status: 200 });
    }

    const merchant = record.merchant;
    const recordId = record.id;

    // If the category is already set (e.g., manual entry), skip it
    if (record.category) {
      return new Response(JSON.stringify({ success: true, message: "Category already set, skipping" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 3. Ask Gemini to categorize the merchant
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const prompt = `Categorize the merchant '${merchant}'. Choose strictly from this list: [${CATEGORIES.join(", ")}]. Respond with ONLY the exact category name, nothing else.`;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const aiData = await geminiResponse.json();
    const guessedCategory = aiData.candidates[0].content.parts[0].text.trim();

    // 4. Update the row in Supabase with the new category
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error } = await supabaseClient
      .from('transactions')
      .update({ category: guessedCategory })
      .eq('id', recordId);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, category: guessedCategory }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
})