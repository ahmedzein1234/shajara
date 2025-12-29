/**
 * AI Extraction API Route
 * Processes natural language input to extract family member information
 */

import { NextRequest, NextResponse } from 'next/server';
import { OpenRouterService, FamilyContext, AIExtractionResult } from '@/lib/ai/openrouter';

// Note: Runs on Cloudflare Workers via nodejs_compat

interface ExtractRequest {
  input: string;
  context: FamilyContext;
  locale: 'ar' | 'en';
}

export async function POST(request: NextRequest) {
  try {
    const body: ExtractRequest = await request.json();
    const { input, context, locale } = body;

    if (!input || input.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          persons: [],
          relationships: [],
          confidence: 0,
          error: locale === 'ar' ? 'الرجاء إدخال نص' : 'Please enter text',
        } as AIExtractionResult,
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';

    if (!apiKey) {
      console.error('OpenRouter API key not configured');
      return NextResponse.json(
        {
          success: false,
          persons: [],
          relationships: [],
          confidence: 0,
          error: locale === 'ar'
            ? 'خدمة الذكاء الاصطناعي غير متاحة حالياً'
            : 'AI service is currently unavailable',
        } as AIExtractionResult,
        { status: 503 }
      );
    }

    // Initialize service and extract
    const service = new OpenRouterService(apiKey, model);
    const result = await service.extractFamilyInfo(input, context, locale);

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI extraction error:', error);

    return NextResponse.json(
      {
        success: false,
        persons: [],
        relationships: [],
        confidence: 0,
        error: 'Internal server error',
      } as AIExtractionResult,
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  const hasApiKey = !!process.env.OPENROUTER_API_KEY;

  return NextResponse.json({
    status: hasApiKey ? 'ready' : 'unconfigured',
    model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku',
  });
}
