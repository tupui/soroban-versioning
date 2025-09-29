/**
 * Simple Launchtube Toggle Component
 * Lightweight component showing Launchtube status with minimal UI footprint
 */

import { useState, useEffect } from 'react';
import { isLaunchtubeEnabled, checkLaunchtubeHealth } from '../service/LaunchtubeService';
import { formatCredits } from '../utils/launchtubeConfig';

interface LaunchtubeToggleProps {
  className?: string;
  showCredits?: boolean;
  compact?: boolean;
}

export default function LaunchtubeToggle({ 
  className = '', 
  showCredits = true, 
  compact = false 
}: LaunchtubeToggleProps) {
  const [status, setStatus] = useState<{
    enabled: boolean;
    healthy: boolean;
    credits?: number;
    loading: boolean;
  }>({
    enabled: false,
    healthy: false,
    loading: true
  });

  useEffect(() => {
    checkStatus();
    
    // Refresh every 5 minutes
    const interval = setInterval(checkStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    const enabled = isLaunchtubeEnabled();
    
    if (!enabled) {
      setStatus({ enabled: false, healthy: false, loading: false });
      return;
    }

    try {
      const health = await checkLaunchtubeHealth();
      setStatus({
        enabled: true,
        healthy: health.isHealthy,
        credits: health.credits,
        loading: false
      });
    } catch {
      setStatus({
        enabled: true,
        healthy: false,
        loading: false
      });
    }
  };

  if (!status.enabled) {
    return null; // Don't show anything if not enabled
  }

  const getStatusColor = () => {
    if (status.loading) return 'bg-gray-400';
    if (!status.healthy) return 'bg-red-500';
    if (status.credits !== undefined && status.credits < 1000) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (status.loading) return 'Checking...';
    if (!status.healthy) return 'Error';
    return 'Active';
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
        <span className="text-xs text-gray-600">LT</span>
        {showCredits && status.credits !== undefined && (
          <span className="text-xs font-medium text-gray-700">
            {formatCredits(status.credits)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 bg-gray-50 rounded text-sm ${className}`}>
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
      <span className="text-gray-700">Launchtube</span>
      <span className="text-gray-600">{getStatusText()}</span>
      {showCredits && status.credits !== undefined && (
        <span className="font-medium text-gray-800">
          {formatCredits(status.credits)}
        </span>
      )}
    </div>
  );
}