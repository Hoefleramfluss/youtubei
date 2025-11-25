
export type ContentItemType = 'LONGFORM' | 'SHORT';

export interface Trend {
  id: string;
  topic: string;
  relevance: number; // 0-100
  category: 'News' | 'Tutorial' | 'Comparison' | 'Deep Dive' | 'Listicle' | string;
  growthPotential: 'Low' | 'Medium' | 'High';
  sourceVideoId?: string;
  isBreaking?: boolean;
  viewCount?: number;
}

export interface ContentItem {
  id: string;
  type: ContentItemType;
  topic: string;
  angle: string; // The specific perspective or hook
  targetDurationSec: number;
  targetAudience: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  isNews: boolean;
  useCasesRequired: boolean;
  trendId?: string;
  // UI helper fields that might be optional during planning
  title?: string;
  status?: 'PLANNED' | 'SCRIPTING' | 'GENERATING' | 'READY'; 
}

export interface ContentAssets {
  veoPrompt: string;
  voiceoverScript: string;
  metadata: {
    title: string;
    description: string;
    tags: string[];
    thumbnailConcept: string;
  };
  videoUrl?: string;
  audioUrl?: string;
  youtubeVideoId?: string;
}

export interface ActionPlan {
  longform: ContentItem[];
  shorts: ContentItem[];
  generatedAt: string;
}

export interface MetricData {
  name: string;
  value: number;
  change: number; // percentage
  trend: 'up' | 'down' | 'neutral';
}

export interface DailyStats {
  subscribers: number;
  subsGoal: number;
  avgViewDuration: string; // "4:12"
  vtr: number;
  impressions: number;
  ctr: number;
}

export interface LogEntry {
  id: string;
  timestamp: string; // ISO string
  category: 'SYSTEM' | 'TREND' | 'SCRIPT' | 'VEO' | 'NATIVE_AUDIO' | 'UPLOAD' | 'ANALYTICS' | string;
  message: string;
  details?: string;
  status: 'INFO' | 'SUCCESS' | 'ERROR';
}

export interface LogEventInput {
  userId: string;
  type: LogEntry['category'];
  message: string;
  payload?: any;
  status?: LogEntry['status'];
}

export interface ChannelConfig {
  channelId: string;
  channelName: string;
  isConnected: boolean;
  lastSync?: string;
  agentStatus: 'ACTIVE' | 'PAUSED' | 'ERROR';
}

export interface StrategyProfile {
  niche: string;
  language: 'en' | 'de';
  videosPerDay: number;
  shortsPerDay: number;
  tone: string;
  timezone: string;
  postingWindows: { dayOfWeek: string; start: string; end: string }[];
  contentPillars: string[];
  targetVTR: number; // e.g. 80
  subsGoal: number; // e.g. 100000
}

export interface YouTubeAnalyticsSummary {
  views: number;
  watchTimeMinutes: number;
  avgViewDurationSeconds: number;
  vtr: number; // View Through Rate %
  ctr: number; // Click Through Rate %
  subscriberDelta: number;
}

export interface VoiceoverOptions {
  languageCode: string;  // e.g. 'de-DE' or 'en-US'
  voiceName?: string;    // e.g. 'en-US-Neural2-D'
  speakingRate?: number; // 0.75 - 1.25
  pitch?: number;        // -10.0 - 10.0
  style?: string;        // e.g. 'authoritative', 'friendly'
}

export interface AutomationSettings {
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

export interface GlobalConfig {
  id: string;                          // e.g. 'global'
  geminiApiKey?: string;               // used by backend/geminiService
  mediaBucket?: string;                // used by Storage / uploadService
  veoModelName?: string;               // e.g. 'veo-3'
  defaultLanguage: 'en' | 'de';
  defaultTimezone: string;             // e.g. 'Europe/Berlin'
}

export interface UiConfigSummary {
  hasGeminiKey: boolean;
  hasMediaBucket: boolean;
  veoModelName?: string;
  defaultLanguage: 'en' | 'de';
  defaultTimezone: string;
}
