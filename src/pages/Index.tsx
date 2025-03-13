
import React, { useEffect, useState } from 'react';
import TokenGrid from '@/components/TokenGrid';
import ChartModal from '@/components/ChartModal';
import ConnectionStatus from '@/components/ConnectionStatus';
import { Token } from '@/types/token';
import websocketService from '@/services/websocketService';

const Index = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    // Subscribe to WebSocket status changes
    const unsubscribeStatus = websocketService.onStatusChange((status) => {
      setConnectionStatus(status);
    });
    
    // Subscribe to new tokens
    const unsubscribeTokens = websocketService.onNewToken((token) => {
      setTokens((prevTokens) => {
        // Check if token already exists
        const exists = prevTokens.some(t => t.mint === token.mint);
        if (exists) {
          // Update existing token
          return prevTokens.map(t => 
            t.mint === token.mint ? { ...t, ...token } : t
          );
        }
        
        // Add new token to the beginning of the array
        const newTokens = [token, ...prevTokens];
        
        // Limit to 50 tokens for performance
        if (newTokens.length > 50) {
          return newTokens.slice(0, 50);
        }
        
        return newTokens;
      });
    });
    
    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeStatus();
      unsubscribeTokens();
    };
  }, []);

  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
  };

  const handleCloseChart = () => {
    setSelectedToken(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8 max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-solana to-solana-secondary bg-clip-text text-transparent">
              Pump.fun Token Scanner
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor new tokens in real-time on Solana
            </p>
          </div>
          
          <ConnectionStatus status={connectionStatus} />
        </header>
        
        <main>
          <TokenGrid tokens={tokens} onTokenSelect={handleTokenSelect} />
        </main>
        
        {selectedToken && (
          <ChartModal token={selectedToken} onClose={handleCloseChart} />
        )}
      </div>
    </div>
  );
};

export default Index;
