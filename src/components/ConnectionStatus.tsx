
import React from 'react';
import { Badge } from './ui/badge';
import { Loader2, Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected';
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  return (
    <Badge
      variant="outline"
      className={`
        flex items-center gap-2 py-1.5 px-3 transition-all duration-300
        ${status === 'connected' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}
        ${status === 'connecting' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : ''}
        ${status === 'disconnected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : ''}
      `}
    >
      {status === 'connected' && (
        <>
          <Wifi className="h-3.5 w-3.5" />
          <span>Connected</span>
        </>
      )}
      {status === 'connecting' && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Connecting...</span>
        </>
      )}
      {status === 'disconnected' && (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          <span>Disconnected</span>
        </>
      )}
    </Badge>
  );
};

export default ConnectionStatus;
