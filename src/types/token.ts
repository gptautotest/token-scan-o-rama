
export interface Token {
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
  priceHistory?: {timestamp: number, price: number}[];
  pumpInfo?: {
    creator?: string;
    website?: string;
    twitter?: string;
    description?: string;
  };
}
