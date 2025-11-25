
import express from 'express';
import cors from 'cors';
import path from 'path';
import { getRecentLogs } from './logger';
import { getAuthUrl, handleOAuthCallback, isUserConnected } from './googleAuth';
import { getStrategyProfile, saveStrategyProfile } from './strategyService';
import { StrategyProfile, GlobalConfig } from '../types';
import { getYoutubeAnalytics } from './youtubeService';
import { fetchCurrentTrendsAndNews } from './trendService';
import { runHourlyCycle } from './agentOrchestrator';
import { getAutomationSettings, setAutomationSettings } from './automationService';
import { getUiConfigSummary, saveGlobalConfig } from './configService';
import { resolveUserIdFromRequest } from './userContext';
import { addCompetitorChannel, listCompetitorChannels, removeCompetitorChannel, getCompetitorTrendSummaries } from './competitorService';

const app = express();
const PORT = process.env.PORT || 8080;

// ==========================================
// 1. Middleware
// ==========================================
app.use(cors() as any);
app.use(express.json() as any);

// Security Middleware for Config
const requireAdminToken = (req: any, res: any, next: any) => {
  const adminToken = process.env.CONFIG_ADMIN_TOKEN;
  if (adminToken) {
    const headerToken = req.headers['x-admin-token'];
    if (headerToken !== adminToken) {
      console.warn(`Unauthorized config attempt from IP ${req.ip}`);
      return res.status(403).json({ error: 'Forbidden: Invalid Admin Token' });
    }
  }
  next();
};

// ==========================================
// 2. API Routes
// ==========================================

// --- CONFIGURATION (Settings Page) ---

app.get('/api/config/ui-summary', async (req, res) => {
  try {
    const summary = await getUiConfigSummary();
    res.status(200).json(summary);
  } catch (err: any) {
    console.error('Error in /api/config/ui-summary:', err);
    res.status(500).json({ error: 'Failed to load config summary' });
  }
});

app.post('/api/config', requireAdminToken, async (req, res) => {
  try {
    const partial = req.body || {};
    
    // Whitelist allowed fields to prevent arbitrary injection
    const allowed: Partial<GlobalConfig> = {};
    if (typeof partial.geminiApiKey === 'string') allowed.geminiApiKey = partial.geminiApiKey.trim();
    if (typeof partial.mediaBucket === 'string') allowed.mediaBucket = partial.mediaBucket.trim();
    if (typeof partial.veoModelName === 'string') allowed.veoModelName = partial.veoModelName.trim();
    if (partial.defaultLanguage === 'en' || partial.defaultLanguage === 'de') {
      allowed.defaultLanguage = partial.defaultLanguage;
    }
    if (typeof partial.defaultTimezone === 'string') {
      allowed.defaultTimezone = partial.defaultTimezone.trim();
    }

    await saveGlobalConfig(allowed);
    const summary = await getUiConfigSummary();
    res.status(200).json(summary);
  } catch (err: any) {
    console.error('Error in /api/config:', err);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

// --- LOGS (Monitor Page) ---

app.get('/api/logs', async (req, res) => {
  const userId = resolveUserIdFromRequest(req);
  try {
    const logs = await getRecentLogs(userId);
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error in /api/logs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- STRATEGY (ContentStrategy Page) ---

app.get('/api/strategy', async (req, res) => {
  const userId = resolveUserIdFromRequest(req);
  try {
    const profile = await getStrategyProfile(userId);
    res.status(200).json(profile);
  } catch (error) {
    console.error('Fetch strategy failed:', error);
    res.status(500).json({ error: 'Failed to fetch strategy' });
  }
});

app.post('/api/strategy', async (req, res) => {
  const userId = resolveUserIdFromRequest(req); 
  const { profile } = req.body;
  
  if (!profile) return res.status(400).json({ error: 'Missing profile data' });

  try {
    await saveStrategyProfile(userId, profile as StrategyProfile);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Save strategy failed:', error);
    res.status(500).json({ error: 'Failed to save strategy' });
  }
});

// --- AUTH (Dashboard) ---

app.get('/api/auth/youtube/url', (req, res) => {
  const userId = resolveUserIdFromRequest(req);
  try {
    const url = getAuthUrl(userId);
    res.status(200).json({ url });
  } catch (error) {
    console.error('Auth URL generation failed:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

app.get('/api/auth/youtube/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).send('Missing auth code');

  try {
    await handleOAuthCallback(code as string, state as string);
    res.redirect('/?yt_connected=true');
  } catch (error) {
    console.error('OAuth callback failed:', error);
    res.status(500).send('Authentication failed');
  }
});

app.get('/api/auth/youtube/status', async (req, res) => {
  const userId = resolveUserIdFromRequest(req);
  try {
    const connected = await isUserConnected(userId);
    res.status(200).json({ connected });
  } catch (error) {
    console.error('Status check failed:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// --- COMPETITORS ---

app.get('/api/competitors', async (req, res) => {
  const userId = resolveUserIdFromRequest(req);
  try {
    const channels = await listCompetitorChannels(userId);
    res.status(200).json(channels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list competitors' });
  }
});

app.post('/api/competitors', async (req, res) => {
  const userId = resolveUserIdFromRequest(req);
  const { url, priority } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  try {
    const channel = await addCompetitorChannel(userId, url, priority);
    res.status(200).json(channel);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/competitors/:id', async (req, res) => {
  const userId = resolveUserIdFromRequest(req);
  const { id } = req.params;
  try {
    await removeCompetitorChannel(userId, id);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove competitor' });
  }
});

app.get('/api/competitors/trends', async (req, res) => {
  const userId = resolveUserIdFromRequest(req);
  try {
    const summaries = await getCompetitorTrendSummaries(userId);
    res.status(200).json(summaries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch competitor trends' });
  }
});

// --- ANALYTICS & TRENDS ---

app.get('/api/analytics/summary', async (req, res) => {
  const userId = resolveUserIdFromRequest(req);
  try {
    const stats = await getYoutubeAnalytics(userId);
    res.status(200).json(stats);
  } catch (e) {
    console.error("Analytics error:", e);
    res.status(500).json({ error: 'Analytics fetch failed' });
  }
});

app.get('/api/trends', async (req, res) => {
  const userId = resolveUserIdFromRequest(req);
  try {
    const trends = await fetchCurrentTrendsAndNews(userId);
    res.status(200).json(trends);
  } catch (e) {
    res.status(500).json({ error: 'Trend fetch failed' });
  }
});

// --- AGENT & AUTOMATION ---

app.post('/api/agent/runHourly', async (req, res) => {
    const userId = resolveUserIdFromRequest(req);
    console.log(`Manual trigger runHourly for ${userId}`);
    // Trigger async to avoid timeout
    runHourlyCycle(userId).catch(err => console.error("Manual Trigger Failed:", err));
    res.status(200).json({ status: 'started', message: 'Autonomous cycle initiated.' });
});

app.post('/api/agent/runFullTest', async (req, res) => {
    const userId = resolveUserIdFromRequest(req);
    console.log(`Manual trigger runFullTest (Dry Run) for ${userId}`);
    try {
      // Force execute + Dry Run
      runHourlyCycle(userId, { force: true, dryRun: true }).catch(err => console.error("Dry Run Async Error:", err));
      res.status(200).json({ status: 'started', dryRun: true, message: 'Dry-run test cycle initiated.' });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Failed to start test cycle' });
    }
});

app.get('/api/automation', async (req, res) => {
    const userId = resolveUserIdFromRequest(req);
    try {
        const settings = await getAutomationSettings(userId);
        res.status(200).json(settings);
    } catch(e) {
        res.status(500).json({ error: 'Failed to get automation settings'});
    }
});

app.post('/api/automation', async (req, res) => {
    const userId = resolveUserIdFromRequest(req);
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') return res.status(400).json({ error: 'Invalid body' });
    try {
        await setAutomationSettings(userId, { enabled });
        res.status(200).json({ success: true, enabled });
    } catch(e) {
        res.status(500).json({ error: 'Failed to set automation'});
    }
});

// --- HEALTH CHECK ---
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// ==========================================
// 3. Static File Serving (Production Only)
// ==========================================

if (process.env.NODE_ENV === 'production') {
  // Serve static files from the 'dist/frontend' directory
  // Note: package.json build script outputs frontend to 'dist/frontend'
  const frontendPath = path.join(__dirname, '../frontend');
  app.use(express.static(frontendPath) as any);

  // Handle SPA routing: return index.html for any unknown route NOT caught by API above
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Registered routes: /api/config, /api/logs, /api/auth/*, /api/strategy, etc.`);
});
