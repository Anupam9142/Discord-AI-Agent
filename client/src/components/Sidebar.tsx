import React from 'react';
import { Link, useLocation } from 'wouter';

const Sidebar: React.FC = () => {
  const [location] = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: 'chart-line' },
    { name: 'Conversations', path: '/conversations', icon: 'comments' },
    { name: 'Commands', path: '/commands', icon: 'terminal' },
    { name: 'Integrations', path: '/integrations', icon: 'plug' },
    { name: 'Settings', path: '/settings', icon: 'cog' },
  ];

  return (
    <div className="bg-discord-black w-16 md:w-64 flex-shrink-0 h-full">
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-discord-blurple rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">AI</span>
            </div>
            <h1 className="text-white font-semibold text-lg ml-3 hidden md:block">Discord AI Agent</h1>
          </div>
        </div>
        
        <nav className="mt-5 px-2 space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.path}
              href={item.path}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                location === item.path 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              } group`}
            >
              <i className={`fas fa-${item.icon} mr-3`}></i>
              <span className="hidden md:inline">{item.name}</span>
            </Link>
          ))}
        </nav>
        
        <div className="mt-auto p-4 border-t border-gray-700">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-discord-success rounded-full relative">
              <span className="absolute right-0 bottom-0 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></span>
            </div>
            <div className="ml-3 hidden md:block">
              <p className="text-sm font-medium text-white">AI Bot</p>
              <p className="text-xs text-gray-400">Online</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
