
import { GoogleGenAI } from "@google/genai";
import { logEvent } from './logger';
import { getGlobalConfig } from './configService';

async function getGeminiClient(): Promise<GoogleGenAI> {
  const cfg = await getGlobalConfig();
  if (!cfg.geminiApiKey) {
    throw new Error('Gemini API key not configured (required for Veo)');
  }
  return new GoogleGenAI({ apiKey: cfg.geminiApiKey });
}

export interface VeoJobResult {
  jobId: string;
  videoUrl?: string;
  durationSec?: number;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  error?: string;
}

/**
 * Submits a video generation job to Google Veo 3.
 */
export async function submitToVeo3(
    veoPrompt: string, 
    userId: string,
    aspectRatio: '16:9' | '9:16' = '16:9'
): Promise<VeoJobResult> {
  const cfg = await getGlobalConfig();
  const ai = await getGeminiClient();
  const modelName = cfg.veoModelName || 'veo-3.1-fast-generate-preview';

  try {
    console.log(`Submitting Veo job for user ${userId} [${aspectRatio}] Model: ${modelName}`);

    // Real API Call
    let operation = await ai.models.generateVideos({
      model: modelName,
      prompt: veoPrompt,
      config: {
        numberOfVideos: 1,
        aspectRatio: aspectRatio
      }
    });

    // The SDK returns an operation or a response. 
    // Usually operation.name is the ID we need for polling.
    const jobId = operation.name; 

    await logEvent({
        userId,
        type: 'VEO',
        message: 'Veo 3 Job Submitted',
        status: 'INFO',
        payload: { jobId, promptSnippet: veoPrompt.substring(0, 30), model: modelName }
    });

    return {
        jobId,
        status: 'RUNNING'
    };

  } catch (error: any) {
    console.error("Veo 3 submission failed:", error);
    await logEvent({
        userId,
        type: 'VEO',
        message: 'Veo API submission failed',
        status: 'ERROR',
        payload: { error: error.message }
    });
    
    throw error;
  }
}

/**
 * Polls a Veo job status.
 */
export async function pollVeoJob(jobId: string): Promise<VeoJobResult> {
    const ai = await getGeminiClient();
    const cfg = await getGlobalConfig();

    try {
        // Real Polling Logic
        let operation = await ai.operations.getVideosOperation({ name: jobId });
        
        if (operation.done) {
            if (operation.error) {
                return {
                    jobId,
                    status: 'FAILED',
                    error: operation.error.message
                };
            }

            // Extract Video URI
            const generatedVideo = operation.response?.generatedVideos?.[0];
            const videoUri = generatedVideo?.video?.uri;
            
            if (videoUri) {
                // The URI needs the API key appended
                return {
                    jobId,
                    status: 'SUCCEEDED',
                    videoUrl: `${videoUri}&key=${cfg.geminiApiKey}`, 
                    durationSec: 5 // Veo 3 preview usually ~5s
                };
            }
        }

        return {
            jobId,
            status: 'RUNNING'
        };

    } catch (e: any) {
        return {
            jobId,
            status: 'FAILED',
            error: e.message
        };
    }
}
