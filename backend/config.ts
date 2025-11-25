
export const CONFIG = {
  projectId: process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT,
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.API_KEY,
  youtube: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI,
  },
  tts: {
    defaultBucket: process.env.MEDIA_BUCKET || 'ai-channel-assets',
  },
  veo: {
    model: 'veo-3.1-fast-generate-preview', // Or 'veo-3.1-generate-preview' for higher quality
  }
};

// Runtime Validation
if (!CONFIG.geminiApiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not set. AI features will fail.");
}

if (!CONFIG.youtube.clientId || !CONFIG.youtube.clientSecret) {
  console.warn("WARNING: Google OAuth credentials are missing. YouTube features will fail.");
}
