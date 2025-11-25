
import { Firestore } from '@google-cloud/firestore';
import { GlobalConfig, UiConfigSummary } from '../types';
import { logEvent } from './logger';

const firestore = new Firestore();
const CONFIG_COLLECTION = 'adminConfig';
const CONFIG_DOC_ID = 'global';

const DEFAULT_CONFIG: GlobalConfig = {
  id: CONFIG_DOC_ID,
  defaultLanguage: 'de',
  defaultTimezone: 'Europe/Berlin',
};

export async function getGlobalConfig(): Promise<GlobalConfig> {
  const docRef = firestore.collection(CONFIG_COLLECTION).doc(CONFIG_DOC_ID);
  const snap = await docRef.get();

  if (!snap.exists) {
    await docRef.set(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }

  const data = snap.data() as Partial<GlobalConfig>;
  return { ...DEFAULT_CONFIG, ...data, id: CONFIG_DOC_ID };
}

export async function saveGlobalConfig(partial: Partial<GlobalConfig>): Promise<GlobalConfig> {
  const current = await getGlobalConfig();
  const next: GlobalConfig = { ...current, ...partial };
  const docRef = firestore.collection(CONFIG_COLLECTION).doc(CONFIG_DOC_ID);
  await docRef.set(next, { merge: true });

  await logEvent({
    userId: 'admin',
    type: 'SYSTEM',
    status: 'INFO',
    message: 'GlobalConfig updated via UI',
    payload: { changedKeys: Object.keys(partial) },
  });

  return next;
}

export async function getUiConfigSummary(): Promise<UiConfigSummary> {
  const cfg = await getGlobalConfig();
  return {
    hasGeminiKey: !!cfg.geminiApiKey,
    hasMediaBucket: !!cfg.mediaBucket,
    veoModelName: cfg.veoModelName,
    defaultLanguage: cfg.defaultLanguage,
    defaultTimezone: cfg.defaultTimezone,
  };
}
