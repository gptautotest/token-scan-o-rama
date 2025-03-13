import React, { useEffect, useState } from 'react';
import TokenGrid from '@/components/TokenGrid';
import ChartModal from '@/components/ChartModal';
import ConnectionStatus from '@/components/ConnectionStatus';
import { Token } from '@/types/token';
import websocketService from '@/services/websocketService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

const Index = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [mintAddress, setMintAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribeStatus = websocketService.onStatusChange((status) => {
      setConnectionStatus(status);
    });
    
    const unsubscribeTokens = websocketService.onNewToken((token) => {
      setTokens((prevTokens) => {
        const exists = prevTokens.some(t => t.mint === token.mint);
        if (exists) {
          return prevTokens.map(t => 
            t.mint === token.mint ? { ...t, ...token } : t
          );
        }
        const newTokens = [token, ...prevTokens];
        if (newTokens.length > 50) {
          return newTokens.slice(0, 50);
        }
        return newTokens;
      });
    });
    
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

  const handleFetchToken = async () => {
    const trimmedAddress = mintAddress.trim();
    if (!trimmedAddress) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, введите адрес токена",
        variant: "destructive"
      });
      return;
    }

    if (trimmedAddress.length < 32 || trimmedAddress.length > 44) {
      toast({
        title: "Некорректный формат",
        description: "Адрес токена Solana должен быть от 32 до 44 символов",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("Fetching token data for:", trimmedAddress);
      const token = await websocketService.fetchTokenByMint(trimmedAddress);
      
      if (token) {
        setTokens((prevTokens) => {
          const exists = prevTokens.some(t => t.mint === token.mint);
          if (exists) {
            return prevTokens.map(t => 
              t.mint === token.mint ? { ...t, ...token } : t
            );
          }
          return [token, ...prevTokens];
        });
        
        setSelectedToken(token);
        
        toast({
          title: "Успех",
          description: `Информация о токене ${token.name || token.symbol || token.mint.substring(0, 8)} получена`,
        });
      } else {
        toast({
          title: "Информация не найдена",
          description: "Не удалось получить данные для указанного адреса токена",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching token:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось получить информацию о токене",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
              Мониторинг новых токенов в реальном времени на Solana
            </p>
          </div>
          
          <ConnectionStatus status={connectionStatus} />
        </header>
        
        <div className="mb-6 flex gap-2 items-center">
          <Input
            placeholder="Введите адрес токена Solana (mint)"
            value={mintAddress}
            onChange={(e) => setMintAddress(e.target.value)}
            className="max-w-md"
          />
          <Button 
            onClick={handleFetchToken} 
            disabled={isLoading}
            className="whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <span className="mr-2">Загрузка...</span>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              </>
            ) : (
              'Получить данные'
            )}
          </Button>
        </div>
        
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
