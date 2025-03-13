
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

  // Function to create sample data - in real implementation, fetch from API
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartModal;
