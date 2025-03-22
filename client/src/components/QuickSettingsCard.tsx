import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

const QuickSettingsCard: React.FC = () => {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
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

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const result = await apiRequest('PATCH', '/api/settings', settings);
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: 'Settings Saved',
        description: 'All settings have been saved successfully.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error Saving Settings',
        description: error.message || 'An error occurred while saving settings.',
        variant: 'destructive',
      });
    }
  });

  const handleToggle = (setting: string) => {
    toggleSettingMutation.mutate({ setting });
  };

  if (isLoading || !settings) {
    return (
      <div className="bg-discord-dark rounded-lg shadow">
        <div className="px-5 py-4 border-b border-gray-700">
          <h2 className="text-white font-semibold">Quick Settings</h2>
        </div>
        <div className="p-5">
          <p className="text-gray-400 text-sm">Loading settings...</p>
        </div>
      </div>
    );
  }

  const quickSettings = [
    { id: 'contextAwareness', name: 'Context Awareness' },
    { id: 'autoModeration', name: 'Auto-Moderation' },
    { id: 'userTracking', name: 'User Tracking' },
    { id: 'debugMode', name: 'Debug Mode' }
  ];

  return (
    <div className="bg-discord-dark rounded-lg shadow">
      <div className="px-5 py-4 border-b border-gray-700">
        <h2 className="text-white font-semibold">Quick Settings</h2>
      </div>
      <div className="p-5">
        <div className="space-y-4">
          {quickSettings.map((setting) => (
            <div key={setting.id} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">{setting.name}</span>
              <Switch 
                checked={settings[setting.id]} 
                onCheckedChange={() => handleToggle(setting.id)}
                disabled={toggleSettingMutation.isPending}
              />
            </div>
          ))}
        </div>
        
        <Button 
          className="mt-5 w-full bg-discord-blurple hover:bg-blue-600"
          onClick={() => saveSettingsMutation.mutate()}
          disabled={saveSettingsMutation.isPending}
        >
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default QuickSettingsCard;
