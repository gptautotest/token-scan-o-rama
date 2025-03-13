
import React from 'react';
import TokenCard from './TokenCard';
import { Token } from '@/types/token';

interface TokenGridProps {
  tokens: Token[];
  onTokenSelect: (token: Token) => void;
}

const TokenGrid: React.FC<TokenGridProps> = ({ tokens, onTokenSelect }) => {
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
          Ожидание новых токенов...
        </div>
      )}
    </div>
  );
};

export default TokenGrid;
