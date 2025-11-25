export function resolveUserIdFromRequest(req: any): string {
  // Check query params, body, or default to 'demo'
  // In a real multi-user app, this would decode a JWT or session
  const queryId = req.query?.userId;
  const bodyId = req.body?.userId;
  
  if (typeof queryId === 'string' && queryId) return queryId;
  if (typeof bodyId === 'string' && bodyId) return bodyId;
  
  return 'demo';
}