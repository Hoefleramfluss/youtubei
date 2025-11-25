
import { Firestore } from '@google-cloud/firestore';
import { StrategyProfile } from '../types';
import { logEvent } from './logger';

const firestore = new Firestore();

const DEFAULT_PROFILE: StrategyProfile = {
  niche: 'Artificial Intelligence / Künstliche Intelligenz',
  language: 'de',
  videosPerDay: 2,
  shortsPerDay: 4,
  tone: 'authoritative, friendly, high-value',
  timezone: 'Europe/Berlin',
  postingWindows: [
    { dayOfWeek: 'Mon-Fri', start: '18:00', end: '21:00' },
    { dayOfWeek: 'Sat-Sun', start: '10:00', end: '13:00' }
  ],
  contentPillars: ['AI News', 'Use Cases', 'Tutorials', 'Tool Reviews'],
  targetVTR: 80,
  subsGoal: 100000
};

export async function getStrategyProfile(userId: string): Promise<StrategyProfile> {
  try {
    const doc = await firestore.collection('strategyProfiles').doc(userId).get();
    
    if (doc.exists) {
      return doc.data() as StrategyProfile;
    }
    
    // If not exists, create with DEFAULT_PROFILE and return it.
    await firestore.collection('strategyProfiles').doc(userId).set(DEFAULT_PROFILE);
    return DEFAULT_PROFILE;
  } catch (error) {
    console.error('Error fetching strategy profile:', error);
    // Return default in case of DB error to prevent crash, but don't write it
    return DEFAULT_PROFILE;
  }
}

export async function saveStrategyProfile(userId: string, profile: StrategyProfile): Promise<void> {
  try {
    await firestore.collection('strategyProfiles').doc(userId).set(profile);
    
    await logEvent({
      userId,
      type: 'STRATEGY',
      message: 'Strategy Profile Updated',
      payload: profile
    });
  } catch (error) {
    console.error('Error saving strategy profile:', error);
    throw error;
  }
}
