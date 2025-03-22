import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const BotStatusCard: React.FC = () => {
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/status'],
    refetchInterval: 60000, // Refresh every minute
  });

  const startBotMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/bot/start', {});
    },
    onSuccess: () => {
      toast({
        title: 'Bot Started',
        description: 'The Discord bot has been started successfully.',
        variant: 'default',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error Starting Bot',
        description: error.message || 'An error occurred while starting the bot.',
        variant: 'destructive',
      });
    }
  });

  const stopBotMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/bot/stop', {});
    },
    onSuccess: () => {
      toast({
        title: 'Bot Stopped',
        description: 'The Discord bot has been stopped successfully.',
        variant: 'default',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error Stopping Bot',
        description: error.message || 'An error occurred while stopping the bot.',
        variant: 'destructive',
      });
    }
  });

  const handleRefreshStatus = () => {
    refetch();
    toast({
      title: 'Status Refreshed',
      description: 'Bot status has been refreshed.',
      variant: 'default',
    });
  };

  const toggleBot = () => {
    if (data?.status?.ready) {
      stopBotMutation.mutate();
    } else {
      startBotMutation.mutate();
    }
  };

  const isOnline = data?.status?.ready;
  const cpuUsage = data?.systemInfo?.cpuUsage || 0;
  const memoryUsage = data?.systemInfo?.memoryUsage || 0;
  const apiRateLimit = data?.systemInfo?.apiRateLimit || 0;

  return (
    <div className="bg-discord-dark rounded-lg shadow">
      <div className="px-5 py-4 border-b border-gray-700">
        <h2 className="text-white font-semibold">Bot Status</h2>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-300">Connection Status</span>
          <span className={`px-2 py-1 text-xs rounded-full ${isOnline ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">CPU Usage</span>
              <span className="text-xs text-gray-400">{cpuUsage}%</span>
            </div>
            <div className="mt-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-discord-blurple rounded-full" style={{ width: `${cpuUsage}%` }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Memory</span>
              <span className="text-xs text-gray-400">{memoryUsage * 20}MB / 2GB</span>
            </div>
            <div className="mt-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-discord-blurple rounded-full" style={{ width: `${memoryUsage}%` }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">API Rate Limit</span>
              <span className="text-xs text-gray-400">{apiRateLimit}%</span>
            </div>
            <div className="mt-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-discord-warning rounded-full" style={{ width: `${apiRateLimit}%` }}></div>
            </div>
          </div>
        </div>
        
        <div className="mt-5 space-y-2">
          <Button 
            className="w-full" 
            onClick={handleRefreshStatus}
            disabled={isLoading}
            variant="outline"
          >
            Refresh Status
          </Button>
          
          <Button 
            className={`w-full ${isOnline ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            onClick={toggleBot}
            disabled={startBotMutation.isPending || stopBotMutation.isPending}
          >
            {isOnline ? 'Stop Bot' : 'Start Bot'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BotStatusCard;
