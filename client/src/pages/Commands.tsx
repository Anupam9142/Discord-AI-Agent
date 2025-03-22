import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CommandPerformance from '@/components/CommandPerformance';
import TestInterface from '@/components/TestInterface';

interface Command {
  id: number;
  name: string;
  description: string;
  usage: number;
  createdAt: string;
}

const Commands: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: commands, isLoading } = useQuery<Command[]>({
    queryKey: ['/api/commands'],
  });

  // Filter commands based on search term
  const filteredCommands = commands?.filter(cmd => 
    cmd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cmd.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCommandIcon = (commandName: string) => {
    switch (commandName) {
      case 'weather': return 'cloud';
      case 'translate': return 'language';
      case 'news': return 'newspaper';
      case 'help': return 'question-circle';
      case 'remind': return 'clock';
      case 'stats': return 'chart-bar';
      default: return 'terminal';
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card className="bg-discord-dark border-gray-700">
            <CardHeader className="border-b border-gray-700">
              <div className="flex justify-between items-center">
                <CardTitle className="text-white">Commands</CardTitle>
                <Button size="sm" className="bg-discord-blurple hover:bg-blue-600">
                  Add Command
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-6">
                <Input
                  placeholder="Search commands..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white focus:ring-discord-blurple"
                />
              </div>
              
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="bg-gray-800 mb-4">
                  <TabsTrigger value="all">All Commands</TabsTrigger>
                  <TabsTrigger value="popular">Popular</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  {isLoading ? (
                    <div className="text-center p-8">
                      <p className="text-gray-400">Loading commands...</p>
                    </div>
                  ) : !filteredCommands || filteredCommands.length === 0 ? (
                    <div className="text-center p-8">
                      <p className="text-gray-400">No commands found.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredCommands.map((cmd) => (
                        <div key={cmd.id} className="bg-gray-800 rounded-lg p-4">
                          <div className="flex items-center">
                            <div className="inline-flex items-center justify-center w-10 h-10 bg-discord-blurple rounded-full text-white mr-4">
                              <i className={`fas fa-${getCommandIcon(cmd.name)}`}></i>
                            </div>
                            <div>
                              <h3 className="text-white font-medium text-lg">!{cmd.name}</h3>
                              <p className="text-gray-400 text-sm">{cmd.description}</p>
                            </div>
                            <div className="ml-auto text-right">
                              <span className="text-gray-300 text-sm">{cmd.usage} uses</span>
                              <div className="flex space-x-2 mt-1">
                                <button className="text-discord-blurple hover:text-blue-400 text-xs">Edit</button>
                                <button className="text-discord-error hover:text-red-400 text-xs">Delete</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="popular">
                  {isLoading ? (
                    <div className="text-center p-8">
                      <p className="text-gray-400">Loading commands...</p>
                    </div>
                  ) : !filteredCommands || filteredCommands.length === 0 ? (
                    <div className="text-center p-8">
                      <p className="text-gray-400">No commands found.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredCommands
                        .sort((a, b) => b.usage - a.usage)
                        .slice(0, 5)
                        .map((cmd) => (
                          <div key={cmd.id} className="bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center">
                              <div className="inline-flex items-center justify-center w-10 h-10 bg-discord-blurple rounded-full text-white mr-4">
                                <i className={`fas fa-${getCommandIcon(cmd.name)}`}></i>
                              </div>
                              <div>
                                <h3 className="text-white font-medium text-lg">!{cmd.name}</h3>
                                <p className="text-gray-400 text-sm">{cmd.description}</p>
                              </div>
                              <div className="ml-auto text-right">
                                <span className="text-gray-300 text-sm">{cmd.usage} uses</span>
                                <div className="flex space-x-2 mt-1">
                                  <button className="text-discord-blurple hover:text-blue-400 text-xs">Edit</button>
                                  <button className="text-discord-error hover:text-red-400 text-xs">Delete</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="custom">
                  <div className="text-center p-8">
                    <p className="text-gray-400">No custom commands found.</p>
                    <Button className="mt-4 bg-discord-blurple hover:bg-blue-600">
                      Create Custom Command
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <CommandPerformance />
        </div>
      </div>
      
      <TestInterface />
    </div>
  );
};

export default Commands;
