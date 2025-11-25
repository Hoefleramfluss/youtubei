
import textToSpeech from '@google-cloud/text-to-speech';
import { Storage } from '@google-cloud/storage';
import { logEvent } from './logger';
import { VoiceoverOptions } from '../types';
import { getGlobalConfig } from './configService';

// Initialize Clients (Assuming GDC Auth via env or identity)
const ttsClient = new textToSpeech.TextToSpeechClient();
const storage = new Storage();

export async function generateVoiceover(
  userId: string, 
  script: string, 
  options: VoiceoverOptions
): Promise<{ audioUrl: string }> {
  
  const cfg = await getGlobalConfig();

  try {
    // 1. Synthesize Speech
    const [response] = await ttsClient.synthesizeSpeech({
      input: { text: script },
      voice: {
        languageCode: options.languageCode,
        name: options.voiceName, 
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: options.speakingRate || 1.0,
        pitch: options.pitch || 0.0
      },
    });

    if (!response.audioContent) {
        throw new Error("TTS returned empty content");
    }

    // 2. Upload to Cloud Storage
    const bucketName = cfg.mediaBucket || 'ai-channel-assets'; // Use configured bucket
    const fileName = `voiceovers/${userId}/${Date.now()}.mp3`;
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    await file.save(response.audioContent as Buffer, {
        contentType: 'audio/mpeg',
        public: true // MVP: Public for easy access. Prod: Signed URLs.
    });

    // 3. Construct URL
    const audioUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

    await logEvent({
      userId,
      type: 'NATIVE_AUDIO',
      message: `Generated voiceover (${options.languageCode})`,
      payload: { 
        scriptLength: script.length,
        url: audioUrl,
        bucket: bucketName
      }
    });

    return { audioUrl };

  } catch (error: any) {
    console.error("Native Audio generation failed:", error);
    await logEvent({
        userId,
        type: 'NATIVE_AUDIO',
        message: 'TTS generation failed',
        status: 'ERROR',
        payload: { error: error.message }
    });
    throw error;
  }
}
