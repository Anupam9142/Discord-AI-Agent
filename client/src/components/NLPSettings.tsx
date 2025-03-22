import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

const NLPSettings: React.FC = () => {
  const { toast } = useToast();
  const { data: settings, isLoading } = useQuery<BotSettings>({
    queryKey: ['/api/settings'],
  });

  const [localSettings, setLocalSettings] = useState<Partial<BotSettings>>({});

  // Update local settings when data is loaded
  React.useEffect(() => {
    if (settings) {
      setLocalSettings({
        nlpModel: settings.nlpModel,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        contextSize: settings.contextSize
      });
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<BotSettings>) => {
      const response = await apiRequest('PATCH', '/api/settings', updatedSettings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: 'NLP Settings Updated',
        description: 'The NLP settings have been updated successfully.',
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

  const handleModelChange = (value: string) => {
    setLocalSettings({ ...localSettings, nlpModel: value });
  };

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSettings({ ...localSettings, temperature: value });
  };

  const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setLocalSettings({ ...localSettings, maxTokens: value });
  };

  const handleContextSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setLocalSettings({ ...localSettings, contextSize: value });
  };

  const handleSubmit = () => {
    updateSettingsMutation.mutate(localSettings);
  };

  if (isLoading || !settings) {
    return (
      <div className="bg-discord-dark rounded-lg shadow">
        <div className="px-5 py-4 border-b border-gray-700">
          <h2 className="text-white font-semibold">Natural Language Processing</h2>
        </div>
        <div className="p-5">
          <p className="text-gray-400 text-sm">Loading NLP settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-discord-dark rounded-lg shadow">
      <div className="px-5 py-4 border-b border-gray-700">
        <h2 className="text-white font-semibold">Natural Language Processing</h2>
      </div>
      <div className="p-5">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="nlp-model">
              Active NLP Model
            </label>
            <Select 
              value={localSettings.nlpModel || settings.nlpModel} 
              onValueChange={handleModelChange}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-discord-blurple">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="gpt">GPT-based Model</SelectItem>
                <SelectItem value="bert">BERT Model</SelectItem>
                <SelectItem value="custom">Custom Trained Model</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Model Parameters</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm text-gray-400">Temperature</label>
                  <span className="text-sm text-gray-400">
                    {localSettings.temperature || settings.temperature}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={localSettings.temperature || settings.temperature} 
                  onChange={handleTemperatureChange}
                  className="w-full mt-1"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm text-gray-400">Max Tokens</label>
                  <span className="text-sm text-gray-400">
                    {localSettings.maxTokens || settings.maxTokens}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="500" 
                  step="10" 
                  value={localSettings.maxTokens || settings.maxTokens} 
                  onChange={handleMaxTokensChange}
                  className="w-full mt-1"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm text-gray-400">Context Size</label>
                  <span className="text-sm text-gray-400">
                    {localSettings.contextSize || settings.contextSize} messages
                  </span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  step="1" 
                  value={localSettings.contextSize || settings.contextSize} 
                  onChange={handleContextSizeChange}
                  className="w-full mt-1"
                />
              </div>
            </div>
          </div>
          
          <Button 
            className="mt-2 w-full bg-discord-blurple hover:bg-blue-600"
            onClick={handleSubmit}
            disabled={updateSettingsMutation.isPending}
          >
            Update NLP Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NLPSettings;
