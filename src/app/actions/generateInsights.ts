'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

export async function generateInsights(expensesJson: string, budget: number, currency: string, locale: string = 'ar') {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing in .env.local')
    }

    const ai = new GoogleGenerativeAI(apiKey)
    const model = ai.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.1 }
    })
    
    const language = locale === 'en' ? 'English' : 'Arabic'

    const prompt = `
      You are an expert, professional, and friendly Financial Advisor AI for a personal finance app.
      Your job is to analyze the user's recent expenses and provide a structured JSON report.
      
      User's Monthly Budget: ${budget} ${currency}
      User's Expenses (JSON array):
      ${expensesJson}
      
      Analyze the data deeply and return a JSON object exactly matching this schema:
      {
        "score": number, // A financial health score from 0 to 100. 100 means excellent (well under budget, healthy spending). 0 means terrible (over budget, erratic spending).
        "score_message": string, // A short motivational or warning phrase (in ${language}) summarizing the score.
        "behaviors": string[], // 2 to 3 bullet points (in ${language}) observing their spending habits (e.g. "Most of your money goes to food", "You spend a lot on weekends").
        "anomalies": string[], // 0 to 2 bullet points (in ${language}) pointing out unusual or very large transactions that stand out. If none, return an empty array.
        "advice": string[] // 2 actionable pieces of advice (in ${language}) on how to improve or maintain their budget for the rest of the month.
      }
      
      Rules:
      - The output MUST be valid JSON only. No markdown formatting like \`\`\`json.
      - All text fields MUST be written in conversational, encouraging ${language}.
      - If there are no expenses, provide a welcoming message telling them to start scanning receipts, and give a score of 100.
      - Be specific! Mention category names and amounts when relevant.
    `
    
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    // Clean up potential markdown formatting from Gemini
    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()
    
    const parsed = JSON.parse(cleanedText)
    return { success: true, data: parsed }
    
  } catch (error: any) {
    console.error('Error generating insights:', error)
    return { success: false, error: error.message }
  }
}
