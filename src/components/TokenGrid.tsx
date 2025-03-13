
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
          <div className="text-center p-6">
            <p className="mb-2">Ожидание новых токенов...</p>
            <p className="text-sm">Введите адрес токена Solana в поле выше для получения информации.</p>
            <p className="text-xs mt-4 text-muted-foreground">Пример: 9MuhnpquQJyG35nC5Tr2C9PEqW3pGd42Wc3A5wjBpump</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenGrid;
