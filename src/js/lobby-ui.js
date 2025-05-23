/**
 * Lobby UI Module
 * Handles the user interface for multiplayer lobby functionality
 * Last updated: 2025-01-24
 */

import lobbySystem from './lobby-system.js';
import networkManager from './network-manager.js';

export class LobbyUI {
  constructor() {
    this.lobbyContainer = null;
    this.isVisible = false;
    
    // UI elements
    this.elements = {
      container: null,
      createButton: null,
      joinButton: null,
      roomCodeInput: null,
      playerNameInput: null,
      playersList: null,
      roomInfo: null,
      startButton: null,
      leaveButton: null,
      statusMessage: null
    };
    
    this.setupLobbyHandlers();
  }

  /**
   * Initialize the lobby UI
   */
  init() {
    this.createLobbyHTML();
    this.attachEventListeners();
    this.hide(); // Initially hidden
  }

  /**
   * Create lobby HTML structure
   */
  createLobbyHTML() {
    // Create main container
    const lobbyDiv = document.createElement('div');
    lobbyDiv.id = 'lobby-container';
    lobbyDiv.className = 'lobby-container hidden';
    lobbyDiv.innerHTML = `
      <div class="lobby-content">
        <h2>Multiplayer Lobby</h2>
        
        <div id="lobby-connection-status" class="connection-status">
          <span class="status-indicator"></span>
          <span class="status-text">Connecting...</span>
        </div>
        
        <div id="lobby-main" class="lobby-section">
          <div class="player-info">
            <input type="text" id="player-name-input" placeholder="Enter your name" maxlength="20" />
          </div>
          
          <div class="lobby-actions">
            <button id="create-room-btn" class="lobby-btn">Create Room</button>
            <div class="join-room">
              <input type="text" id="room-code-input" placeholder="Room Code" maxlength="6" />
              <button id="join-room-btn" class="lobby-btn">Join Room</button>
            </div>
          </div>
        </div>
        
        <div id="lobby-room" class="lobby-section hidden">
          <div id="room-info" class="room-info">
            <h3>Room: <span id="room-code-display"></span></h3>
            <button id="copy-code-btn" class="small-btn">Copy Code</button>
          </div>
          
          <div id="players-list" class="players-list">
            <h4>Players:</h4>
            <ul id="players-ul"></ul>
          </div>
          
          <div class="room-controls">
            <button id="start-game-btn" class="lobby-btn primary hidden">Start Game</button>
            <button id="leave-room-btn" class="lobby-btn secondary">Leave Room</button>
          </div>
        </div>
        
        <div id="lobby-status" class="status-message"></div>
        
        <button id="back-to-menu-btn" class="lobby-btn">Back to Menu</button>
      </div>
    `;
    
    document.body.appendChild(lobbyDiv);
    this.lobbyContainer = lobbyDiv;
    
    // Store references to elements
    this.elements.container = lobbyDiv;
    this.elements.createButton = lobbyDiv.querySelector('#create-room-btn');
    this.elements.joinButton = lobbyDiv.querySelector('#join-room-btn');
    this.elements.roomCodeInput = lobbyDiv.querySelector('#room-code-input');
    this.elements.playerNameInput = lobbyDiv.querySelector('#player-name-input');
    this.elements.playersList = lobbyDiv.querySelector('#players-ul');
    this.elements.roomInfo = lobbyDiv.querySelector('#room-info');
    this.elements.startButton = lobbyDiv.querySelector('#start-game-btn');
    this.elements.leaveButton = lobbyDiv.querySelector('#leave-room-btn');
    this.elements.statusMessage = lobbyDiv.querySelector('#lobby-status');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Create room button
    this.elements.createButton.addEventListener('click', () => {
      const playerName = this.elements.playerNameInput.value.trim();
      if (!playerName) {
        this.showStatus('Please enter your name', 'error');
        return;
      }
      this.createRoom(playerName);
    });
    
    // Join room button
    this.elements.joinButton.addEventListener('click', () => {
      const playerName = this.elements.playerNameInput.value.trim();
      const roomCode = this.elements.roomCodeInput.value.trim().toUpperCase();
      
      if (!playerName) {
        this.showStatus('Please enter your name', 'error');
        return;
      }
      
      if (!roomCode) {
        this.showStatus('Please enter a room code', 'error');
        return;
      }
      
      this.joinRoom(roomCode, playerName);
    });
    
    // Start game button
    this.elements.startButton.addEventListener('click', () => {
      lobbySystem.startGame();
    });
    
    // Leave room button
    this.elements.leaveButton.addEventListener('click', () => {
      this.leaveRoom();
    });
    
    // Back to menu button
    const backButton = this.lobbyContainer.querySelector('#back-to-menu-btn');
    backButton.addEventListener('click', () => {
      this.hide();
      // Trigger menu show event
      window.dispatchEvent(new CustomEvent('showMenu'));
    });
    
    // Copy room code button
    const copyButton = this.lobbyContainer.querySelector('#copy-code-btn');
    copyButton.addEventListener('click', () => {
      const roomCode = this.lobbyContainer.querySelector('#room-code-display').textContent;
      navigator.clipboard.writeText(roomCode).then(() => {
        this.showStatus('Room code copied!', 'success');
      });
    });
    
    // Enter key handling
    this.elements.roomCodeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.elements.joinButton.click();
      }
    });
    
    this.elements.playerNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !this.elements.roomCodeInput.value) {
        this.elements.createButton.click();
      }
    });
  }

  /**
   * Set up lobby system handlers
   */
  setupLobbyHandlers() {
    // Network connection handlers
    networkManager.onConnect = () => {
      this.updateConnectionStatus(true);
    };
    
    networkManager.onDisconnect = () => {
      this.updateConnectionStatus(false);
      this.showMainLobby();
    };
    
    // Lobby system handlers
    lobbySystem.onRoomCreated = (data) => {
      this.showRoomLobby(data.room);
      this.showStatus('Room created successfully!', 'success');
    };
    
    lobbySystem.onRoomJoined = (data) => {
      this.showRoomLobby(data.room);
      this.updatePlayersList(data.players);
      this.showStatus('Joined room successfully!', 'success');
    };
    
    lobbySystem.onPlayerJoined = (player) => {
      this.addPlayerToList(player);
      this.showStatus(`${player.name} joined the room`, 'info');
    };
    
    lobbySystem.onPlayerLeft = (playerId) => {
      this.removePlayerFromList(playerId);
    };
    
    lobbySystem.onGameStart = (gameData) => {
      console.log('LobbyUI: onGameStart called with gameData:', gameData);
      this.hide();
      // Trigger event to start multiplayer game
      window.dispatchEvent(new CustomEvent('startMultiplayerGame', {
        detail: {
          roomCode: lobbySystem.currentRoom?.code,
          networkManager: networkManager,
          gameData: gameData
        }
      }));
    };
  }

  /**
   * Show the lobby UI
   */
  show() {
    this.lobbyContainer.classList.remove('hidden');
    this.isVisible = true;
    
    // Connect to server if not already connected
    if (!networkManager.isConnected()) {
      this.connectToServer();
    }
  }

  /**
   * Hide the lobby UI
   */
  hide() {
    this.lobbyContainer.classList.add('hidden');
    this.isVisible = false;
  }

  /**
   * Connect to game server
   */
  connectToServer() {
    // For local development, connect to localhost
    // In production, this would be your Netlify function URL
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? `wss://${window.location.host}/.netlify/functions/game-server`
      : 'ws://localhost:3001';
    
    networkManager.connect(wsUrl);
  }

  /**
   * Create a new room
   */
  createRoom(playerName) {
    // Store player name for later use
    localStorage.setItem('playerName', playerName);
    
    lobbySystem.createRoom({
      name: `${playerName}'s Room`,
      maxPlayers: 4
    });
  }

  /**
   * Join an existing room
   */
  joinRoom(roomCode, playerName) {
    localStorage.setItem('playerName', playerName);
    lobbySystem.joinRoom(roomCode, playerName);
  }

  /**
   * Leave current room
   */
  leaveRoom() {
    lobbySystem.leaveRoom();
    this.showMainLobby();
  }

  /**
   * Update connection status display
   */
  updateConnectionStatus(connected) {
    const statusEl = this.lobbyContainer.querySelector('#lobby-connection-status');
    const indicator = statusEl.querySelector('.status-indicator');
    const text = statusEl.querySelector('.status-text');
    
    if (connected) {
      indicator.classList.add('connected');
      text.textContent = 'Connected';
    } else {
      indicator.classList.remove('connected');
      text.textContent = 'Disconnected';
    }
  }

  /**
   * Show main lobby view
   */
  showMainLobby() {
    this.lobbyContainer.querySelector('#lobby-main').classList.remove('hidden');
    this.lobbyContainer.querySelector('#lobby-room').classList.add('hidden');
  }

  /**
   * Show room lobby view
   */
  showRoomLobby(room) {
    this.lobbyContainer.querySelector('#lobby-main').classList.add('hidden');
    this.lobbyContainer.querySelector('#lobby-room').classList.remove('hidden');
    
    // Update room code display
    this.lobbyContainer.querySelector('#room-code-display').textContent = room.code;
    
    // Show start button for host
    if (lobbySystem.isHost) {
      this.elements.startButton.classList.remove('hidden');
    }
  }

  /**
   * Update players list
   */
  updatePlayersList(players) {
    this.elements.playersList.innerHTML = '';
    players.forEach(player => this.addPlayerToList(player));
  }

  /**
   * Add player to list
   */
  addPlayerToList(player) {
    const li = document.createElement('li');
    li.dataset.playerId = player.id;
    li.innerHTML = `
      <span class="player-color" style="background-color: ${player.color}"></span>
      <span class="player-name">${player.name}</span>
      ${player.isHost ? '<span class="host-badge">Host</span>' : ''}
    `;
    this.elements.playersList.appendChild(li);
  }

  /**
   * Remove player from list
   */
  removePlayerFromList(playerId) {
    const playerEl = this.elements.playersList.querySelector(`[data-player-id="${playerId}"]`);
    if (playerEl) {
      playerEl.remove();
    }
  }

  /**
   * Show status message
   */
  showStatus(message, type = 'info') {
    this.elements.statusMessage.textContent = message;
    this.elements.statusMessage.className = `status-message ${type}`;
    
    // Clear message after 3 seconds
    setTimeout(() => {
      this.elements.statusMessage.textContent = '';
      this.elements.statusMessage.className = 'status-message';
    }, 3000);
  }
}

// Export singleton instance
export default new LobbyUI();
