
import { Firestore } from '@google-cloud/firestore';
import { logEvent } from './logger';
import { getStrategyProfile } from './strategyService';
import { getYoutubeAnalytics } from './youtubeService';
import { fetchCurrentTrendsAndNews } from './trendService';
import { generateVoiceover } from './nativeAudioService';
import { generateActionPlan, generateScriptsAndPrompts } from './geminiService';
import { submitToVeo3, pollVeoJob, VeoJobResult } from './veoService';
import { muxAndUploadToYouTube } from './uploadService';
import { getAutomationSettings, setAutomationSettings } from './automationService';
import { ContentItem } from '../types';
import { getGlobalConfig } from './configService';

const firestore = new Firestore();

/**
 * Main entry point triggered by Cloud Scheduler.
 * Supports manual override via 'force' param.
 * Supports 'dryRun' to skip expensive generation/upload steps.
 */
export async function runHourlyCycle(userId: string, options: { force?: boolean; dryRun?: boolean } = {}): Promise<void> {
  try {
    // 0. System Config Check
    const cfg = await getGlobalConfig();
    if (!cfg.geminiApiKey) {
        await logEvent({
            userId,
            type: 'SYSTEM',
            status: 'ERROR',
            message: 'Skipping cycle: Gemini API key is not configured in Settings.',
        });
        return;
    }

    // 1. Automation Check
    const settings = await getAutomationSettings(userId);
    
    if (!settings.enabled && !options.force) {
        console.log(`Automation disabled for ${userId}, skipping cycle.`);
        return;
    }

    await logEvent({ userId, type: 'SYSTEM', message: `Starting Hourly Autonomous Cycle${options.dryRun ? ' (DRY RUN)' : ''}` });

    // 2. Context Loading
    const [profile, analytics] = await Promise.all([
        getStrategyProfile(userId),
        getYoutubeAnalytics(userId)
    ]);

    // 3. Real Trend Research
    const trends = await fetchCurrentTrendsAndNews(userId);
    
    // 4. Planning (Gemini)
    const actionPlan = await generateActionPlan(profile, trends, analytics);
    
    // 5. Optimization: Deduplication & Prioritization
    let allItems = [...actionPlan.longform, ...actionPlan.shorts]
        .sort((a, b) => (a.isNews === b.isNews ? 0 : a.isNews ? -1 : 1));

    const recentDocs = await firestore.collection('contentPlans').doc(userId).collection('items')
        .orderBy('createdAt', 'desc').limit(20).get();
    const recentTopics = new Set(recentDocs.docs.map(d => d.data().item.topic));
    
    allItems = allItems.filter(item => !recentTopics.has(item.topic));

    if (allItems.length === 0) {
        await logEvent({ userId, type: 'STRATEGY', message: 'No new unique topics to produce this cycle.' });
        return;
    }

    // 6. Execution Loop
    for (const item of allItems) {
      try {
          await logEvent({ userId, type: 'SCRIPT', message: `Producing: "${item.topic}"` });
          
          // A. Assets
          const assets = await generateScriptsAndPrompts(profile, item);
          const contentDocRef = firestore.collection('contentPlans').doc(userId).collection('items').doc(item.id);
          
          await contentDocRef.set({
            item,
            assets,
            createdAt: new Date().toISOString(),
            status: 'GENERATED'
          });

          // DRY RUN Check: Skip Veo generation and YouTube upload
          if (options.dryRun) {
            await logEvent({
                userId,
                type: 'SYSTEM',
                message: `[DRY RUN] Assets generated. Skipping Veo & Upload for "${item.topic}".`,
                status: 'SUCCESS'
            });
            continue;
          }

          // B. Veo Video
          const aspectRatio = item.type === 'SHORT' ? '9:16' : '16:9';
          let veoResult = await submitToVeo3(assets.veoPrompt, userId, aspectRatio);
          
          // Polling Loop for Veo
          let attempts = 0;
          while (veoResult.status === 'RUNNING' && attempts < 20) {
              await new Promise(r => setTimeout(r, 5000)); // Wait 5s
              veoResult = await pollVeoJob(veoResult.jobId);
              attempts++;
          }

          if (veoResult.status !== 'SUCCEEDED' || !veoResult.videoUrl) {
              throw new Error(`Veo generation failed or timed out: ${veoResult.error}`);
          }
          
          await contentDocRef.update({ veoJob: veoResult });

          // C. Audio
          const voiceOptions = {
              languageCode: profile.language === 'de' ? 'de-DE' : 'en-US',
              voiceName: profile.language === 'de' ? 'de-DE-Neural2-B' : 'en-US-Neural2-D',
              style: profile.tone.includes('friendly') ? 'friendly' : 'authoritative'
          };
          const { audioUrl } = await generateVoiceover(userId, assets.voiceoverScript, voiceOptions);
          
          const updatedAssets = { ...assets, videoUrl: veoResult.videoUrl, audioUrl };
          await contentDocRef.update({ assets: updatedAssets });

          // D. Upload
          const { youtubeVideoId } = await muxAndUploadToYouTube(userId, updatedAssets);
             
          await logEvent({ 
             userId, 
             type: 'UPLOAD', 
             message: `Published: ${assets.metadata.title}`,
             payload: { videoId: youtubeVideoId } 
          });
             
          await contentDocRef.update({
             status: 'PUBLISHED',
             publishedAt: new Date().toISOString(),
             youtubeVideoId
          });

      } catch (itemError: any) {
          console.error(`Item Error (${item.topic}):`, itemError);
          await logEvent({ userId, type: 'SYSTEM', message: `Skipping item: ${item.topic}`, payload: itemError.message, status: 'ERROR' });
      }
    }

    // Update Next Run time
    const nextRun = new Date();
    nextRun.setHours(nextRun.getHours() + 1);
    await setAutomationSettings(userId, { lastRun: new Date().toISOString(), nextRun: nextRun.toISOString() });

    await logEvent({ userId, type: 'SYSTEM', message: `Hourly Cycle Completed.${options.dryRun ? ' (Dry Run)' : ''}` });

  } catch (error: any) {
    console.error("Orchestrator Fatal Error:", error);
    await logEvent({ userId, type: 'SYSTEM', message: 'Cycle Fatal Error', payload: error.message, status: 'ERROR' });
  }
}
