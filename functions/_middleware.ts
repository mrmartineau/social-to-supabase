import { BackupStatus } from '../src/lib/types';

interface Env {
  BACKUP_STATUS: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  
  // Add CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS request
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  // Add CORS headers to all responses
  context.response.headers.set('Access-Control-Allow-Origin', '*');
  context.response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  context.response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

  return context.next();
};