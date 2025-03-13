
import React from 'react';
import { formatSol, shortenAddress } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Token } from '@/types/token';

interface TokenCardProps {
  token: Token;
  onClick: (token: Token) => void;
}

const TokenCard: React.FC<TokenCardProps> = ({ token, onClick }) => {
  return (
    <div 
      className="token-card animate-fade-in cursor-pointer hover:bg-accent/50"
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
          <Badge variant="outline" className="bg-primary/10 text-xs">
            {token.symbol || '?'}
          </Badge>
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

export default TokenCard;
