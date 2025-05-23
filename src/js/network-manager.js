/**
 * Network Manager Module
 * Handles WebSocket connections and message routing for multiplayer functionality
 */

export class NetworkManager {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.messageHandlers = new Map();
    this.connectionId = null;
    this.latency = 0;
    this.lastPingTime = 0;
    
    // Event handlers
    this.onConnect = null;
    this.onDisconnect = null;
    this.onError = null;
  }

  /**
   * Connect to the game server
   * @param {string} serverUrl - WebSocket server URL
   */
  connect(serverUrl) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn('Already connected to server');
      return;
    }

    try {
      this.ws = new WebSocket(serverUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.handleError(error);
    }
  }

  /**
   * Set up WebSocket event handlers
   */
  setupEventHandlers() {
    this.ws.onopen = () => {
      console.log('Connected to game server');
      this.connected = true;
      this.reconnectAttempts = 0;
      
      // Start ping interval for latency measurement
      this.startPingInterval();
      
      if (this.onConnect) {
        this.onConnect();
      }
    };

    this.ws.onclose = (event) => {
      console.log('Disconnected from server:', event.code, event.reason);
      this.connected = false;
      this.stopPingInterval();
      
      if (this.onDisconnect) {
        this.onDisconnect(event);
      }
      
      // Attempt reconnection if not a clean close
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleError(error);
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };
  }

  /**
   * Handle incoming messages
   * @param {Object} message - Parsed message object
   */
  handleMessage(message) {
    const { type, data } = message;
    
    // Handle system messages
    if (type === 'pong') {
      this.handlePong(data);
      return;
    }
    
    if (type === 'connection-id') {
      this.connectionId = data.id;
      return;
    }
    
    // Handle game messages
    const handler = this.messageHandlers.get(type);
    if (handler) {
      handler(data);
    } else {
      console.warn('No handler for message type:', type);
    }
  }

  /**
   * Register a message handler
   * @param {string} type - Message type
   * @param {Function} handler - Handler function
   */
  on(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Remove a message handler
   * @param {string} type - Message type
   */
  off(type) {
    this.messageHandlers.delete(type);
  }

  /**
   * Send a message to the server
   * @param {string} type - Message type
   * @param {Object} data - Message data
   */
  send(type, data = {}) {
    if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: not connected');
      return false;
    }

    try {
      const message = JSON.stringify({ type, data, timestamp: Date.now() });
      this.ws.send(message);
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.connected = false;
  }

  /**
   * Attempt to reconnect to the server
   */
  attemptReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (!this.connected) {
        this.connect(this.ws.url);
      }
    }, delay);
  }

  /**
   * Start ping interval for latency measurement
   */
  startPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.connected) {
        this.lastPingTime = Date.now();
        this.send('ping');
      }
    }, 5000); // Ping every 5 seconds
  }

  /**
   * Stop ping interval
   */
  stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Handle pong response
   * @param {Object} data - Pong data
   */
  handlePong(data) {
    if (this.lastPingTime) {
      this.latency = Date.now() - this.lastPingTime;
    }
  }

  /**
   * Handle errors
   * @param {Error} error - Error object
   */
  handleError(error) {
    if (this.onError) {
      this.onError(error);
    }
  }

  /**
   * Get current latency
   * @returns {number} Latency in milliseconds
   */
  getLatency() {
    return this.latency;
  }

  /**
   * Check if connected
   * @returns {boolean} Connection status
   */
  isConnected() {
    return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export default new NetworkManager();
