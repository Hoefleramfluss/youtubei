import { Firestore } from '@google-cloud/firestore';
import { CompetitorChannel, CompetitorTrendSummary } from '../types';
import { logEvent } from './logger';

const firestore = new Firestore();

export async function addCompetitorChannel(
  userId: string,
  url: string,
  priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
): Promise<CompetitorChannel> {
  const id = `comp_${Date.now()}`;
  // In a real impl, we would resolve the YouTube ID from the URL here
  const channel: CompetitorChannel = {
    id,
    channelId: id, // Placeholder
    url,
    title: `Competitor ${url}`,
    priority,
    addedAt: new Date().toISOString()
  };

  await firestore.collection('competitorChannels').doc(userId).collection('channels').doc(id).set(channel);
  return channel;
}

export async function listCompetitorChannels(userId: string): Promise<CompetitorChannel[]> {
  const snapshot = await firestore.collection('competitorChannels').doc(userId).collection('channels').get();
  return snapshot.docs.map(doc => doc.data() as CompetitorChannel);
}

export async function removeCompetitorChannel(userId: string, channelId: string): Promise<void> {
  await firestore.collection('competitorChannels').doc(userId).collection('channels').doc(channelId).delete();
}

export async function getCompetitorTrendSummaries(userId: string): Promise<CompetitorTrendSummary[]> {
  // Mock implementation for MVP to prevent crash
  return [];
}