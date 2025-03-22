import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QuickSettingsCard from '@/components/QuickSettingsCard';
import NLPSettings from '@/components/NLPSettings';
import BotStatusCard from '@/components/BotStatusCard';

interface BotSettings {
  id: number;
  contextAwareness: boolean;
  autoModeration: boolean;
  userTracking: boolean;
  debugMode: boolean;
  nlpModel: string;
  temperature: string;
  maxTokens: number;
  contextSize: number;
  updatedAt: string;
}

const Settings: React.FC = () => {
  const { toast } = useToast();
  const { data: settings, isLoading } = useQuery<BotSettings>({
    queryKey: ['/api/settings'],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<BotSettings>) => {
      const response = await apiRequest('PATCH', '/api/settings', updatedSettings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: 'Settings Updated',
        description: 'The settings have been updated successfully.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error Updating Settings',
        description: error.message || 'An error occurred while updating the settings.',
        variant: 'destructive',
      });
    }
  });

  const toggleSettingMutation = useMutation({
    mutationFn: async ({ setting, value }: { setting: string, value?: boolean }) => {
      const result = await apiRequest('POST', '/api/settings/toggle', { setting, value });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: 'Setting Updated',
        description: 'The setting has been updated successfully.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error Updating Setting',
        description: error.message || 'An error occurred while updating the setting.',
        variant: 'destructive',
      });
    }
  });

  return (
    <div>
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-discord-dark border-gray-700 col-span-2">
            <CardHeader className="border-b border-gray-700">
              <CardTitle className="text-white">Bot Configuration</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="bg-gray-800 mb-4">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="moderation">Moderation</TabsTrigger>
                  <TabsTrigger value="privacy">Privacy</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general">
                  {isLoading ? (
                    <p className="text-gray-400">Loading settings...</p>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-white font-medium">Context Awareness</h3>
                            <p className="text-sm text-gray-400">
                              Enable conversation memory between interactions
                            </p>
                          </div>
                          <Switch 
                            checked={settings?.contextAwareness || false}
                            onCheckedChange={() => toggleSettingMutation.mutate({ setting: 'contextAwareness' })}
                            disabled={toggleSettingMutation.isPending}
                          />
                        </div>
                      </div>
                      
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-white font-medium">Bot Command Prefix</h3>
                            <p className="text-sm text-gray-400">
                              The character that triggers bot commands
                            </p>
                          </div>
                          <div className="w-16 h-10 bg-gray-700 rounded-md flex items-center justify-center">
                            <span className="text-white font-bold">!</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-white font-medium">Debug Mode</h3>
                            <p className="text-sm text-gray-400">
                              Enable detailed logging and debugging information
                            </p>
                          </div>
                          <Switch 
                            checked={settings?.debugMode || false}
                            onCheckedChange={() => toggleSettingMutation.mutate({ setting: 'debugMode' })}
                            disabled={toggleSettingMutation.isPending}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="moderation">
                  {isLoading ? (
                    <p className="text-gray-400">Loading settings...</p>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-white font-medium">Auto-Moderation</h3>
                            <p className="text-sm text-gray-400">
                              Automatically moderate inappropriate content
                            </p>
                          </div>
                          <Switch 
                            checked={settings?.autoModeration || false}
                            onCheckedChange={() => toggleSettingMutation.mutate({ setting: 'autoModeration' })}
                            disabled={toggleSettingMutation.isPending}
                          />
                        </div>
                      </div>
                      
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="flex flex-col">
                          <h3 className="text-white font-medium mb-2">Moderation Actions</h3>
                          <p className="text-sm text-gray-400 mb-4">
                            Configure actions taken when content is flagged
                          </p>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Low Severity</span>
                              <span className="text-gray-300 font-medium">Warn User</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Medium Severity</span>
                              <span className="text-gray-300 font-medium">Delete Message</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">High Severity</span>
                              <span className="text-gray-300 font-medium">Timeout User</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-white font-medium">Notification on Moderation</h3>
                            <p className="text-sm text-gray-400">
                              Send notifications when content is moderated
                            </p>
                          </div>
                          <Switch 
                            checked={true}
                            disabled={toggleSettingMutation.isPending}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="privacy">
                  {isLoading ? (
                    <p className="text-gray-400">Loading settings...</p>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-white font-medium">User Tracking</h3>
                            <p className="text-sm text-gray-400">
                              Store user preferences and interaction history
                            </p>
                          </div>
                          <Switch 
                            checked={settings?.userTracking || false}
                            onCheckedChange={() => toggleSettingMutation.mutate({ setting: 'userTracking' })}
                            disabled={toggleSettingMutation.isPending}
                          />
                        </div>
                      </div>
                      
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="flex flex-col">
                          <h3 className="text-white font-medium mb-2">Data Retention</h3>
                          <p className="text-sm text-gray-400 mb-4">
                            Configure how long conversation data is stored
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Retention Period</span>
                            <span className="text-gray-300 font-medium">30 days</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="flex flex-col">
                          <h3 className="text-white font-medium mb-2">Privacy Policy</h3>
                          <p className="text-sm text-gray-400 mb-4">
                            Configure user data handling and privacy notices
                          </p>
                          
                          <Button variant="outline" className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600">
                            View Privacy Settings
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="advanced">
                  {isLoading ? (
                    <p className="text-gray-400">Loading settings...</p>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                        <h3 className="text-red-400 font-medium mb-2">Danger Zone</h3>
                        <p className="text-sm text-red-300/80 mb-4">
                          These actions can't be undone. Please proceed with caution.
                        </p>
                        
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="text-white text-sm font-medium">Reset Bot Configuration</h4>
                              <p className="text-xs text-gray-400">Reset all settings to default values</p>
                            </div>
                            <Button variant="destructive" size="sm">
                              Reset
                            </Button>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="text-white text-sm font-medium">Clear All Conversation Data</h4>
                              <p className="text-xs text-gray-400">Delete all stored conversations</p>
                            </div>
                            <Button variant="destructive" size="sm">
                              Clear
                            </Button>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="text-white text-sm font-medium">Revoke API Tokens</h4>
                              <p className="text-xs text-gray-400">Revoke all API tokens and regenerate keys</p>
                            </div>
                            <Button variant="destructive" size="sm">
                              Revoke
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <BotStatusCard />
            <QuickSettingsCard />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Card className="bg-discord-dark border-gray-700">
            <CardHeader className="border-b border-gray-700">
              <CardTitle className="text-white">Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Error Notifications</span>
                  <Switch checked={true} />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Moderation Alerts</span>
                  <Switch checked={true} />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">API Usage Warnings</span>
                  <Switch checked={true} />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">System Status Updates</span>
                  <Switch checked={false} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <NLPSettings />
        </div>
      </div>
    </div>
  );
};

export default Settings;
