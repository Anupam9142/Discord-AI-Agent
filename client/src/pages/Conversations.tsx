import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ConversationCard from '@/components/ConversationCard';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Conversation {
  id: number;
  userId: string;
  username: string;
  context: any[];
  active: boolean;
  lastUpdated: string;
  createdAt: string;
}

const Conversations: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: conversations, isLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations/recent'],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`${queryKey[0]}?limit=20`);
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      return response.json();
    }
  });

  // Filter conversations based on search term
  const filteredConversations = conversations?.filter(convo => 
    convo.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(convo.context).toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <Card className="bg-discord-dark border-gray-700 mb-6">
        <CardHeader className="border-b border-gray-700">
          <div className="flex justify-between items-center">
            <CardTitle className="text-white">Conversations</CardTitle>
            <Button size="sm" className="bg-discord-blurple hover:bg-blue-600">
              Export Conversations
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6">
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white focus:ring-discord-blurple"
            />
          </div>
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-gray-800 mb-4">
              <TabsTrigger value="all">All Conversations</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {isLoading ? (
                <div className="text-center p-8">
                  <p className="text-gray-400">Loading conversations...</p>
                </div>
              ) : !filteredConversations || filteredConversations.length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-gray-400">No conversations found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredConversations.map((convo) => (
                    <ConversationCard
                      key={convo.id}
                      username={convo.username}
                      messages={convo.context}
                      timeAgo={getTimeAgo(convo.lastUpdated)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="active">
              {isLoading ? (
                <div className="text-center p-8">
                  <p className="text-gray-400">Loading conversations...</p>
                </div>
              ) : !filteredConversations || filteredConversations.filter(c => c.active).length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-gray-400">No active conversations found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredConversations.filter(c => c.active).map((convo) => (
                    <ConversationCard
                      key={convo.id}
                      username={convo.username}
                      messages={convo.context}
                      timeAgo={getTimeAgo(convo.lastUpdated)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="closed">
              {isLoading ? (
                <div className="text-center p-8">
                  <p className="text-gray-400">Loading conversations...</p>
                </div>
              ) : !filteredConversations || filteredConversations.filter(c => !c.active).length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-gray-400">No closed conversations found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredConversations.filter(c => !c.active).map((convo) => (
                    <ConversationCard
                      key={convo.id}
                      username={convo.username}
                      messages={convo.context}
                      timeAgo={getTimeAgo(convo.lastUpdated)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Conversations;
