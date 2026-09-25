'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

export async function scanReceipt(formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file) {
      throw new Error('No file provided')
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
      Return the output ONLY as a valid JSON object. No markdown wrapping.
      
      The JSON structure MUST perfectly match this structure:
      {
        "merchant": "Name of the merchant/store",
        "amount": 150.00, // Total amount as a number
        "tax": 15.00, // Total tax/VAT amount as a number (0 if none)
        "date": "YYYY-MM-DD", // Date of the receipt
        "category": "one of: Restaurants, Transport, Groceries, Utilities, Software, Travel, Other",
        "original_currency": "Currency code (e.g., USD, AED, EUR). Null if not found or if SAR.",
        "converted_amount": 150.00, // Number. If original_currency is not SAR, provide estimated conversion to SAR. Otherwise null.
        "tags": ["tag1", "tag2"], // Generate 1-3 contextual tags like BusinessTrip, Breakfast, SaaS, etc.
        "is_duplicate": false, // Always false for now
        "low_confidence_fields": [] // Array of field names (e.g. 'amount', 'merchant', 'date') you are not confident about extracting accurately.
      }
      
      Do not include any text outside the JSON object. 
      Ensure numeric values are returned as numbers, not strings.
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
