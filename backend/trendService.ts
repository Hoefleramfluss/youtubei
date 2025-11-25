
import { google } from 'googleapis';
import { Trend } from '../types';
import { getAuthorizedYoutubeClient } from './googleAuth';
import { logEvent } from './logger';

const AI_QUERIES = [
  'Artificial Intelligence',
  'AI News',
  'Künstliche Intelligenz',
  'ChatGPT',
  'Google Veo',
  'OpenAI',
  'AI Tools',
  'Generative AI'
];

export async function fetchCurrentTrendsAndNews(userId: string): Promise<Trend[]> {
  const youtube = await getAuthorizedYoutubeClient(userId);
  const trends: Trend[] = [];
  const processedVideoIds = new Set<string>();

  try {
    // 1. Fetch Breaking/Recent News (Search API)
    // We rotate queries or pick a random subset to save quota, or run parallel
    const query = AI_QUERIES[Math.floor(Math.random() * AI_QUERIES.length)];
    
    const searchRes = await youtube.search.list({
      part: ['snippet'],
      q: query,
      order: 'date', // Most recent
      type: ['video'],
      publishedAfter: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
      maxResults: 5,
      videoDuration: 'medium'
    });

    if (searchRes.data.items) {
      searchRes.data.items.forEach(item => {
        if (item.id?.videoId && item.snippet) {
          trends.push({
            id: item.id.videoId,
            topic: item.snippet.title || 'Unknown Topic',
            relevance: 95, // High because it matches query and is recent
            category: 'News',
            growthPotential: 'High',
            sourceVideoId: item.id.videoId,
            isBreaking: true,
            viewCount: 0 // Search list doesn't return viewCount, would need secondary call
          });
          processedVideoIds.add(item.id.videoId);
        }
      });
    }

    // 2. Fetch Popular Tech Videos (Videos API)
    const popularRes = await youtube.videos.list({
      part: ['snippet', 'statistics'],
      chart: 'mostPopular',
      regionCode: 'US', // Or make dynamic based on StrategyProfile
      videoCategoryId: '28', // Science & Technology
      maxResults: 10
    });

    if (popularRes.data.items) {
      popularRes.data.items.forEach(item => {
        // Filter for AI related keywords locally since mostPopular is category-wide
        const title = item.snippet?.title || '';
        const isAiRelated = AI_QUERIES.some(q => title.toLowerCase().includes(q.toLowerCase()));
        
        if (isAiRelated && item.id && !processedVideoIds.has(item.id)) {
           const views = Number(item.statistics?.viewCount || 0);
           trends.push({
             id: item.id,
             topic: title,
             relevance: 85,
             category: 'Deep Dive', // Assumption for popular tech content
             growthPotential: views > 100000 ? 'High' : 'Medium',
             sourceVideoId: item.id,
             isBreaking: false,
             viewCount: views
           });
        }
      });
    }

    await logEvent({
      userId,
      type: 'TREND',
      message: `Trend Scan: Found ${trends.length} real AI topics via YouTube API`,
      payload: { queryUsed: query, count: trends.length }
    });

    return trends;

  } catch (error: any) {
    console.error('Trend Service Error:', error);
    await logEvent({
      userId,
      type: 'TREND',
      message: 'Failed to fetch trends from YouTube API',
      status: 'ERROR',
      payload: { error: error.message }
    });
    // Return empty array to allow graceful degradation (or rethrow if critical)
    return [];
  }
}
