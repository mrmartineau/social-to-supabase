export interface SupabaseConfig {
  url: string;
  serviceKey: string;
  userId?: string;
}

export interface BlueskyAccount {
  instanceUrl: string;
  username: string;
  password: string;
}

export interface MastodonAccount {
  instanceUrl: string;
  userId: string;
  apiToken: string;
}

export interface BackupStatus {
  timestamp: string;
  success: boolean;
  error?: string;
  accountType: 'bluesky' | 'mastodon';
  accountId: string;
}

export interface Settings {
  supabase: SupabaseConfig;
  blueskyAccounts: BlueskyAccount[];
  mastodonAccounts: MastodonAccount[];
}
