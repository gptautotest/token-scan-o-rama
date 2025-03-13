
import { fetchTokenImage } from '@/lib/utils';
import { Token } from '@/types/token';

const WS_URL = "wss://pumpportal.fun/api/data";
const SOLANA_API = "https://api.mainnet-beta.solana.com";

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected';
type StatusListener = (status: WebSocketStatus) => void;
type TokenListener = (token: Token) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 3000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setTimeout> | null = null;
  
  private statusListeners: StatusListener[] = [];
  private tokenListeners: TokenListener[] = [];
  
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
    
    this.ws = new WebSocket(WS_URL);
    
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
        
        // Enrich token data from Solana and Pump.fun
        let token: Token = {
          ...tokenInfo,
        };
        
        // Get token image and metadata
        try {
          if (tokenInfo.uri) {
            const enrichedToken = await this.fetchTokenMetadata(token);
            token = { ...token, ...enrichedToken };
          }
        } catch (error) {
          console.error("Error fetching token metadata:", error);
        }
        
        // Get token price history from Solana
        try {
          const priceHistory = await this.fetchTokenPriceHistory(token.mint);
          token.priceHistory = priceHistory;
        } catch (error) {
          console.error("Error fetching price history:", error);
        }
        
        this.notifyNewToken(token);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }
  
  private async fetchTokenMetadata(token: Token): Promise<Partial<Token>> {
    if (!token.uri) return {};
    
    try {
      const response = await fetch(token.uri);
      if (response.ok) {
        const data = await response.json();
        return {
          imageUrl: data.image,
          name: data.name || token.name,
          symbol: data.symbol || token.symbol,
          pumpInfo: {
            description: data.description,
            website: data.website,
            twitter: data.twitter,
            creator: data.creator || data.createdBy
          }
        };
      }
    } catch (error) {
      console.error("Error fetching token metadata:", error);
    }
    
    return {};
  }
  
  private async fetchTokenPriceHistory(mint: string): Promise<{timestamp: number, price: number}[]> {
    try {
      // This would be the real implementation to fetch from Solana
      // For demonstration, we'll create semi-realistic data
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      const points = 24; // One point per hour
      
      // Create random price points based on the current price
      const priceHistory = [];
      for (let i = 0; i < points; i++) {
        const timestamp = oneDayAgo + (i * 60 * 60 * 1000);
        // Random price fluctuation
        const randomFactor = 0.8 + Math.random() * 0.4; // Between 0.8 and 1.2
        const price = 0.001 * randomFactor * (1 + i/points);
        priceHistory.push({ timestamp, price });
      }
      
      return priceHistory;
      
      // In a real implementation, we would fetch from Solana or other API like:
      // const response = await fetch(`https://api.solscan.io/token/market?token=${mint}`);
      // const data = await response.json();
      // return data.priceHistory;
    } catch (error) {
      console.error("Error fetching token price history:", error);
      return [];
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
  
  private notifyStatusChange(status: WebSocketStatus): void {
    this.statusListeners.forEach(listener => listener(status));
  }
  
  private notifyNewToken(token: Token): void {
    this.tokenListeners.forEach(listener => listener(token));
  }
  
  // Public methods for subscribing to events
  public onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.push(listener);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }
  
  public onNewToken(listener: TokenListener): () => void {
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
export default websocketService;
