/**
 * Multiplayer Game Module
 * Extends the base game.js for online multiplayer functionality
 */

import { Game } from './game.js';
import { NetworkManager } from './network-manager.js';
import { GameStateSync } from './game-state-sync.js';
import { PlayerManager } from './player-manager.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';

export class MultiplayerGame extends Game {
  constructor(canvas, config, networkManager, roomCode) {
    super(canvas, config);
    
    this.networkManager = networkManager;
    this.roomCode = roomCode;
    this.playerId = null;
    this.playerManager = new PlayerManager();
    this.gameStateSync = new GameStateSync(this);
    this.isHost = false;
    this.gameStarted = false;
    
    // Override single player components
    this.spaceships = [];
    this.projectiles = [];
    
    // Network state
    this.lastStateUpdate = 0;
    this.interpolationDelay = 100; // 100ms interpolation delay
    this.stateBuffer = [];
    
    // Setup network event handlers
    this.setupNetworkHandlers();
  }
  
  setupNetworkHandlers() {
    // Handle game starting
    this.networkManager.on('game-starting', (data) => {
      this.handleGameStart(data);
    });
    
    // Handle state updates
    this.networkManager.on('game-state-update', (data) => {
      this.handleStateUpdate(data);
    });
    
    // Handle player events
    this.networkManager.on('player-joined', (data) => {
      console.log('Player joined:', data.player);
      this.playerManager.addPlayer(data.player);
    });
    
    this.networkManager.on('player-left', (data) => {
      console.log('Player left:', data.playerId);
      this.playerManager.removePlayer(data.playerId);
      if (data.newHostId === this.playerId) {
        this.isHost = true;
        console.log('You are now the host');
      }
    });
    
    // Handle game end
    this.networkManager.on('game-ended', (data) => {
      this.handleGameEnd(data);
    });
    
    // Handle input acknowledgments
    this.networkManager.on('input-ack', (data) => {
      this.gameStateSync.handleInputAck(data);
    });
  }
  
  handleGameStart(data) {
    console.log('Game starting with state:', data);
    
    this.gameStarted = true;
    this.gameState = data.gameState;
    this.config = { ...this.config, ...data.settings };
    
    // Get our player ID from the network manager
    this.playerId = this.networkManager.getPlayerId();
    
    // Initialize players
    this.playerManager.initializePlayers(data.gameState.players, this.playerId);
    
    // Start the game
    this.state = 'playing';
    this.start();
  }
  
  handleStateUpdate(data) {
    // Add state to buffer for interpolation
    this.stateBuffer.push({
      timestamp: data.timestamp,
      players: data.players,
      projectiles: data.projectiles
    });
    
    // Remove old states
    const now = Date.now();
    const renderTime = now - this.interpolationDelay;
    this.stateBuffer = this.stateBuffer.filter(state => 
      state.timestamp > renderTime - 1000
    );
    
    // Update game state
    this.lastStateUpdate = now;
  }
  
  handleGameEnd(data) {
    this.state = 'gameOver';
    this.gameStarted = false;
    
    // Show winner
    const message = data.winner 
      ? `${data.winner.name} wins with ${data.winner.score} kills!`
      : 'Game Over - Draw!';
    
    // Display game over UI
    const gameOverDiv = document.createElement('div');
    gameOverDiv.className = 'game-over-screen';
    gameOverDiv.innerHTML = `
      <h2>${message}</h2>
      <button id="return-to-lobby">Return to Lobby</button>
    `;
    document.body.appendChild(gameOverDiv);
    
    // Handle return to lobby
    document.getElementById('return-to-lobby').addEventListener('click', () => {
      gameOverDiv.remove();
      this.stop();
      this.networkManager.leaveRoom();
      // Trigger return to lobby UI
      window.dispatchEvent(new Event('return-to-lobby'));
    });
  }
  
  update(deltaTime) {
    if (this.state !== 'playing' || !this.gameStarted) return;
    
    // Get interpolated state
    const interpolatedState = this.gameStateSync.getInterpolatedState(
      this.stateBuffer,
      Date.now() - this.interpolationDelay
    );
    
    if (interpolatedState) {
      // Update all players with interpolated positions
      this.playerManager.updateFromState(interpolatedState);
      
      // Update projectiles
      this.projectiles = interpolatedState.projectiles || [];
    }
    
    // Handle local input
    const localPlayer = this.playerManager.getLocalPlayer();
    if (localPlayer) {
      // Send input to server
      const inputs = this.input.getMultiplayerInputs(this.playerId);
      if (this.hasInputChanged(inputs, localPlayer.lastInputs)) {
        this.networkManager.sendPlayerInput(inputs);
        localPlayer.lastInputs = { ...inputs };
      }
      
      // Apply client-side prediction
      this.gameStateSync.applyClientPrediction(localPlayer, inputs, deltaTime);
    }
    
    // Update UI
    this.updateUI();
  }
  
  hasInputChanged(newInputs, oldInputs) {
    if (!oldInputs) return true;
    return Object.keys(newInputs).some(key => newInputs[key] !== oldInputs[key]);
  }
  
  render() {
    if (this.state !== 'playing') return;
    
    this.renderer.clear();
    
    // Render gravity
    this.renderer.drawGravity(this.physics);
    
    // Render all players
    this.playerManager.getAllPlayers().forEach(player => {
      if (player.alive) {
        this.renderer.drawSpaceship(
          player.x,
          player.y,
          player.angle,
          player.color,
          player.id === this.playerId
        );
        
        // Draw player name
        this.renderer.drawPlayerName(player.x, player.y - 30, player.name);
      }
    });
    
    // Render projectiles
    this.projectiles.forEach(projectile => {
      this.renderer.drawProjectile(projectile.x, projectile.y);
    });
  }
  
  updateUI() {
    // Update health bars for all players
    const players = this.playerManager.getAllPlayers();
    const healthData = players.map(player => ({
      health: player.health,
      maxHealth: 100,
      color: player.color,
      name: player.name
    }));
    
    this.ui.updateMultiplayerHealth(healthData);
  }
  
  pause() {
    // In multiplayer, pausing returns to menu but stays connected
    this.state = 'paused';
    this.stop();
  }
  
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
