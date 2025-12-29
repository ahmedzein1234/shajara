/**
 * OpenRouter AI Service
 * Handles communication with OpenRouter API for natural language processing
 */

import { Person, Relationship, RelationshipType, Gender } from '@/lib/db/schema';

// Types for AI extraction
export interface ExtractedPerson {
  given_name: string;
  patronymic_chain?: string;
  family_name?: string;
  gender: Gender;
  birth_date?: string;
  birth_place?: string;
  death_date?: string;
  death_place?: string;
  is_living: boolean;
  notes?: string;
}

export interface ExtractedRelationship {
  type: RelationshipType;
  to_person_name?: string; // Name of existing person to connect to
  to_person_id?: string; // ID if matched
  role: 'parent' | 'child' | 'spouse' | 'sibling';
  marriage_date?: string;
  marriage_place?: string;
}

export interface AIExtractionResult {
  success: boolean;
  persons: ExtractedPerson[];
  relationships: ExtractedRelationship[];
  confidence: number; // 0-1
  suggestions?: string[]; // Smart suggestions
  raw_interpretation?: string; // AI's interpretation for user review
  error?: string;
}

export interface FamilyContext {
  existingPersons: Array<{
    id: string;
    name: string;
    gender: Gender;
  }>;
  focusPersonId?: string; // Currently selected person
  focusPersonName?: string;
}

const SYSTEM_PROMPT_AR = `أنت مساعد ذكي متخصص في شجرات العائلة العربية. مهمتك هي استخراج معلومات الأشخاص والعلاقات من النص العربي.

القواعد:
1. استخرج الأسماء العربية بشكل صحيح (الاسم الأول، سلسلة النسب "بن/ابن/بنت"، اسم العائلة)
2. حدد الجنس من السياق (الأسماء، الألقاب، الصفات)
3. استخرج التواريخ (ميلادية أو هجرية) والأماكن
4. حدد نوع العلاقة بدقة (أب، أم، زوج/زوجة، ابن/ابنة، أخ/أخت)
5. إذا ذُكر شخص موجود في السياق، اربط به

أنواع العلاقات:
- parent: علاقة أب/أم مع ابن/ابنة
- spouse: علاقة زواج
- sibling: علاقة أخوة

أجب بتنسيق JSON فقط.`;

const SYSTEM_PROMPT_EN = `You are an intelligent assistant specialized in Arabic family trees. Your task is to extract person information and relationships from text.

Rules:
1. Extract Arabic names correctly (given name, patronymic chain "bin/ibn/bint", family name)
2. Determine gender from context (names, titles, adjectives)
3. Extract dates (Gregorian or Hijri) and places
4. Identify relationship type accurately (father, mother, spouse, son/daughter, sibling)
5. If an existing person is mentioned in context, link to them

Relationship types:
- parent: parent-child relationship
- spouse: marriage relationship
- sibling: sibling relationship

Respond in JSON format only.`;

const EXTRACTION_SCHEMA = `
{
  "persons": [
    {
      "given_name": "string (required)",
      "patronymic_chain": "string (optional, e.g., 'بن خالد بن محمد')",
      "family_name": "string (optional)",
      "gender": "male | female",
      "birth_date": "string (ISO format or Arabic, optional)",
      "birth_place": "string (optional)",
      "death_date": "string (optional)",
      "death_place": "string (optional)",
      "is_living": "boolean",
      "notes": "string (optional)"
    }
  ],
  "relationships": [
    {
      "type": "parent | spouse | sibling",
      "to_person_name": "string (name of person to connect to)",
      "role": "parent | child | spouse | sibling",
      "marriage_date": "string (for spouse, optional)",
      "marriage_place": "string (for spouse, optional)"
    }
  ],
  "interpretation": "string (brief explanation of what was understood)",
  "confidence": "number (0-1)",
  "suggestions": ["string (clarifying questions or suggestions)"]
}`;

export class OpenRouterService {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || '';
    this.model = model || process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';
  }

  async extractFamilyInfo(
    userInput: string,
    context: FamilyContext,
    locale: 'ar' | 'en' = 'ar'
  ): Promise<AIExtractionResult> {
    if (!this.apiKey) {
      return {
        success: false,
        persons: [],
        relationships: [],
        confidence: 0,
        error: 'OpenRouter API key not configured',
      };
    }

    const systemPrompt = locale === 'ar' ? SYSTEM_PROMPT_AR : SYSTEM_PROMPT_EN;

    const contextInfo = context.existingPersons.length > 0
      ? `\n\nExisting family members:\n${context.existingPersons.map(p => `- ${p.name} (${p.id})`).join('\n')}`
      + (context.focusPersonName ? `\n\nCurrently focused on: ${context.focusPersonName} (${context.focusPersonId})` : '')
      : '';

    const userPrompt = `${userInput}${contextInfo}\n\nExtract information and respond with JSON matching this schema:\n${EXTRACTION_SCHEMA}`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Shajara Family Tree',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenRouter API error:', error);
        return {
          success: false,
          persons: [],
          relationships: [],
          confidence: 0,
          error: `API Error: ${response.status}`,
        };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        return {
          success: false,
          persons: [],
          relationships: [],
          confidence: 0,
          error: 'No response from AI',
        };
      }

      // Parse JSON response
      const parsed = JSON.parse(content);

      // Match relationships to existing persons
      const enrichedRelationships = this.matchRelationshipsToContext(
        parsed.relationships || [],
        context
      );

      return {
        success: true,
        persons: parsed.persons || [],
        relationships: enrichedRelationships,
        confidence: parsed.confidence || 0.8,
        suggestions: parsed.suggestions,
        raw_interpretation: parsed.interpretation,
      };
    } catch (error) {
      console.error('AI extraction error:', error);
      return {
        success: false,
        persons: [],
        relationships: [],
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private matchRelationshipsToContext(
    relationships: ExtractedRelationship[],
    context: FamilyContext
  ): ExtractedRelationship[] {
    return relationships.map(rel => {
      if (rel.to_person_name && !rel.to_person_id) {
        // Try to find matching person in context
        const match = context.existingPersons.find(p =>
          p.name.includes(rel.to_person_name!) ||
          rel.to_person_name!.includes(p.name)
        );
        if (match) {
          return { ...rel, to_person_id: match.id };
        }
      }
      return rel;
    });
  }

  async generateSuggestions(
    partialInput: string,
    context: FamilyContext,
    locale: 'ar' | 'en' = 'ar'
  ): Promise<string[]> {
    // Quick suggestions based on common patterns
    const suggestions: string[] = [];

    if (locale === 'ar') {
      if (partialInput.includes('أب') || partialInput.includes('والد')) {
        suggestions.push('أبي اسمه... ولد في سنة... في مدينة...');
      }
      if (partialInput.includes('أم') || partialInput.includes('والد')) {
        suggestions.push('أمي اسمها... ولدت في سنة... في مدينة...');
      }
      if (partialInput.includes('جد')) {
        suggestions.push('جدي من جهة أبي/أمي اسمه...');
      }
      if (partialInput.includes('أخ') || partialInput.includes('أخت')) {
        suggestions.push('لدي أخ/أخت اسمه/ها... أكبر/أصغر مني');
      }
      if (partialInput.includes('زوج') || partialInput.includes('زوجة')) {
        suggestions.push('زوجي/زوجتي اسمه/ها... تزوجنا في سنة...');
      }
      if (partialInput.includes('ابن') || partialInput.includes('ابنة') || partialInput.includes('ولد')) {
        suggestions.push('لدي ابن/ابنة اسمه/ها... ولد/ولدت في سنة...');
      }
    } else {
      if (partialInput.toLowerCase().includes('father')) {
        suggestions.push('My father\'s name is... born in year... in city...');
      }
      if (partialInput.toLowerCase().includes('mother')) {
        suggestions.push('My mother\'s name is... born in year... in city...');
      }
      if (partialInput.toLowerCase().includes('grand')) {
        suggestions.push('My grandfather/grandmother on my father\'s/mother\'s side is named...');
      }
    }

    return suggestions;
  }
}

// Singleton instance
let openRouterInstance: OpenRouterService | null = null;

export function getOpenRouterService(): OpenRouterService {
  if (!openRouterInstance) {
    openRouterInstance = new OpenRouterService();
  }
  return openRouterInstance;
}

export default OpenRouterService;
