
import { google } from 'googleapis';
import { getAuthorizedYoutubeClient } from './googleAuth';
import { YouTubeAnalyticsSummary } from '../types';
import { logEvent } from './logger';

export async function getYoutubeAnalytics(userId: string): Promise<YouTubeAnalyticsSummary> {
  try {
    const authClient = await getAuthorizedYoutubeClient(userId);
    // Cast to any to avoid strict type mismatch with googleapis generated types if needed, 
    // or use specific youtubeAnalytics_v2 type
    const analytics = google.youtubeAnalytics({ version: 'v2', auth: authClient });

    // Calculate start date (28 days ago)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const endDateStr = new Date().toISOString().split('T')[0];

    const response = await analytics.reports.query({
      ids: 'channel==MINE',
      startDate: startDateStr,
      endDate: endDateStr,
      metrics: 'views,estimatedMinutesWatched,averageViewDuration,impressions,annotationClickThroughRate,subscribersGained,subscribersLost',
      dimensions: 'day',
      sort: 'day'
    });

    if (!response.data.rows || response.data.rows.length === 0) {
       // Return zeroed stats if channel is new or empty
       return {
         views: 0,
         watchTimeMinutes: 0,
         avgViewDurationSeconds: 0,
         vtr: 0,
         ctr: 0,
         subscriberDelta: 0
       };
    }

    // Aggregating rows (simple summation/averaging for the summary)
    let totalViews = 0;
    let totalWatchTime = 0;
    let totalDurationSum = 0;
    let totalImpressions = 0;
    let totalCtrSum = 0;
    let subsGained = 0;
    let subsLost = 0;
    const rowCount = response.data.rows.length;

    response.data.rows.forEach((row: any) => {
      // row indices match metrics order: 
      // 0: views, 1: minutes, 2: avgDuration, 3: impressions, 4: CTR, 5: subsGained, 6: subsLost
      totalViews += Number(row[0] || 0);
      totalWatchTime += Number(row[1] || 0);
      totalDurationSum += Number(row[2] || 0);
      totalImpressions += Number(row[3] || 0);
      totalCtrSum += Number(row[4] || 0);
      subsGained += Number(row[5] || 0);
      subsLost += Number(row[6] || 0);
    });

    const avgViewDurationSeconds = totalViews > 0 ? (totalDurationSum / rowCount) : 0;
    const ctr = rowCount > 0 ? (totalCtrSum / rowCount) : 0;
    
    // Approximate VTR (View Through Rate) logic: 
    // This is hard to get directly as a single % from API without video duration context.
    // We assume a standard target duration (e.g., 60s for Shorts, 5min for long) or use a heuristic.
    // For this summary, we'll use a heuristic based on avgViewDuration.
    const vtr = Math.min(100, Math.max(0, (avgViewDurationSeconds / 60) * 100)); // Rough estimate normalized to 1 min

    return {
      views: totalViews,
      watchTimeMinutes: totalWatchTime,
      avgViewDurationSeconds: Math.round(avgViewDurationSeconds),
      vtr: Math.round(vtr * 10) / 10,
      ctr: Math.round(ctr * 10) / 10,
      subscriberDelta: subsGained - subsLost
    };

  } catch (error: any) {
    console.error('YouTube Analytics API Error:', error);
    await logEvent({
      userId,
      type: 'ANALYTICS',
      message: 'Failed to fetch YouTube Analytics',
      status: 'ERROR',
      payload: { error: error.message }
    });
    throw error;
  }
}
