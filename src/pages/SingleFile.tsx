import React, { useEffect, useState, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { LAMPORTS_PER_SOL } from '@/lib/utils';

// Register Chart.js components
Chart.register(...registerables);

//  ██████╗ ██╗   ██╗███╗   ███╗██████╗    ███████╗██╗   ██╗███╗   ██╗
//  ██╔══██╗██║   ██║████╗ ████║██╔══██╗   ██╔════╝██║   ██║████╗  ██║
//  ██████╔╝██║   ██║██╔████╔██║██████╔╝   █████╗  ██║   ██║██╔██╗ ██║
//  ██╔═══╝ ██║   ██║██║╚██╔╝██║██╔═══╝    ██╔══╝  ██║   ██║██║╚██╗██║
//  ██║     ╚██████╔╝██║ ╚═╝ ██║██║        ██║     ╚██████╔╝██║ ╚████║
//  ╚═╝      ╚═════╝ ╚═╝     ╚═╝╚═╝        ╚═╝      ╚═════╝ ╚═╝  ╚═══╝
//  ████████╗ ██████╗ ██╗  ██╗███████╗███╗   ██╗    ███████╗ ██████╗ █████╗ ███╗   ██╗███╗   ██╗███████╗██████╗ 
//  ╚══██╔══╝██╔═══██╗██║ ██╔╝██╔════╝████╗  ██║    ██╔════╝██╔════╝██╔══██╗████╗  ██║████╗  ██║██╔════╝██╔══██╗
//     ██║   ██║   ██║█████╔╝ █████╗  ██╔██╗ ██║    ███████╗██║     ███████║██╔██╗ ██║██╔██╗ ██║█████╗  ██████╔╝
//     ██║   ██║   ██║██╔═██╗ ██╔══╝  ██║╚██╗██║    ╚════██║██║     ██╔══██║██║╚██╗██║██║╚██╗██║██╔══╝  ██╔══██╗
//     ██║   ╚██████╔╝██║  ██╗███████╗██║ ╚████║    ███████║╚██████╗██║  ██║██║ ╚████║██║ ╚████║███████╗██║  ██║
//     ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝    ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝

// ========= TYPES =========
interface Token {
  mint: string;
  name?: string;
  symbol?: string;
  price?: number;
  initialBuy?: number;
  marketCapSol?: number;
  supply?: number;
  holders?: number;
  uri?: string;
  imageUrl?: string;
  createdAt?: string;
}

// ========= UTILITY FUNCTIONS =========
function formatSol(value: number): string {
  if (typeof value !== 'number') return '0 SOL';
  
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}k SOL`;
  }
  
  if (value >= 1) {
    return `${value.toFixed(2)} SOL`;
  }
  
  // Handle small values more gracefully
  if (value < 0.01) {
    return `${value.toExponential(2)} SOL`;
  }
  
  return `${value.toFixed(4)} SOL`;
}

function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

async function fetchTokenImage(token: any): Promise<string | undefined> {
  if (!token.uri) return undefined;
  
  try {
    const response = await fetch(token.uri);
    if (response.ok) {
      const data = await response.json();
      return data.image;
    }
  } catch (error) {
    console.error("Error fetching token image:", error);
  }
  
  return undefined;
}

//  ██╗    ██╗███████╗██████╗ ███████╗ ██████╗  ██████╗██╗  ██╗███████╗████████╗
//  ██║    ██║██╔════╝██╔══██╗██╔════╝██╔═══██╗██╔════╝██║ ██╔╝██╔════╝╚══██╔══╝
//  ██║ █╗ ██║█████╗  ██████╔╝███████╗██║   ██║██║     █████╔╝ █████╗     ██║   
//  ██║███╗██║██╔══╝  ██╔══██╗╚════██║██║   ██║██║     ██╔═██╗ ██╔══╝     ██║   
//  ╚███╔███╔╝███████╗██████╔╝███████║╚██████╔╝╚██████╗██║  ██╗███████╗   ██║   
//   ╚══╝╚══╝ ╚══════╝╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝   
//  ███████╗███████╗██████╗ ██╗   ██╗██╗ ██████╗███████╗
//  ██╔════╝██╔════╝██╔══██╗██║   ██║██║██╔════╝██╔════╝
//  ███████╗█████╗  ██████╔╝██║   ██║██║██║     █████╗  
//  ╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██║██║     ██╔══╝  
//  ███████║███████╗██║  ██║ ╚████╔╝ ██║╚██████╗███████╗
//  ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚═╝ ╚═════╝╚══════╝

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 3000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setTimeout> | null = null;
  
  private statusListeners: ((status: 'connecting' | 'connected' | 'disconnected') => void)[] = [];
  private tokenListeners: ((token: Token) => void)[] = [];
  
  constructor() {
    this.connect();
    
    // Setup automatic reconnection check
    setInterval(() => {
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        this.connect();
      }
    }, 5000);
  }
  
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    
    this.notifyStatusChange('connecting');
    
    this.ws = new WebSocket("wss://pumpportal.fun/api/data");
    
    this.ws.onopen = () => {
      this.onOpen();
    };
    
    this.ws.onclose = () => {
      this.onClose();
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.onClose();
    };
    
    this.ws.onmessage = (event) => {
      this.onMessage(event);
    };
  }
  
  private onOpen(): void {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
    this.notifyStatusChange('connected');
    
    // Subscribe to new tokens
    this.send({
      method: "subscribeNewToken",
      params: []
    });
    
    // Setup ping to keep connection alive
    this.setupPing();
  }
  
  private onClose(): void {
    console.log('WebSocket disconnected');
    this.notifyStatusChange('disconnected');
    this.clearPing();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, this.reconnectTimeout);
    }
  }
  
  private async onMessage(event: MessageEvent): Promise<void> {
    try {
      const data = JSON.parse(event.data);
      
      if ((data.method === 'newToken' && data.params?.[0]) || (data.signature && data.mint)) {
        const tokenInfo = data.params?.[0] || data;
        
        // Fetch the token image if available
        let imageUrl;
        try {
          imageUrl = await fetchTokenImage(tokenInfo);
        } catch (error) {
          console.error("Error processing token image:", error);
        }
        
        const token: Token = {
          ...tokenInfo,
          imageUrl,
        };
        
        this.notifyNewToken(token);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }
  
  private setupPing(): void {
    this.clearPing();
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds
  }
  
  private clearPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
  
  private send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
  
  private notifyStatusChange(status: 'connecting' | 'connected' | 'disconnected'): void {
    this.statusListeners.forEach(listener => listener(status));
  }
  
  private notifyNewToken(token: Token): void {
    this.tokenListeners.forEach(listener => listener(token));
  }
  
  // Public methods for subscribing to events
  public onStatusChange(listener: (status: 'connecting' | 'connected' | 'disconnected') => void): () => void {
    this.statusListeners.push(listener);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }
  
  public onNewToken(listener: (token: Token) => void): () => void {
    this.tokenListeners.push(listener);
    return () => {
      this.tokenListeners = this.tokenListeners.filter(l => l !== listener);
    };
  }
  
  public disconnect(): void {
    this.clearPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();

//   ██████╗ ██████╗ ███╗   ███╗██████╗  ██████╗ ███╗   ██╗███████╗███╗   ██╗████████╗███████╗
//  ██╔════╝██╔═══██╗████╗ ████║██╔══██╗██╔═══██╗████╗  ██║██╔════╝████╗  ██║╚══██╔══╝██╔════╝
//  ██║     ██║   ██║██╔████╔██║██████╔╝██║   ██║██╔██╗ ██║█████╗  ██╔██╗ ██║   ██║   ███████╗
//  ██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║   ██║██║╚██╗██║██╔══╝  ██║╚██╗██║   ██║   ╚════██║
//  ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ╚██████╔╝██║ ╚████║███████╗██║ ╚████║   ██║   ███████║
//   ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝

// --------- CONNECTION STATUS ---------
const ConnectionStatus: React.FC<{ status: 'connecting' | 'connected' | 'disconnected' }> = ({ status }) => {
  return (
    <div
      className={`
        inline-flex items-center gap-2 py-1.5 px-3 rounded-full border text-sm font-medium transition-all duration-300
        ${status === 'connected' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}
        ${status === 'connecting' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : ''}
        ${status === 'disconnected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : ''}
      `}
    >
      {status === 'connected' && (
        <>
          <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><circle cx="12" cy="20" r="1"></circle></svg>
          <span>Connected</span>
        </>
      )}
      {status === 'connecting' && (
        <>
          <svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
          <span>Connecting...</span>
        </>
      )}
      {status === 'disconnected' && (
        <>
          <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
          <span>Disconnected</span>
        </>
      )}
    </div>
  );
};

// --------- TOKEN CARD ---------
const TokenCard: React.FC<{ token: Token; onClick: (token: Token) => void }> = ({ token, onClick }) => {
  return (
    <div 
      className="bg-card rounded-xl p-4 border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
      onClick={() => onClick(token)}
    >
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-3">
        {token.imageUrl ? (
          <img 
            src={token.imageUrl} 
            alt={token.name || 'Token'} 
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://raw.githubusercontent.com/pump-fun-official/pump-fun-bot/main/assets/lungnorla.webp';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-2xl font-bold text-muted-foreground">
              {token.symbol?.[0] || '?'}
            </span>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-base truncate">{token.name || 'Unknown Token'}</h3>
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-xs border-primary/20">
            {token.symbol || '?'}
          </div>
        </div>
        
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price:</span>
            <span className="text-secondary font-medium">
              {formatSol(token.price || token.initialBuy || 0)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Market Cap:</span>
            <span>{formatSol(token.marketCapSol || 0)}</span>
          </div>
          
          <div className="pt-1 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Address:</span>
            <a
              href={`https://solscan.io/token/${token.mint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline truncate max-w-[120px]"
              onClick={(e) => e.stopPropagation()}
            >
              {shortenAddress(token.mint)}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// --------- TOKEN GRID ---------
const TokenGrid: React.FC<{ tokens: Token[]; onTokenSelect: (token: Token) => void }> = ({ tokens, onTokenSelect }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {tokens.map((token) => (
        <TokenCard 
          key={token.mint} 
          token={token} 
          onClick={onTokenSelect} 
        />
      ))}
      
      {tokens.length === 0 && (
        <div className="col-span-full min-h-[300px] flex items-center justify-center text-muted-foreground">
          Waiting for new tokens...
        </div>
      )}
    </div>
  );
};

// --------- CHART MODAL ---------
const ChartModal: React.FC<{ token: Token | null; onClose: () => void }> = ({ token, onClose }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to create sample data
  const generateSampleData = () => {
    const now = new Date();
    const hours = Array.from({ length: 24 }, (_, i) => {
      const d = new Date(now);
      d.setHours(now.getHours() - 24 + i);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    
    // Create some sample price movements
    const startPrice = token?.price || token?.initialBuy || 0.1;
    const prices = [startPrice];
    
    for (let i = 1; i < 24; i++) {
      const change = (Math.random() - 0.5) * 0.2; // Random change between -10% and +10%
      const newPrice = prices[i-1] * (1 + change);
      prices.push(Math.max(0.00001, newPrice)); // Ensure price doesn't go negative
    }
    
    return { hours, prices };
  };

  useEffect(() => {
    if (!token || !chartRef.current) return;
    
    setIsLoading(true);
    
    // Simulate data loading
    const timeout = setTimeout(() => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      
      const { hours, prices } = generateSampleData();
      
      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;
      
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: hours,
          datasets: [{
            label: `Price (SOL)`,
            data: prices,
            fill: true,
            backgroundColor: 'rgba(153, 69, 255, 0.1)',
            borderColor: 'rgba(153, 69, 255, 1)',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: 'rgba(153, 69, 255, 1)',
            tension: 0.4,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1000,
            easing: 'easeOutQuart'
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            },
            y: {
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)',
                callback: (value) => formatSol(value as number)
              }
            }
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: 'rgba(255, 255, 255, 0.9)',
              bodyColor: 'rgba(255, 255, 255, 0.9)',
              borderColor: 'rgba(153, 69, 255, 0.3)',
              borderWidth: 1,
              displayColors: false,
              callbacks: {
                label: (context) => `${formatSol(context.parsed.y)}`
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });
      
      setIsLoading(false);
    }, 500);
    
    return () => {
      clearTimeout(timeout);
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [token]);

  if (!token) return null;

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-card w-full max-w-5xl rounded-xl shadow-2xl border border-border/50 overflow-hidden animate-fade-in">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{token.name || 'Unknown Token'}</h2>
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10">
              {token.symbol || '?'}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="aspect-[3/2] w-full relative bg-card">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
              ) : (
                <canvas ref={chartRef} />
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Current Price</p>
                  <p className="text-lg font-medium text-secondary">
                    {formatSol(token.price || token.initialBuy || 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Market Cap</p>
                  <p className="text-lg font-medium">
                    {formatSol(token.marketCapSol || 0)}
                  </p>
                </div>
              </div>
              
              <div className="pt-2 space-y-1">
                <p className="text-xs text-muted-foreground">Token Address</p>
                <a
                  href={`https://solscan.io/token/${token.mint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary truncate block hover:underline"
                >
                  {token.mint}
                </a>
              </div>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-2">Token Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supply:</span>
                  <span>{token.supply?.toLocaleString() || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Holders:</span>
                  <span>{token.holders || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{token.createdAt ? new Date(token.createdAt).toLocaleDateString() : 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

//  ███╗   ███╗ █████╗ ██╗███╗   ██╗     █████╗ ██████╗ ██████╗ 
//  ████╗ ████║██╔══██╗██║████╗  ██║    ██╔══██╗██╔══██╗██╔══██╗
//  ██╔████╔██║███████║██║██╔██╗ ██║    ███████║██████╔╝██████╔╝
//  ██║╚██╔╝██║██╔══██║██║██║╚██╗██║    ██╔══██║██╔═══╝ ██╔═══╝ 
//  ██║ ╚═╝ ██║██║  ██║██║██║ ╚████║    ██║  ██║██║     ██║     
//  ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝    ╚═╝  ╚═╝╚═╝     ╚═╝     

const SingleFile = () => {
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
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

export default SingleFile;
