import { Trend, DailyStats, LogEntry } from './types';

// EMPTY DATA - Forces UI to use backend or show "No Data" states

export const MOCK_TRENDS: Trend[] = [];

export const INITIAL_STATS: DailyStats = {
  subscribers: 0,
  subsGoal: 100000,
  views: 0,
  avgViewDuration: '0:00',
  vtr: 0,
  impressions: 0,
  ctr: 0.0,
};

export const GROWTH_DATA = [
  // Placeholder structure, but zeroed. 
  // Real implementation should fetch history from an API if needed.
  { name: 'Mon', subs: 0, views: 0 },
  { name: 'Tue', subs: 0, views: 0 },
  { name: 'Wed', subs: 0, views: 0 },
  { name: 'Thu', subs: 0, views: 0 },
  { name: 'Fri', subs: 0, views: 0 },
  { name: 'Sat', subs: 0, views: 0 },
  { name: 'Sun', subs: 0, views: 0 },
];

export const MOCK_LOGS: LogEntry[] = [];

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