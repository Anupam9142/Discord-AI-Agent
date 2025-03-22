import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import StatsCard from '@/components/StatsCard';
import ConversationCard from '@/components/ConversationCard';
import BotStatusCard from '@/components/BotStatusCard';
import QuickSettingsCard from '@/components/QuickSettingsCard';
import CommandPerformance from '@/components/CommandPerformance';
import NLPSettings from '@/components/NLPSettings';
import TestInterface from '@/components/TestInterface';
import APIIntegrationsTable from '@/components/APIIntegrationsTable';

const Dashboard: React.FC = () => {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats'],
  });

  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/conversations/recent'],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`${queryKey[0]}?limit=2`);
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      return response.json();
    }
  });

  // Helper function to format timestamp to relative time
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.round((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  return (
    <div>
      {/* Dashboard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Commands"
          value={statsLoading ? '...' : statsData?.totalCommands.toLocaleString() || '0'}
          icon="terminal"
          iconColor="bg-blue-100 text-blue-600"
          trend="up"
          trendValue="14% from last week"
        />
        <StatsCard
          title="Active Conversations"
          value={statsLoading ? '...' : statsData?.activeConversations.toString() || '0'}
          icon="comments"
          iconColor="bg-green-100 text-green-600"
          trend="up"
          trendValue="7% from last week"
        />
        <StatsCard
          title="API Integrations"
          value={statsLoading ? '...' : statsData?.apiIntegrations.toString() || '0'}
          icon="plug"
          iconColor="bg-purple-100 text-purple-600"
        />
        <StatsCard
          title="Moderation Actions"
          value={statsLoading ? '...' : statsData?.moderationActions.toString() || '0'}
          icon="shield-alt"
          iconColor="bg-red-100 text-red-600"
          trend="up"
          trendValue="3 today"
        />
      </div>
      
      {/* Featured Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Conversations */}
        <div className="bg-discord-dark rounded-lg shadow col-span-1 lg:col-span-2">
          <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-white font-semibold">Recent Conversations</h2>
            <button className="text-sm text-discord-blurple hover:underline">View All</button>
          </div>
          <div className="p-5 space-y-5">
            {conversationsLoading ? (
              <p className="text-gray-400 text-sm">Loading conversations...</p>
            ) : !conversationsData || conversationsData.length === 0 ? (
              <p className="text-gray-400 text-sm">No recent conversations found.</p>
            ) : (
              conversationsData.map((conversation: any) => (
                <ConversationCard
                  key={conversation.id}
                  username={conversation.username}
                  messages={conversation.context}
                  timeAgo={getTimeAgo(conversation.lastUpdated)}
                />
              ))
            )}
          </div>
        </div>
        
        {/* Quick Stats & Configuration */}
        <div className="space-y-6">
          <BotStatusCard />
          <QuickSettingsCard />
        </div>
      </div>
      
      {/* API Integrations */}
      <div className="mb-8">
        <APIIntegrationsTable />
      </div>
      
      {/* Command Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <CommandPerformance />
        <NLPSettings />
      </div>
      
      {/* Test Interface */}
      <div className="mb-8">
        <TestInterface />
      </div>
    </div>
  );
};

export default Dashboard;
