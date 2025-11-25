
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StrategyProfile, Trend, ActionPlan, ContentItem, ContentAssets, YouTubeAnalyticsSummary } from '../types';
import { VEO_PROMPT_TEMPLATES } from '../constants';
import { getGlobalConfig } from './configService';

// Helper to sanitize JSON string if Markdown code blocks are present
function cleanJson(text: string): string {
  if (!text) return '{}';
  return text.replace(/```json\n|\n```/g, '').replace(/```/g, '');
}

async function getGeminiClient(): Promise<GoogleGenAI> {
  const cfg = await getGlobalConfig();
  if (!cfg.geminiApiKey) {
    throw new Error('Gemini API key not configured in GlobalConfig');
  }
  return new GoogleGenAI({ apiKey: cfg.geminiApiKey });
}

export async function generateActionPlan(
  profile: StrategyProfile,
  trends: Trend[],
  analytics: YouTubeAnalyticsSummary
): Promise<ActionPlan> {
  const ai = await getGeminiClient();
  const modelId = "gemini-2.5-flash"; 

  // Filter trends to ensure we only have valid data
  const validTrends = trends.filter(t => t.topic && t.id).slice(0, 15);
  
  if (validTrends.length === 0) {
      throw new Error("No valid trends available for planning.");
  }

  const trendsContext = validTrends.map(t => 
    `- Topic: ${t.topic} (Source ID: ${t.sourceVideoId}, Category: ${t.category})`
  ).join('\n');

  const analyticsContext = `
    Views (28d): ${analytics.views}
    VTR: ${analytics.vtr}%
    Avg Duration: ${analytics.avgViewDurationSeconds}s
  `;

  const prompt = `
    You are an autonomous YouTube growth strategist for an AI channel.
    
    STRATEGY PROFILE:
    Niche: ${profile.niche}
    Language: ${profile.language} (Output must be in this language)
    Videos/Day: ${profile.videosPerDay}
    Shorts/Day: ${profile.shortsPerDay}

    REAL-TIME TRENDS (YouTube Data):
    ${trendsContext}

    CHANNEL PERFORMANCE:
    ${analyticsContext}

    TASK:
    Generate a daily content action plan based ONLY on the provided trends. 
    DO NOT hallucinate new AI models or releases. Use the provided topics.
    
    1. Select ${profile.videosPerDay} LONGFORM topics.
    2. Select ${profile.shortsPerDay} SHORTS topics.
    3. Priority: prioritize 'breaking' news or high-growth topics.
    4. For each item, you must identify a clear angle (e.g. "How to use X", "Why X matters").

    RETURN JSON ONLY.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      longform: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['LONGFORM'] },
            topic: { type: Type.STRING },
            angle: { type: Type.STRING },
            targetDurationSec: { type: Type.NUMBER },
            targetAudience: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
            isNews: { type: Type.BOOLEAN },
            useCasesRequired: { type: Type.BOOLEAN },
            trendId: { type: Type.STRING }
          },
          required: ['id', 'type', 'topic', 'angle', 'targetDurationSec', 'priority']
        }
      },
      shorts: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['SHORT'] },
            topic: { type: Type.STRING },
            angle: { type: Type.STRING },
            targetDurationSec: { type: Type.NUMBER },
            targetAudience: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
            isNews: { type: Type.BOOLEAN },
            useCasesRequired: { type: Type.BOOLEAN },
            trendId: { type: Type.STRING }
          },
          required: ['id', 'type', 'topic', 'angle', 'targetDurationSec', 'priority']
        }
      },
      generatedAt: { type: Type.STRING }
    },
    required: ['longform', 'shorts', 'generatedAt']
  };

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.5, // Lower temperature for stricter adherence to facts
    },
  });

  const jsonText = cleanJson(response.text || '{}');
  return JSON.parse(jsonText) as ActionPlan;
}

export async function generateScriptsAndPrompts(
  profile: StrategyProfile,
  item: ContentItem
): Promise<ContentAssets> {
  const ai = await getGeminiClient();
  const modelId = "gemini-2.5-flash"; 

  const isLongForm = item.type === 'LONGFORM';
  const templateGuide = isLongForm 
    ? VEO_PROMPT_TEMPLATES.LONGFORM(item.topic, "Goal", "Audience") 
    : VEO_PROMPT_TEMPLATES.SHORT(item.topic, "Hook");

  const languageInstruction = profile.language === 'de' 
    ? "OUTPUT MUST BE IN GERMAN (Deutsch). The Voiceover script must be naturally spoken German." 
    : "OUTPUT MUST BE IN ENGLISH.";

  const prompt = `
    You are a professional AI Content Creator and Director.
    Create production assets for a ${item.type} video.
    
    CONTEXT:
    Topic: ${item.topic}
    Angle: ${item.angle}
    Language: ${profile.language}
    Tone: ${profile.tone}

    INSTRUCTIONS:
    ${languageInstruction}

    1. veoPrompt: 
       - Describe VISUALS ONLY. No spoken words, no text overlays description in this field. 
       - Focus on camera movement, lighting, style (Cinematic/Tech), and objects.
       - Use this style guide: ${templateGuide}
    
    2. voiceoverScript:
       - Full spoken script for Text-to-Speech.
       - Must contain a strong HOOK (0-5s).
       - Must include concrete VALUE/USE CASES (no fluff).
       - Clear CTA at the end.
       - Add tone annotations like [Excited], [Serious] for the TTS engine.
    
    3. metadata: 
       - YouTube SEO title, description, tags.
       - Thumbnail concept description.

    RETURN JSON ONLY.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      veoPrompt: { type: Type.STRING },
      voiceoverScript: { type: Type.STRING },
      metadata: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          thumbnailConcept: { type: Type.STRING }
        },
        required: ['title', 'description', 'tags', 'thumbnailConcept']
      }
    },
    required: ['veoPrompt', 'voiceoverScript', 'metadata']
  };

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.7,
    },
  });

  const jsonText = cleanJson(response.text || '{}');
  const result = JSON.parse(jsonText) as ContentAssets;

  // Basic validation
  if (!result.veoPrompt || !result.voiceoverScript) {
      throw new Error("Gemini generation incomplete: missing prompts or scripts");
  }

  return result;
}
