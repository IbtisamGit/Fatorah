'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

export async function scanReceipt(formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file) {
      throw new Error('No file provided')
    }
    
    let categoriesList = 'Restaurants, Groceries, Transport, Utilities, Healthcare, Entertainment, Shopping, Travel, Education, Other'
    const catsStr = formData.get('categories') as string
    if (catsStr) {
      try {
        const parsedCats = JSON.parse(catsStr)
        if (Array.isArray(parsedCats) && parsedCats.length > 0) {
          categoriesList = parsedCats.join(', ')
        }
      } catch (e) {}
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing in .env.local')
    }

    const ai = new GoogleGenerativeAI(apiKey)
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' })
    
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Data = buffer.toString('base64')
    
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: file.type // supports image/png, image/jpeg, application/pdf
      }
    }
    
    const prompt = `
      You are an expert OCR AI specializing in global receipts and invoices.
      Analyze the attached document and extract the following information.
      Return the output ONLY as a valid JSON object. No markdown wrapping, no extra text.
      
      The JSON structure MUST perfectly match this structure:
      {
        "merchant": "Full name of the merchant/store/restaurant",
        "amount": 150.00,
        "tax": 15.00,
        "date": "YYYY-MM-DD",
        "category": "A single short descriptive category name. Prioritize choosing EXACTLY from this list: [${categoriesList}]. If none fit, you may invent a new short category.",
        "original_currency": "3-letter currency code if NOT SAR (e.g. USD, AED, EUR). Use null if SAR or unknown.",
        "converted_amount": null,
        "tags": ["tag1", "tag2"],
        "is_duplicate": false,
        "low_confidence_fields": []
      }
      
      Rules:
      - amount and tax must be numbers (not strings). If the amount is completely missing, unreadable, or redacted, return 0. Do NOT guess random numbers from unrelated fields like phone numbers or IDs.
      - date must be in YYYY-MM-DD format. If not found, use today's date.
      - category must be a short English noun phrase — no symbols or long sentences.
      - tags: generate 1-3 short contextual tags (e.g. business, lunch, subscription).
      - low_confidence_fields: list field names you are unsure about, especially if they were redacted or missing (e.g. ["amount", "date"]).
      - Do NOT include any text outside the JSON object.
    `
    
    const result = await model.generateContent([prompt, imagePart])
    const responseText = result.response.text()
    
    // Clean up potential markdown formatting from Gemini
    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()
    
    const parsed = JSON.parse(cleanedText)
    return { success: true, data: parsed }
    
  } catch (error: any) {
    console.error('Error scanning receipt:', error)
    return { success: false, error: error.message }
  }
}
