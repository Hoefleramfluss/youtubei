
import { Firestore } from '@google-cloud/firestore';
import { AutomationSettings } from '../types';

const firestore = new Firestore();

export async function getAutomationSettings(userId: string): Promise<AutomationSettings> {
    const doc = await firestore.collection('automationSettings').doc(userId).get();
    if (doc.exists) {
        return doc.data() as AutomationSettings;
    }
    return { enabled: false };
}

export async function setAutomationSettings(userId: string, settings: Partial<AutomationSettings>): Promise<void> {
    await firestore.collection('automationSettings').doc(userId).set(settings, { merge: true });
}
