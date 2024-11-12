import { BskyAgent } from '@atproto/api';
import { createClient } from '@supabase/supabase-js';
import type { Settings, BackupStatus } from '../src/lib/types';

interface Env {
  SETTINGS: KVNamespace;
  BACKUP_STATUS: KVNamespace;
}

async function backupBlueskyData(agent: BskyAgent, supabase: any, userId: string) {
  const posts = await agent.getAuthorFeed({ actor: agent.session?.did });
  const likes = await agent.getLikes({ actor: agent.session?.did });
  
  await supabase.from('bluesky_posts').insert(
    posts.data.feed.map(post => ({
      user_id: userId,
      post_id: post.post.uri,
      content: post.post.record.text,
      created_at: post.post.indexedAt,
    }))
  );
  
  await supabase.from('bluesky_likes').insert(
    likes.data.likes.map(like => ({
      user_id: userId,
      post_id: like.uri,
      created_at: like.indexedAt,
    }))
  );
}

async function backupMastodonData(instance: string, userId: string, token: string, supabase: any) {
  const headers = { Authorization: `Bearer ${token}` };
  
  // Fetch statuses (toots)
  const statusesResponse = await fetch(
    `${instance}/api/v1/accounts/${userId}/statuses`,
    { headers }
  );
  const statuses = await statusesResponse.json();
  
  // Fetch favorites (likes)
  const favoritesResponse = await fetch(
    `${instance}/api/v1/favourites`,
    { headers }
  );
  const favorites = await favoritesResponse.json();
  
  // Save statuses
  await supabase.from('mastodon_posts').insert(
    statuses.map((status: any) => ({
      user_id: userId,
      post_id: status.id,
      content: status.content,
      created_at: status.created_at,
    }))
  );
  
  // Save favorites
  await supabase.from('mastodon_likes').insert(
    favorites.map((favorite: any) => ({
      user_id: userId,
      post_id: favorite.id,
      created_at: favorite.created_at,
    }))
  );
}

export const scheduled: PagesFunction<Env> = async (context) => {
  try {
    // Get settings from KV
    const settingsStr = await context.env.SETTINGS.get('backup_settings');
    if (!settingsStr) {
      throw new Error('No settings found');
    }
    
    const settings: Settings = JSON.parse(settingsStr);
    const statusList: BackupStatus[] = [];
    
    // Initialize Supabase client
    const supabase = createClient(
      settings.supabase.url,
      settings.supabase.serviceKey
    );
    
    // Process Bluesky accounts
    for (const account of settings.blueskyAccounts) {
      try {
        const agent = new BskyAgent({ service: account.instanceUrl });
        await agent.login({
          identifier: account.username,
          password: account.password,
        });
        
        await backupBlueskyData(
          agent,
          supabase,
          settings.supabase.userId || account.username
        );
        
        statusList.push({
          timestamp: new Date().toISOString(),
          success: true,
          accountType: 'bluesky',
          accountId: account.username,
        });
      } catch (error) {
        statusList.push({
          timestamp: new Date().toISOString(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          accountType: 'bluesky',
          accountId: account.username,
        });
      }
    }
    
    // Process Mastodon accounts
    for (const account of settings.mastodonAccounts) {
      try {
        await backupMastodonData(
          account.instanceUrl,
          account.userId,
          account.apiToken,
          supabase
        );
        
        statusList.push({
          timestamp: new Date().toISOString(),
          success: true,
          accountType: 'mastodon',
          accountId: account.userId,
        });
      } catch (error) {
        statusList.push({
          timestamp: new Date().toISOString(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          accountType: 'mastodon',
          accountId: account.userId,
        });
      }
    }
    
    // Update status in KV
    const existingStatus = await context.env.BACKUP_STATUS.get('status_list', 'json') || [];
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const filteredStatus = existingStatus
      .filter((status: BackupStatus) => new Date(status.timestamp) > twoDaysAgo)
      .concat(statusList);
    
    await context.env.BACKUP_STATUS.put('status_list', JSON.stringify(filteredStatus));
    
    return new Response('Backup completed successfully', { status: 200 });
  } catch (error) {
    return new Response(
      `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
};