import { queryOpenRouter, ChatMessage } from '@/lib/openrouter';

export interface ParsedJobOutput {
  requiredSkills: string[];
  preferredSkills: string[];
  experienceRequirements: string;
  responsibilities: string[];
  educationRequirements: string;
  keywords: string[];
}

function parseJSONSafe<T>(jsonStr: string, fallback: T): T {
  try {
    let cleanStr = jsonStr.trim();
    if (cleanStr.startsWith('```json')) {
      cleanStr = cleanStr.substring(7);
    } else if (cleanStr.startsWith('```')) {
      cleanStr = cleanStr.substring(3);
    }
    if (cleanStr.endsWith('```')) {
      cleanStr = cleanStr.substring(0, cleanStr.length - 3);
    }
    return JSON.parse(cleanStr.trim()) as T;
  } catch (e) {
    console.error('Failed to parse Job Parser JSON:', e, jsonStr);
    return fallback;
  }
}

export class JobParser {
  /**
   * Calls Hermes 3 to parse job details into structured properties.
   */
  static async parseJobDescription(
    title: string,
    company: string,
    description: string
  ): Promise<ParsedJobOutput> {
    const systemPrompt = `You are a professional technical recruiter and job analyst.
Analyze the provided job title and description. You MUST respond with a JSON object matching this schema strictly. Do not include extra text.

JSON Schema:
{
  "requiredSkills": ["React", "TypeScript"],
  "preferredSkills": ["Next.js", "Docker"],
  "experienceRequirements": "3+ years of experience in React development",
  "responsibilities": ["Build frontend panels", "Implement unit tests"],
  "educationRequirements": "Bachelor's degree in Computer Science or related field",
  "keywords": ["Frontend", "Developer", "React"]
}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Job Title: ${title}\nCompany: ${company}\nJob Description:\n${description}` },
    ];

    const responseText = await queryOpenRouter(messages, {
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    return parseJSONSafe<ParsedJobOutput>(responseText, {
      requiredSkills: [],
      preferredSkills: [],
      experienceRequirements: 'Not Specified',
      responsibilities: [],
      educationRequirements: 'Not Specified',
      keywords: [],
    });
  }
}
