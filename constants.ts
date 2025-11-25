
import { Trend, DailyStats, LogEntry } from './types';

export const MOCK_TRENDS: Trend[] = [
  { id: '1', topic: 'Google Veo 3 vs Sora', relevance: 98, category: 'Comparison', growthPotential: 'High', isBreaking: false },
  { id: '2', topic: 'Midjourney v7 Alpha Features', relevance: 92, category: 'News', growthPotential: 'High', isBreaking: true },
  { id: '3', topic: 'AI Agents for Productivity', relevance: 85, category: 'Tutorial', growthPotential: 'Medium', isBreaking: false },
  { id: '4', topic: 'OpenAI o1 Reasoning Capabilties', relevance: 88, category: 'Deep Dive', growthPotential: 'High', isBreaking: false },
  { id: '5', topic: 'Top 5 Free AI Video Generators', relevance: 75, category: 'Listicle', growthPotential: 'Medium', isBreaking: false },
];

export const INITIAL_STATS: DailyStats = {
  subscribers: 12450,
  subsGoal: 100000,
  avgViewDuration: '4:12',
  vtr: 68, // Goal is 80
  impressions: 450000,
  ctr: 8.4,
};

export const GROWTH_DATA = [
  { name: 'Mon', subs: 12000, views: 45000 },
  { name: 'Tue', subs: 12150, views: 48000 },
  { name: 'Wed', subs: 12280, views: 52000 },
  { name: 'Thu', subs: 12450, views: 49000 },
  { name: 'Fri', subs: 12600, views: 61000 },
  { name: 'Sat', subs: 12900, views: 75000 },
  { name: 'Sun', subs: 13200, views: 82000 },
];

export const MOCK_LOGS: LogEntry[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    category: 'UPLOAD',
    message: 'Published Short "This new AI will save you 2h/day"',
    details: 'Video ID: xkqL8s_9s • Views projected: 15k',
    status: 'SUCCESS'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    category: 'VEO',
    message: 'Veo 3 Render Complete',
    details: 'Asset ID: veo_render_8823 • Duration: 00:58',
    status: 'SUCCESS'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    category: 'SCRIPT',
    message: 'Script generation finished for Longform #142',
    details: 'Topic: "The Future of LLMs" • Tokens used: 4500',
    status: 'INFO'
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    category: 'TREND',
    message: 'Trend Scan completed',
    details: 'Found 5 new high-relevance topics in AI sector.',
    status: 'INFO'
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    category: 'SYSTEM',
    message: 'Hourly Agent Cycle Started',
    status: 'INFO'
  }
];

export const VEO_PROMPT_TEMPLATES = {
  LONGFORM: (topic: string, goal: string, audience: string) => `
**ROLE:** Professional Cinematographer & AI Director
**TOPIC:** ${topic}
**GOAL:** ${goal}
**AUDIENCE:** ${audience}

**VISUAL STYLE:**
High-tech documentary style, crisp 4K resolution, cinematic lighting (teal and orange contrast), smooth motion graphics overlays.

**SCENE SEQUENCE (SHOT LIST):**
1. [00:00-00:05] HOOK: Extreme close-up of a futuristic interface morphing into the topic "${topic}". Fast cuts. Dynamic sound design cues.
2. [00:05-00:15] CONTEXT: Wide shot of a modern workspace or digital abstract representation showing the "Problem". Low angle for authority.
3. [00:15-00:45] EXPLANATION: Split screen comparing old method vs new AI method. Clean UI animations.
4. [00:45-End] CONCLUSION: Hero shot of the result. Slow push-in. Text overlay: "Subscribe for AI Mastery".

**TECHNICAL:**
- Aspect Ratio: 16:9
- Frame Rate: 60fps
- Lighting: Studio Softbox with Rim Light
`,
  SHORT: (topic: string, hook: string) => `
**FORMAT:** YouTube Short (9:16)
**TOPIC:** ${topic}
**HOOK VISUAL:** ${hook}

**STRUCTURE:**
1. **0s-3s (THE STOPPER):** ${hook} - Must be visually exploding or highly contrasting. Fast movement towards camera.
2. **3s-15s (THE PAYOFF):** Rapid montage of the tool/concept in action. No filler. Text overlays showing key benefits in large, bold Sans-Serif font (Yellow/White).
3. **15s-End (THE LOOP):** Seamless transition back to the start or a freeze frame with a pointing arrow to "Subscribe".

**STYLE:**
- High Energy
- Saturated Colors
- Glitch Transitions
`
};
