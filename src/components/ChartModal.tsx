
import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Token } from '@/types/token';
import { Chart, registerables } from 'chart.js';
import { formatSol } from '@/lib/utils';
import { Badge } from './ui/badge';

Chart.register(...registerables);

interface ChartModalProps {
  token: Token | null;
  onClose: () => void;
}

const ChartModal: React.FC<ChartModalProps> = ({ token, onClose }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token || !chartRef.current) return;
    
    setIsLoading(true);
    
    // Cleanup previous chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    setTimeout(() => {
      const ctx = chartRef.current?.getContext('2d');
      if (!ctx) return;
      
      // Use real price history if available, otherwise generate sample data
      const priceData = token.priceHistory || generateSampleData(token);
      
      const labels = priceData.map(point => {
        const date = new Date(point.timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      });
      
      const prices = priceData.map(point => point.price);
      
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
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
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [token]);

  // Function to generate sample data if real data is not available
  const generateSampleData = (token: Token) => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const points = 24; // One point per hour
    
    // Create random price points based on the current price
    const priceData = [];
    const basePrice = token?.price || token?.initialBuy || 0.1;
    
    for (let i = 0; i < points; i++) {
      const timestamp = oneDayAgo + (i * 60 * 60 * 1000);
      // Random price fluctuation
      const randomFactor = 0.8 + Math.random() * 0.4; // Between 0.8 and 1.2
      const price = basePrice * randomFactor;
      priceData.push({ timestamp, price });
    }
    
    return priceData;
  };

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
            <Badge variant="outline" className="bg-primary/10">
              {token.symbol || '?'}
            </Badge>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
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
                
                {token.pumpInfo?.description && (
                  <div className="pt-2">
                    <span className="text-muted-foreground">Description:</span>
                    <p className="mt-1 text-xs">{token.pumpInfo.description}</p>
                  </div>
                )}
                
                <div className="pt-2 flex flex-wrap gap-2">
                  {token.pumpInfo?.twitter && (
                    <a
                      href={token.pumpInfo.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Twitter
                    </a>
                  )}
                  
                  {token.pumpInfo?.website && (
                    <a
                      href={token.pumpInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartModal;
