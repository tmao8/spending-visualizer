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
      .limit(500)

    if (!transactions || transactions.length === 0) {
      return "You haven't spent any money this month. Are you okay, or just really good at budgeting?"
    }

    // Summarize for the prompt
    let totalSpent = 0
    const categoryTotals = transactions.reduce((acc: any, t) => {
      const amt = Number(t.amount)
      totalSpent += amt
      acc[t.category] = (acc[t.category] || 0) + amt
      return acc
    }, {})

    // Top 5 largest purchases
    const biggestPurchases = [...transactions]
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5)
      .map(t => `${t.merchant}: $${t.amount}`)

    // Most frequent merchant
    const merchantCounts = transactions.reduce((acc: any, t) => {
      acc[t.merchant] = (acc[t.merchant] || 0) + 1
      return acc
    }, {})
    const mostFrequent = Object.entries(merchantCounts)
      .sort((a: any, b: any) => b[1] - a[1])[0]
    const frequentMerchantStr = mostFrequent ? `${mostFrequent[0]} (${mostFrequent[1]} times)` : 'None'

    const prompt = `
      You are a sarcastic, brutally honest, but ultimately helpful financial advisor.
      I will provide you with a summary of my spending over the last 30 days.
      I want you to "roast" my spending habits in 3 short, punchy paragraphs.
      Be funny, point out any ridiculous spending categories, and end with one piece of actual good advice.
      Format your response in simple markdown (no headers, just paragraphs and maybe bold text).
      
      Here is my spending profile for the last 30 days:
      Total Spent: $${totalSpent.toFixed(2)}
      
      Spending by category:
      ${JSON.stringify(categoryTotals, null, 2)}
      
      My 5 largest single purchases (splurges):
      ${JSON.stringify(biggestPurchases, null, 2)}
      
      My most frequently visited merchant:
      ${frequentMerchantStr}
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
