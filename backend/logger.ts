
import { Firestore } from '@google-cloud/firestore';
import { LogEntry, LogEventInput } from '../types';

// Initialize Firestore
// This assumes the environment has Google Cloud credentials configured (e.g. Cloud Run Identity or GOOGLE_APPLICATION_CREDENTIALS)
const firestore = new Firestore();

/**
 * Logs an event to the persistent store (Firestore) collection: logs/{userId}/events
 */
export async function logEvent(input: LogEventInput): Promise<void> {
  const { userId, type, message, payload } = input;
  
  // Infer status if not provided
  let status: LogEntry['status'] = input.status || 'INFO';
  if (!input.status) {
    const lowerMsg = message.toLowerCase();
    if (type === 'UPLOAD' || lowerMsg.includes('success')) {
      status = 'SUCCESS';
    } else if (lowerMsg.includes('fail') || lowerMsg.includes('error')) {
      status = 'ERROR';
    }
  }

  const timestamp = new Date().toISOString();
  
  const entry: Omit<LogEntry, 'id'> = {
    timestamp,
    category: type,
    message,
    details: payload ? JSON.stringify(payload) : undefined,
    status
  };

  try {
    // Write to Firestore
    await firestore.collection('logs').doc(userId).collection('events').add(entry);
    
    // Also log to console for Cloud Logging
    console.log(JSON.stringify({ severity: status, ...entry }));
  } catch (error) {
    console.error('Failed to write log to Firestore:', error);
  }
}

/**
 * Retrieves the most recent logs for a specific user from Firestore.
 */
export async function getRecentLogs(userId: string, limitCount = 100): Promise<LogEntry[]> {
  try {
    const snapshot = await firestore
      .collection('logs')
      .doc(userId)
      .collection('events')
      .orderBy('timestamp', 'desc')
      .limit(limitCount)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as LogEntry));
  } catch (error) {
    console.error('Failed to fetch logs from Firestore:', error);
    return [];
  }
}
