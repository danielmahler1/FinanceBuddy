import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ParsedReceipt {
  vendor: string | null;
  date: string | null;
  total: number | null;
  subtotal: number | null;
  tax: number | null;
  tip: number | null;
  items: Array<{ name: string; price: number }> | null;
  paymentMethod: string | null;
  confidence: 'high' | 'medium' | 'low';
}

@Injectable()
export class ReceiptService {
  private readonly logger = new Logger(ReceiptService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log('Gemini AI initialized successfully');
    } else {
      this.logger.warn('Gemini API key not configured - receipt parsing will not be available');
    }
  }

  async parseReceipt(imageBuffer: Buffer, mimeType: string): Promise<ParsedReceipt> {
    if (!this.genAI) {
      throw new Error('Gemini API not configured');
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      const prompt = this.buildPrompt();
      const base64Data = imageBuffer.toString('base64');

      this.logger.debug('Sending image to Gemini for parsing');

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
      ]);

      const response = result.response;
      const text = response.text();

      this.logger.debug('Received response from Gemini');

      const parsed = JSON.parse(text) as ParsedReceipt;
      return parsed;
    } catch (error) {
      this.logger.error('Error parsing receipt with Gemini', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error('Failed to parse receipt: ' + errorMessage);
    }
  }

  private buildPrompt(): string {
    return `You are a receipt data extraction expert. Analyze this receipt image and extract the following information.

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "vendor": "exact merchant name as shown on receipt",
  "date": "YYYY-MM-DD format or null if not found",
  "total": number (final amount paid, the largest/most prominent amount),
  "subtotal": number or null (amount before tax and tip),
  "tax": number or null,
  "tip": number or null,
  "items": [{"name": "item name", "price": number}] or null (individual line items if visible),
  "paymentMethod": "cash/card/credit/debit/etc or null",
  "confidence": "high" if all key fields (vendor, total, date) found clearly, "medium" if some key fields missing or unclear, "low" if mostly illegible or unclear
}

Key rules:
1. **Total** is the FINAL charged amount (after tax/tip). Look for keywords like "TOTAL", "BALANCE DUE", "AMOUNT DUE", or the largest/boldest number.
2. Parse dates flexibly - accept formats like MM/DD/YY, DD/MM/YY, MM/DD/YYYY, etc. Convert to YYYY-MM-DD.
3. Handle rotated, skewed, or poor quality images as best as possible.
4. If text is unclear or you're uncertain, set confidence to "low" or "medium".
5. Return null for fields you cannot determine with confidence.
6. All prices should be numbers without currency symbols (e.g., 12.99 not $12.99).
7. Vendor name should be the business name, typically found at the top of the receipt.
8. Items array should capture individual line items if clearly visible, otherwise null.

Analyze the receipt image now:`;
  }
}
