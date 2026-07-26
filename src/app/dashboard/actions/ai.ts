'use server'

import { createClient } from '@/utils/supabase/server'
import { GoogleGenAI } from '@google/genai'
import { subDays } from 'date-fns'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function generateFinancialRoast() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    // Fetch last 30 days of transactions for context
    const startDate = subDays(new Date(), 30).toISOString()
    const { data: transactions } = await supabase
      .from('transactions')
      .select('merchant, amount, category, created_at')
      .gte('created_at', startDate)
      .order('created_at', { ascending: false })
      .limit(100)

    if (!transactions || transactions.length === 0) {
      return "You haven't spent any money this month. Are you okay, or just really good at budgeting?"
    }

    // Summarize for the prompt
    const categoryTotals = transactions.reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount)
      return acc
    }, {})

    const prompt = `
      You are a sarcastic, brutally honest, but ultimately helpful financial advisor.
      I will provide you with a summary of my spending over the last 30 days.
      I want you to "roast" my spending habits in 3 short, punchy paragraphs.
      Be funny, point out any ridiculous spending categories, and end with one piece of actual good advice.
      Format your response in simple markdown (no headers, just paragraphs and maybe bold text).
      
      Here is my spending by category:
      ${JSON.stringify(categoryTotals, null, 2)}
      
      Top 5 recent transactions:
      ${JSON.stringify(transactions.slice(0, 5).map(t => `${t.merchant}: $${t.amount}`), null, 2)}
    `

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    })

    return response.text
  } catch (error) {
    console.error('Error generating AI roast:', error)
    return "I tried to look at your finances, but my AI circuits fried from the sheer irresponsibility. (Error generating roast)"
  }
}
