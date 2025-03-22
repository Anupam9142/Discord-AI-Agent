import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import APIIntegrationsTable from '@/components/APIIntegrationsTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';

const Integrations: React.FC = () => {
  const { data: apiIntegrations } = useQuery({
    queryKey: ['/api/integrations'],
  });

  // Calculate total usage and limits
  const totalUsage = apiIntegrations?.reduce((total: number, integration: any) => total + integration.usage, 0) || 0;
  const totalLimit = apiIntegrations?.reduce((total: number, integration: any) => total + integration.monthlyLimit, 0) || 0;
  const usagePercentage = totalLimit > 0 ? (totalUsage / totalLimit) * 100 : 0;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-discord-dark border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Total API Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-2">
              <span className="text-white text-2xl font-bold">{totalUsage}</span>
              <span className="text-gray-400">/ {totalLimit}</span>
            </div>
            <div className="h-3 w-full bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-discord-blurple rounded-full" 
                style={{ width: `${usagePercentage}%` }}
              ></div>
            </div>
            <p className="text-gray-400 text-sm mt-2">Monthly API calls across all integrations</p>
          </CardContent>
        </Card>
        
        <Card className="bg-discord-dark border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Active Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <span className="text-white text-2xl font-bold">
                {apiIntegrations?.filter((i: any) => i.active).length || 0}
              </span>
              <span className="text-gray-400 ml-2">/ {apiIntegrations?.length || 0}</span>
            </div>
            <p className="text-gray-400 text-sm mt-2">Enabled API services</p>
          </CardContent>
        </Card>
        
        <Card className="bg-discord-dark border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Last API Call</CardTitle>
          </CardHeader>
          <CardContent>
            {apiIntegrations && apiIntegrations.length > 0 ? (
              <>
                <div className="text-white text-xl font-medium">
                  {apiIntegrations.some((i: any) => i.lastCall) ? (
                    getLastCallInfo(apiIntegrations)
                  ) : (
                    'No recent calls'
                  )}
                </div>
                <p className="text-gray-400 text-sm mt-2">Most recent API activity</p>
              </>
            ) : (
              <p className="text-gray-400">No API calls recorded</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="integrations" className="w-full">
        <TabsList className="bg-gray-800 mb-4">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="integrations">
          <APIIntegrationsTable />
        </TabsContent>
        
        <TabsContent value="usage">
          <Card className="bg-discord-dark border-gray-700">
            <CardHeader className="border-b border-gray-700">
              <CardTitle className="text-white">API Usage Analytics</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {apiIntegrations && apiIntegrations.length > 0 ? (
                <div className="space-y-6">
                  {apiIntegrations.map((integration: any) => (
                    <div key={integration.id} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className={`h-10 w-10 rounded-full ${getIntegrationIconBg(integration.type)} flex items-center justify-center mr-3`}>
                            <span className="text-white font-bold">{integration.name.charAt(0)}</span>
                          </div>
                          <div>
                            <h3 className="text-white font-medium">{integration.name}</h3>
                            <p className="text-sm text-gray-400">{integration.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-white font-medium">{integration.usage} / {integration.monthlyLimit}</span>
                          <p className="text-xs text-gray-400">API calls</p>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-discord-blurple rounded-full" 
                          style={{ width: `${(integration.usage / integration.monthlyLimit) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-400">No API usage data available yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="config">
          <Card className="bg-discord-dark border-gray-700">
            <CardHeader className="border-b border-gray-700">
              <CardTitle className="text-white">API Configuration</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p className="text-gray-400">Configure global API settings, security, and rate limiting.</p>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">Rate Limiting</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Configure how API rate limits are handled across services
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-300">
                    <span>Default rate limiting strategy:</span>
                    <span className="font-medium">Distributed</span>
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">Authentication</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Manage API key storage and rotation policies
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-300">
                    <span>Key storage method:</span>
                    <span className="font-medium">Environment Variables</span>
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">Fallback Behavior</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Configure behavior when API services are unavailable
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-300">
                    <span>Fallback mode:</span>
                    <span className="font-medium">Graceful Degradation</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper function to get the last API call info
function getLastCallInfo(integrations: any[]) {
  // Filter integrations with last call data
  const integrationsWithCalls = integrations.filter(i => i.lastCall);
  
  if (integrationsWithCalls.length === 0) {
    return 'No recent calls';
  }
  
  // Find most recent call
  const mostRecent = integrationsWithCalls.reduce((mostRecent, current) => {
    const currentDate = new Date(current.lastCall);
    const mostRecentDate = new Date(mostRecent.lastCall);
    return currentDate > mostRecentDate ? current : mostRecent;
  }, integrationsWithCalls[0]);
  
  // Calculate time ago
  const date = new Date(mostRecent.lastCall);
  const now = new Date();
  const diffMinutes = Math.round((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

// Helper function to get integration icon background color
function getIntegrationIconBg(type: string) {
  switch (type) {
    case 'weather': return 'bg-blue-800';
    case 'translation': return 'bg-purple-800';
    case 'news': return 'bg-yellow-800';
    default: return 'bg-gray-800';
  }
}

export default Integrations;
