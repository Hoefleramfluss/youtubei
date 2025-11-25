import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
// In production, this should be your deployed URL + /api/auth/youtube/callback
// For local/preview, it might be http://localhost:8080/api/auth/youtube/callback
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:8080/api/auth/youtube/callback';

const SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtubepartner-channel-audit',
  'https://www.googleapis.com/auth/youtube.readonly'
];

/**
 * Creates and returns a new OAuth2Client instance.
 */
export function getOAuthClient(): OAuth2Client {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

/**
 * Generates the Google OAuth2 consent URL.
 * The userId is passed in the 'state' parameter to persist context across the redirect.
 */
export function getAuthUrl(userId: string): string {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Crucial for receiving a refresh token
    scope: SCOPES,
    state: userId,
    prompt: 'consent' // Force consent to ensure we get a refresh token even if previously authorized
  });
}

/**
 * Exchanges the authorization code for tokens and saves them to Firestore.
 */
export async function handleOAuthCallback(code: string, state?: string): Promise<{ userId: string }> {
  if (!state) {
    throw new Error('Missing state parameter (expected userId)');
  }
  
  const userId = state;
  const oauth2Client = getOAuthClient();
  
  // Exchange code for tokens
  const { tokens } = await oauth2Client.getToken(code);
  
  // Persist tokens to Firestore
  // We store everything provided: access_token, refresh_token, scope, token_type, expiry_date
  await firestore.collection('youtubeTokens').doc(userId).set(tokens);
  
  return { userId };
}

/**
 * Returns an authenticated YouTube API client for the specific user.
 * It loads credentials from Firestore and automatically handles token refreshing via google-auth-library.
 */
export async function getAuthorizedYoutubeClient(userId: string) {
  const doc = await firestore.collection('youtubeTokens').doc(userId).get();
  
  if (!doc.exists) {
    throw new Error(`User ${userId} is not authenticated with YouTube.`);
  }
  
  const tokens = doc.data();
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials(tokens as any);

  // google.youtube returns the typed client
  return google.youtube({ version: 'v3', auth: oauth2Client });
}

/**
 * Checks if a user has valid tokens stored.
 */
export async function isUserConnected(userId: string): Promise<boolean> {
  const doc = await firestore.collection('youtubeTokens').doc(userId).get();
  return doc.exists;
}
