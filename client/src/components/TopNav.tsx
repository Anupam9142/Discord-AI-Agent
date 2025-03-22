import React from 'react';
import { useLocation } from 'wouter';

interface TopNavProps {
  onMenuClick: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ onMenuClick }) => {
  const [location] = useLocation();
  
  // Get the current page title based on the location
  const getPageTitle = () => {
    if (location === '/') return 'Dashboard';
    if (location === '/conversations') return 'Conversations';
    if (location === '/commands') return 'Commands';
    if (location === '/integrations') return 'Integrations';
    if (location === '/settings') return 'Settings';
    return 'Dashboard';
  };

  return (
    <header className="bg-discord-dark border-b border-gray-700">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <button 
            className="md:hidden text-discord-light mr-4"
            onClick={onMenuClick}
          >
            <i className="fas fa-bars"></i>
          </button>
          <h1 className="text-white font-semibold text-lg">{getPageTitle()}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="text-discord-light hover:text-white">
              <i className="fas fa-bell"></i>
            </button>
            <span className="absolute top-0 right-0 h-4 w-4 bg-discord-error rounded-full text-xs flex items-center justify-center text-white">3</span>
          </div>
          
          <div className="relative">
            <button className="text-discord-light hover:text-white">
              <i className="fas fa-cog"></i>
            </button>
          </div>
          
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-600 rounded-full overflow-hidden">
              <div className="w-full h-full bg-discord-blurple flex items-center justify-center">
                <span className="text-white font-semibold text-sm">AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
