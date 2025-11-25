
import { getRecentLogs } from './logger';
import { getAuthUrl, handleOAuthCallback as processOAuthCallback } from './googleAuth';
import { getStrategyProfile, saveStrategyProfile } from './strategyService';
import { StrategyProfile } from '../types';

/**
 * GET /api/logs
 * Query Params: userId
 */
export async function handleGetLogs(req: any, res: any) {
  const userId = req.query?.userId;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter' });
  }

  try {
    const logs = await getRecentLogs(userId as string);
    res.status(200).json(logs);
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * GET /api/auth/youtube/url
 * Query Params: userId
 */
export async function handleGetAuthUrl(req: any, res: any) {
  const userId = req.query?.userId;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const url = getAuthUrl(userId as string);
  res.status(200).json({ url });
}

/**
 * GET /api/auth/youtube/callback
 * Query Params: code, state (userId)
 */
export async function handleAuthCallback(req: any, res: any) {
  const { code, state } = req.query;
  
  if (!code) return res.status(400).json({ error: 'Missing auth code' });

  try {
    await processOAuthCallback(code as string, state as string);
    // Tokens are saved within processOAuthCallback
    
    // Redirect back to frontend
    res.redirect('/?connected=true');
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * GET /api/strategy
 * Query Params: userId
 */
export async function handleGetStrategy(req: any, res: any) {
  const userId = req.query?.userId;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const profile = await getStrategyProfile(userId as string);
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch strategy' });
  }
}

/**
 * POST /api/strategy
 * Body: { userId, profile }
 */
export async function handleSaveStrategy(req: any, res: any) {
  const { userId, profile } = req.body;
  if (!userId || !profile) return res.status(400).json({ error: 'Missing data' });

  try {
    await saveStrategyProfile(userId, profile as StrategyProfile);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save strategy' });
  }
}
