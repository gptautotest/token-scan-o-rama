import { fetchTokenImage } from '@/lib/utils';
import { Token } from '@/types/token';

const WS_URL = "wss://pumpportal.fun/api/data";

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
