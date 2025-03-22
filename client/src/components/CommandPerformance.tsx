import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface CommandStat {
  id: number;
  name: string;
  description: string;
  usage: number;
  percentage: number;
  createdAt: string;
}

const CommandPerformance: React.FC = () => {
  const { data: commandStats, isLoading } = useQuery<CommandStat[]>({
    queryKey: ['/api/commands/stats'],
  });

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

  if (isLoading) {
    return (
      <div className="bg-discord-dark rounded-lg shadow">
        <div className="px-5 py-4 border-b border-gray-700">
          <h2 className="text-white font-semibold">Command Performance</h2>
        </div>
        <div className="p-5">
          <p className="text-gray-400 text-sm">Loading command statistics...</p>
        </div>
      </div>
    );
  }

  if (!commandStats || commandStats.length === 0) {
    return (
      <div className="bg-discord-dark rounded-lg shadow">
        <div className="px-5 py-4 border-b border-gray-700">
          <h2 className="text-white font-semibold">Command Performance</h2>
        </div>
        <div className="p-5">
          <p className="text-gray-400 text-sm">No command usage data available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-discord-dark rounded-lg shadow">
      <div className="px-5 py-4 border-b border-gray-700">
        <h2 className="text-white font-semibold">Command Performance</h2>
      </div>
      <div className="p-5">
        <div className="space-y-4">
          {commandStats.map((cmd) => (
            <div key={cmd.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-discord-blurple rounded-full text-white mr-3">
                    <i className={`fas fa-${getCommandIcon(cmd.name)}`}></i>
                  </span>
                  <span className="text-white font-medium">!{cmd.name}</span>
                </div>
                <span className="text-sm text-gray-400">{cmd.usage} uses</span>
              </div>
              <div className="flex items-center mt-2">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-discord-blurple h-2 rounded-full" 
                    style={{ width: `${cmd.percentage}%` }}
                  ></div>
                </div>
                <span className="ml-3 text-sm text-gray-400">{cmd.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommandPerformance;
