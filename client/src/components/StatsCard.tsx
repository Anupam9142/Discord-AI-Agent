import React from 'react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: string;
  iconColor: string;
  trend?: string;
  trendValue?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon, 
  iconColor, 
  trend, 
  trendValue 
}) => {
  // Determine trend color
  const getTrendColor = () => {
    if (!trend) return 'text-gray-400';
    return trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400';
  };

  return (
    <div className="bg-discord-dark rounded-lg shadow p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white text-sm font-medium">{title}</h3>
        <span className={`inline-flex items-center justify-center p-2 ${iconColor} rounded-full`}>
          <i className={`fas fa-${icon}`}></i>
        </span>
      </div>
      <div className="mt-2">
        <p className="text-3xl font-semibold text-white">{value}</p>
        {trendValue && (
          <p className={`mt-1 text-sm ${getTrendColor()}`}>
            {trend === 'up' && '+'}{trendValue}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
