/**
 * Game State Synchronization Module
 * Handles synchronization of game state between clients and server
 * Last updated: 2025-01-24
 */

export class GameStateSync {
  constructor(game) {
    this.game = game;
    this.localState = {};
    this.serverState = {};
    this.playerId = null;
    this.isHost = false;
    
    // Prediction and reconciliation
    this.inputSequence = 0;
    this.pendingInputs = [];
    this.lastProcessedInput = 0;
    
    // Interpolation
    this.stateBuffer = [];
    this.interpolationDelay = 100; // ms
    
    // Callbacks
    this.onStateUpdate = null;
    this.onPlayerUpdate = null;
  }

  /**
   * Initialize sync for a player
   * @param {string} playerId - Player ID
   * @param {boolean} isHost - Whether this player is host
   */
  init(playerId, isHost = false) {
    this.playerId = playerId;
    this.isHost = isHost;
    this.reset();
  }

  /**
   * Send player input to server
   * @param {Object} input - Input data
   */
  sendInput(input) {
    const sequenceNumber = ++this.inputSequence;
    const inputData = {
      sequence: sequenceNumber,
      input: input,
      timestamp: Date.now()
    };
    
    // Store pending input for reconciliation
    this.pendingInputs.push(inputData);
    
    // Send to server using the game's network manager
    if (this.game && this.game.networkManager) {
      this.game.networkManager.send('player-input', inputData);
    }
    
    return sequenceNumber;
  }

  /**
   * Update local state (for prediction)
   * @param {Object} state - New state
   */
  updateLocalState(state) {
    this.localState = { ...state };
  }

  /**
   * Handle state update from server
   * @param {Object} data - State update data
   */
  handleStateUpdate(data) {
    const { state, timestamp, lastProcessedInput } = data;
    
    // Add to state buffer for interpolation
    this.stateBuffer.push({
      state: state,
      timestamp: timestamp
    });
    
    // Keep only recent states (last 1 second)
    const cutoffTime = Date.now() - 1000;
    this.stateBuffer = this.stateBuffer.filter(s => s.timestamp > cutoffTime);
    
    // Update server state
    this.serverState = state;
    
    // Reconciliation: remove acknowledged inputs
    if (lastProcessedInput) {
      this.lastProcessedInput = lastProcessedInput;
      this.pendingInputs = this.pendingInputs.filter(
        input => input.sequence > lastProcessedInput
      );
    }
    
    if (this.onStateUpdate) {
      this.onStateUpdate(state);
    }
  }

  /**
   * Handle player-specific update
   * @param {Object} data - Player update data
   */
  handlePlayerUpdate(data) {
    if (this.onPlayerUpdate) {
      this.onPlayerUpdate(data);
    }
  }

  /**
   * Handle input acknowledgment
   * @param {Object} data - Acknowledgment data
   */
  handleInputAck(data) {
    this.lastProcessedInput = data.sequence;
  }

  /**
   * Get interpolated state at current time
   * @returns {Object} Interpolated state
   */
  getInterpolatedState(stateBuffer, renderTime) {
    // If stateBuffer is provided, use it; otherwise use this.stateBuffer
    const buffer = stateBuffer || this.stateBuffer;
    const time = renderTime || (Date.now() - this.interpolationDelay);
    
    // Find states to interpolate between
    let previousState = null;
    let nextState = null;
    
    for (let i = 0; i < buffer.length - 1; i++) {
      if (buffer[i].timestamp <= time &&
          buffer[i + 1].timestamp >= time) {
        previousState = buffer[i];
        nextState = buffer[i + 1];
        break;
      }
    }
    
    // If we have both states, interpolate
    if (previousState && nextState) {
      const total = nextState.timestamp - previousState.timestamp;
      const progress = time - previousState.timestamp;
      const ratio = progress / total;
      
      const prevState = previousState.state || previousState;
      const nextSt = nextState.state || nextState;
      
      return this.interpolateStates(prevState, nextSt, ratio);
    }
    
    // Otherwise, return latest state
    if (buffer.length > 0) {
      const latest = buffer[buffer.length - 1];
      return latest.state || latest;
    }
    
    return this.serverState;
  }

  /**
   * Interpolate between two states
   * @param {Object} stateA - First state
   * @param {Object} stateB - Second state
   * @param {number} ratio - Interpolation ratio (0-1)
   * @returns {Object} Interpolated state
   */
  interpolateStates(stateA, stateB, ratio) {
    const interpolated = {};
    
    // Interpolate player positions
    if (stateA.players && stateB.players) {
      interpolated.players = {};
      
      for (const playerId in stateA.players) {
        if (stateB.players[playerId]) {
          const playerA = stateA.players[playerId];
          const playerB = stateB.players[playerId];
          
          interpolated.players[playerId] = {
            x: playerA.x + (playerB.x - playerA.x) * ratio,
            y: playerA.y + (playerB.y - playerA.y) * ratio,
            angle: this.interpolateAngle(playerA.angle, playerB.angle, ratio),
            // Copy non-interpolated values
            health: playerB.health,
            score: playerB.score,
            alive: playerB.alive,
            color: playerB.color,
            name: playerB.name
          };
        }
      }
    }
    
    // Interpolate projectiles
    if (stateA.projectiles && stateB.projectiles) {
      interpolated.projectiles = this.interpolateProjectiles(
        stateA.projectiles,
        stateB.projectiles,
        ratio
      );
    }
    
    return interpolated;
  }

  /**
   * Interpolate angle (handling wrap-around)
   * @param {number} a - Start angle
   * @param {number} b - End angle
   * @param {number} ratio - Interpolation ratio
   * @returns {number} Interpolated angle
   */
  interpolateAngle(a, b, ratio) {
    const diff = b - a;
    if (diff > Math.PI) {
      b -= 2 * Math.PI;
    } else if (diff < -Math.PI) {
      b += 2 * Math.PI;
    }
    return a + (b - a) * ratio;
  }

  /**
   * Interpolate projectiles
   */
  interpolateProjectiles(projectilesA, projectilesB, ratio) {
    const interpolated = [];
    
    // Simple interpolation - match by ID
    projectilesA.forEach(projA => {
      const projB = projectilesB.find(p => p.id === projA.id);
      if (projB) {
        interpolated.push({
          id: projA.id,
          x: projA.x + (projB.x - projA.x) * ratio,
          y: projA.y + (projB.y - projA.y) * ratio
        });
      }
    });
    
    return interpolated;
  }

  /**
   * Reset synchronization state
   */
  reset() {
    this.localState = {};
    this.serverState = {};
    this.inputSequence = 0;
    this.pendingInputs = [];
    this.lastProcessedInput = 0;
    this.stateBuffer = [];
  }

  /**
   * Get pending inputs for reconciliation
   * @returns {Array} Pending inputs
   */
  getPendingInputs() {
    return this.pendingInputs;
  }
  
  /**
   * Apply client-side prediction
   * @param {Object} player - Player object
   * @param {Object} inputs - Input state
   * @param {number} deltaTime - Time delta
   */
  applyClientPrediction(player, inputs, deltaTime) {
    // This method needs access to game physics, so it should be implemented
    // in the game instance that has access to physics
    // For now, we'll do basic prediction
    
    const rotationSpeed = 5; // radians per second
    const thrustPower = 500; // pixels per second²
    const airResistance = 0.99;
    
    // Apply rotation
    if (inputs.rotateLeft) {
      player.angle -= rotationSpeed * deltaTime;
    }
    if (inputs.rotateRight) {
      player.angle += rotationSpeed * deltaTime;
    }
    
    // Apply thrust
    if (inputs.thrust) {
      player.velocityX += Math.cos(player.angle) * thrustPower * deltaTime;
      player.velocityY += Math.sin(player.angle) * thrustPower * deltaTime;
    }
    
    // Basic physics
    player.velocityX *= Math.pow(airResistance, deltaTime * 60);
    player.velocityY *= Math.pow(airResistance, deltaTime * 60);
    
    // Update position
    player.x += player.velocityX * deltaTime;
    player.y += player.velocityY * deltaTime;
    
    // Boundary check
    const canvasWidth = 1280;
    const canvasHeight = 720;
    const margin = 20;
    
    player.x = Math.max(margin, Math.min(canvasWidth - margin, player.x));
    player.y = Math.max(margin, Math.min(canvasHeight - margin, player.y));
  }
}

// Use default export to avoid Parcel redefinition issues
export default GameStateSync;
