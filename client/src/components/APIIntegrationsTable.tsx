import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import AddIntegrationModal from './AddIntegrationModal';

interface ApiIntegration {
  id: number;
  name: string;
  type: string;
  endpoint: string;
  authMethod: string;
  apiKey?: string;
  active: boolean;
  usage: number;
  monthlyLimit: number;
  lastCall: string | null;
  createdAt: string;
}

const APIIntegrationsTable: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: integrations, isLoading } = useQuery<ApiIntegration[]>({
    queryKey: ['/api/integrations'],
  });

  const toggleIntegrationMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number, active: boolean }) => {
      const response = await apiRequest('POST', `/api/integrations/${id}/toggle`, { active });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({
        title: 'Integration Updated',
        description: 'The integration status has been updated.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error Updating Integration',
        description: error.message || 'An error occurred while updating the integration.',
        variant: 'destructive',
      });
    }
  });

  const handleToggle = (id: number, currentStatus: boolean) => {
    toggleIntegrationMutation.mutate({ id, active: !currentStatus });
  };

  const getStatusBadge = (integration: ApiIntegration) => {
    if (!integration.active) {
      return <Badge variant="destructive">Disabled</Badge>;
    }
    
    if (integration.usage > integration.monthlyLimit * 0.9) {
      return <Badge className="bg-yellow-900 text-yellow-300">Rate Limited</Badge>;
    }
    
    return <Badge className="bg-green-900 text-green-300">Active</Badge>;
  };

  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
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

  const getIconColor = (type: string) => {
    switch (type) {
      case 'weather': return 'bg-blue-800';
      case 'translation': return 'bg-purple-800';
      case 'news': return 'bg-yellow-800';
      default: return 'bg-gray-800';
    }
  };

  const getIconLetter = (type: string) => {
    return type.charAt(0).toUpperCase();
  };

  return (
    <>
      <div className="bg-discord-dark rounded-lg shadow">
        <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white font-semibold">API Integrations</h2>
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-discord-blurple hover:bg-blue-600"
          >
            Add New
          </Button>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">Loading integrations...</p>
            </div>
          ) : !integrations || integrations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">No API integrations found.</p>
              <Button 
                className="mt-4 bg-discord-blurple hover:bg-blue-600"
                onClick={() => setIsModalOpen(true)}
              >
                Add Your First Integration
              </Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    API Service
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Usage
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Last Call
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-discord-dark divide-y divide-gray-700">
                {integrations.map((integration) => (
                  <tr key={integration.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 ${getIconColor(integration.type)} rounded-full flex items-center justify-center`}>
                          <span className="text-white font-bold">{getIconLetter(integration.type)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{integration.name}</div>
                          <div className="text-sm text-gray-400">{integration.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(integration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{integration.usage} / {integration.monthlyLimit}</div>
                      <div className="text-xs text-gray-400">Monthly calls</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {getTimeAgo(integration.lastCall)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-discord-blurple hover:text-blue-400 mr-3">Edit</button>
                      <button 
                        className={integration.active ? "text-discord-error hover:text-red-400" : "text-discord-success hover:text-green-400"}
                        onClick={() => handleToggle(integration.id, integration.active)}
                        disabled={toggleIntegrationMutation.isPending}
                      >
                        {integration.active ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {isModalOpen && (
        <AddIntegrationModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default APIIntegrationsTable;
