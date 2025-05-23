/**
 * Lobby System Module
 * Manages game room creation, joining, and player management
 * Last updated: 2025-01-24
 */

import networkManager from './network-manager.js';

export class LobbySystem {
  constructor() {
    this.currentRoom = null;
    this.players = new Map();
    this.isHost = false;
    this.roomSettings = {};
    
    // UI callbacks
    this.onRoomCreated = null;
    this.onRoomJoined = null;
    this.onPlayerJoined = null;
    this.onPlayerLeft = null;
    this.onRoomUpdate = null;
    this.onGameStart = null;
    
    this.setupNetworkHandlers();
  }

  /**
   * Set up network message handlers
   */
  setupNetworkHandlers() {
    networkManager.on('room-created', (data) => this.handleRoomCreated(data));
    networkManager.on('room-joined', (data) => this.handleRoomJoined(data));
    networkManager.on('player-joined', (data) => this.handlePlayerJoined(data));
    networkManager.on('player-left', (data) => this.handlePlayerLeft(data));
    networkManager.on('room-update', (data) => this.handleRoomUpdate(data));
    networkManager.on('game-starting', (data) => this.handleGameStart(data));
    networkManager.on('room-error', (data) => this.handleRoomError(data));
  }

  /**
   * Create a new game room
   * @param {Object} settings - Room settings
   */
  createRoom(settings = {}) {
    const roomData = {
      name: settings.name || `Room ${Math.floor(Math.random() * 10000)}`,
      maxPlayers: settings.maxPlayers || 4,
      gameSettings: {
        gravityType: settings.gravityType || 'point',
        gravityStrength: settings.gravityStrength || 0.1,
        // Include other game settings from config
      }
    };
    
    networkManager.send('create-room', roomData);
  }

  /**
   * Join an existing room
   * @param {string} roomCode - Room code to join
   * @param {string} playerName - Player name
   */
  joinRoom(roomCode, playerName) {
    networkManager.send('join-room', { roomCode, playerName });
  }

  /**
   * Leave current room
   */
  leaveRoom() {
    if (this.currentRoom) {
      networkManager.send('leave-room', { roomCode: this.currentRoom.code });
      this.resetLobbyState();
    }
  }

  /**
   * Start the game (host only)
   */
  startGame() {
    if (!this.isHost) {
      console.warn('Only the host can start the game');
      return;
    }
    
    if (this.players.size < 2) {
      console.warn('Need at least 2 players to start');
      return;
    }
    
    networkManager.send('start-game', { roomCode: this.currentRoom.code });
  }

  /**
   * Update room settings (host only)
   * @param {Object} settings - New settings
   */
  updateRoomSettings(settings) {
    if (!this.isHost) {
      console.warn('Only the host can update room settings');
      return;
    }
    
    networkManager.send('update-room', {
      roomCode: this.currentRoom.code,
      settings
    });
  }

  /**
   * Handle room created event
   * @param {Object} data - Room data
   */
  handleRoomCreated(data) {
    this.currentRoom = data.room;
    this.isHost = true;
    this.players.set(data.playerId, {
      id: data.playerId,
      name: data.playerName,
      isHost: true,
      color: 'blue'
    });
    
    if (this.onRoomCreated) {
      this.onRoomCreated(data);
    }
  }

  /**
   * Handle room joined event
   * @param {Object} data - Room data
   */
  handleRoomJoined(data) {
    this.currentRoom = data.room;
    this.isHost = false;
    
    // Add existing players
    data.players.forEach(player => {
      this.players.set(player.id, player);
    });
    
    if (this.onRoomJoined) {
      this.onRoomJoined(data);
    }
  }

  /**
   * Handle player joined event
   * @param {Object} data - Player data
   */
  handlePlayerJoined(data) {
    this.players.set(data.player.id, data.player);
    
    if (this.onPlayerJoined) {
      this.onPlayerJoined(data.player);
    }
  }

  /**
   * Handle player left event
   * @param {Object} data - Player data
   */
  handlePlayerLeft(data) {
    this.players.delete(data.playerId);
    
    // Check if host left
    if (data.newHostId && data.newHostId === networkManager.connectionId) {
      this.isHost = true;
      console.log('You are now the host');
    }
    
    if (this.onPlayerLeft) {
      this.onPlayerLeft(data.playerId);
    }
  }

  /**
   * Handle room update event
   * @param {Object} data - Room update data
   */
  handleRoomUpdate(data) {
    this.currentRoom = { ...this.currentRoom, ...data.room };
    
    if (this.onRoomUpdate) {
      this.onRoomUpdate(data.room);
    }
  }

  /**
   * Handle game start event
   * @param {Object} data - Game start data
   */
  handleGameStart(data) {
    console.log('LobbySystem: handleGameStart called with data:', data);
    if (this.onGameStart) {
      console.log('LobbySystem: Calling onGameStart callback');
      this.onGameStart(data);
    } else {
      console.log('LobbySystem: No onGameStart callback registered');
    }
  }

  /**
   * Handle room error
   * @param {Object} data - Error data
   */
  handleRoomError(data) {
    console.error('Room error:', data.message);
    // Could add UI notification here
  }

  /**
   * Reset lobby state
   */
  resetLobbyState() {
    this.currentRoom = null;
    this.players.clear();
    this.isHost = false;
    this.roomSettings = {};
  }

  /**
   * Get current room info
   * @returns {Object} Room information
   */
  getRoomInfo() {
    return {
      room: this.currentRoom,
      players: Array.from(this.players.values()),
      isHost: this.isHost
    };
  }

  /**
   * Get player count
   * @returns {number} Number of players in room
   */
  getPlayerCount() {
    return this.players.size;
  }
}

// Export singleton instance
export default new LobbySystem();
