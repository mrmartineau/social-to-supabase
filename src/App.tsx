import React from 'react';
import { Settings, Cloud, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import type { Settings as SettingsType, BlueskyAccount, MastodonAccount, BackupStatus } from '@/lib/types';

function App() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [settings, setSettings] = React.useState<SettingsType>({
    supabase: {
      url: '',
      serviceKey: '',
      userId: '',
    },
    blueskyAccounts: [],
    mastodonAccounts: [],
  });
  const [backupStatus, setBackupStatus] = React.useState<BackupStatus[]>([]);

  const handleSupabaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      supabase: {
        ...prev.supabase,
        [name]: value,
      },
    }));
  };

  const addBlueskyAccount = () => {
    setSettings(prev => ({
      ...prev,
      blueskyAccounts: [
        ...prev.blueskyAccounts,
        { instanceUrl: '', username: '', password: '' },
      ],
    }));
  };

  const addMastodonAccount = () => {
    setSettings(prev => ({
      ...prev,
      mastodonAccounts: [
        ...prev.mastodonAccounts,
        { instanceUrl: '', userId: '', apiToken: '' },
      ],
    }));
  };

  const updateBlueskyAccount = (index: number, field: keyof BlueskyAccount, value: string) => {
    setSettings(prev => ({
      ...prev,
      blueskyAccounts: prev.blueskyAccounts.map((account, i) =>
        i === index ? { ...account, [field]: value } : account
      ),
    }));
  };

  const updateMastodonAccount = (index: number, field: keyof MastodonAccount, value: string) => {
    setSettings(prev => ({
      ...prev,
      mastodonAccounts: prev.mastodonAccounts.map((account, i) =>
        i === index ? { ...account, [field]: value } : account
      ),
    }));
  };

  const removeBlueskyAccount = (index: number) => {
    setSettings(prev => ({
      ...prev,
      blueskyAccounts: prev.blueskyAccounts.filter((_, i) => i !== index),
    }));
  };

  const removeMastodonAccount = (index: number) => {
    setSettings(prev => ({
      ...prev,
      mastodonAccounts: prev.mastodonAccounts.filter((_, i) => i !== index),
    }));
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      toast({
        title: 'Settings saved',
        description: 'Your backup settings have been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  React.useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/status');
        const data = await response.json();
        setBackupStatus(data);
      } catch (error) {
        console.error('Failed to fetch backup status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Social Media Backup Manager</h1>
        <Button onClick={saveSettings} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Settings className="mr-2 h-4 w-4" />
          )}
          Save Settings
        </Button>
      </div>

      <Tabs defaultValue="supabase">
        <TabsList>
          <TabsTrigger value="supabase">Supabase</TabsTrigger>
          <TabsTrigger value="bluesky">Bluesky</TabsTrigger>
          <TabsTrigger value="mastodon">Mastodon</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        <TabsContent value="supabase">
          <Card>
            <CardHeader>
              <CardTitle>Supabase Configuration</CardTitle>
              <CardDescription>
                Enter your Supabase credentials to store your social media backups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Instance URL</Label>
                <Input
                  id="url"
                  name="url"
                  value={settings.supabase.url}
                  onChange={handleSupabaseChange}
                  placeholder="https://your-project.supabase.co"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceKey">Service Key</Label>
                <Input
                  id="serviceKey"
                  name="serviceKey"
                  type="password"
                  value={settings.supabase.serviceKey}
                  onChange={handleSupabaseChange}
                  placeholder="your-service-key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userId">User ID (Optional)</Label>
                <Input
                  id="userId"
                  name="userId"
                  value={settings.supabase.userId}
                  onChange={handleSupabaseChange}
                  placeholder="your-user-id"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bluesky">
          <Card>
            <CardHeader>
              <CardTitle>Bluesky Accounts</CardTitle>
              <CardDescription>
                Add your Bluesky accounts to backup posts and likes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.blueskyAccounts.map((account, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label>Instance URL</Label>
                    <Input
                      value={account.instanceUrl}
                      onChange={(e) => updateBlueskyAccount(index, 'instanceUrl', e.target.value)}
                      placeholder="https://bsky.social"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      value={account.username}
                      onChange={(e) => updateBlueskyAccount(index, 'username', e.target.value)}
                      placeholder="username.bsky.social"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>App Password</Label>
                    <Input
                      type="password"
                      value={account.password}
                      onChange={(e) => updateBlueskyAccount(index, 'password', e.target.value)}
                      placeholder="app-specific-password"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => removeBlueskyAccount(index)}
                  >
                    Remove Account
                  </Button>
                </div>
              ))}
              <Button onClick={addBlueskyAccount}>
                Add Bluesky Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mastodon">
          <Card>
            <CardHeader>
              <CardTitle>Mastodon Accounts</CardTitle>
              <CardDescription>
                Add your Mastodon accounts to backup toots and likes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.mastodonAccounts.map((account, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label>Instance URL</Label>
                    <Input
                      value={account.instanceUrl}
                      onChange={(e) => updateMastodonAccount(index, 'instanceUrl', e.target.value)}
                      placeholder="https://mastodon.social"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>User ID</Label>
                    <Input
                      value={account.userId}
                      onChange={(e) => updateMastodonAccount(index, 'userId', e.target.value)}
                      placeholder="your-user-id"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Token</Label>
                    <Input
                      type="password"
                      value={account.apiToken}
                      onChange={(e) => updateMastodonAccount(index, 'apiToken', e.target.value)}
                      placeholder="your-api-token"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => removeMastodonAccount(index)}
                  >
                    Remove Account
                  </Button>
                </div>
              ))}
              <Button onClick={addMastodonAccount}>
                Add Mastodon Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Backup Status</CardTitle>
              <CardDescription>
                View the status of your recent backup operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {backupStatus.length > 0 ? (
                <div className="space-y-4">
                  {backupStatus.map((status, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        status.success ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {status.accountType === 'bluesky' ? 'Bluesky' : 'Mastodon'} Backup
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(status.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Cloud
                          className={`h-5 w-5 ${
                            status.success ? 'text-green-500' : 'text-red-500'
                          }`}
                        />
                      </div>
                      {status.error && (
                        <p className="mt-2 text-sm text-red-600">{status.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No backup history available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Toaster />
    </div>
  );
}

export default App;