/**
 * Player Manager Module
 * Manages multiple players in multiplayer games
 * Last updated: 2025-01-24
 */

export class PlayerManager {
  constructor() {
    this.players = new Map();
    this.localPlayerId = null;
  }
  
  initializePlayers(playersData, localPlayerId) {
    this.localPlayerId = localPlayerId;
    this.players.clear();
    
    // Create player objects from server data
    Object.entries(playersData).forEach(([playerId, playerData]) => {
      this.players.set(playerId, {
        id: playerId,
        ...playerData,
        isLocal: playerId === localPlayerId,
        lastInputs: null,
        interpolatedX: playerData.x,
        interpolatedY: playerData.y,
        interpolatedAngle: playerData.angle,
        // Ensure velocity fields exist
        velocityX: playerData.velocityX || 0,
        velocityY: playerData.velocityY || 0
      });
    });
  }
  
  addPlayer(playerData) {
    if (!this.players.has(playerData.id)) {
      this.players.set(playerData.id, {
        ...playerData,
        isLocal: playerData.id === this.localPlayerId,
        lastInputs: null,
        interpolatedX: playerData.x || 640, // Default spawn position
        interpolatedY: playerData.y || 360,
        interpolatedAngle: playerData.angle || 0,
        // Ensure velocity fields exist
        velocityX: playerData.velocityX || 0,
        velocityY: playerData.velocityY || 0
      });
    }
  }
  
  removePlayer(playerId) {
    this.players.delete(playerId);
  }
  
  getPlayer(playerId) {
    return this.players.get(playerId);
  }
  
  getLocalPlayer() {
    return this.players.get(this.localPlayerId);
  }
  
  getAllPlayers() {
    return Array.from(this.players.values());
  }
  
  getAlivePlayers() {
    return this.getAllPlayers().filter(player => player.alive);
  }
  
  updateFromState(state) {
    // Update all players with server state
    Object.entries(state.players).forEach(([playerId, playerData]) => {
      const player = this.players.get(playerId);
      if (player) {
        // Don't overwrite local player position if using client prediction
        if (!player.isLocal) {
          Object.assign(player, playerData);
        } else {
          // For local player, only update non-position data
          player.health = playerData.health;
          player.score = playerData.score;
          player.alive = playerData.alive;
          player.projectileCount = playerData.projectileCount;
        }
      }
    });
  }
  
  interpolatePositions(currentTime, interpolationDelay) {
    this.players.forEach(player => {
      if (!player.isLocal) {
        // Smooth interpolation for remote players
        const deltaX = player.x - player.interpolatedX;
        const deltaY = player.y - player.interpolatedY;
        const deltaAngle = this.normalizeAngleDelta(player.angle - player.interpolatedAngle);
        
        const smoothingFactor = 0.2;
        player.interpolatedX += deltaX * smoothingFactor;
        player.interpolatedY += deltaY * smoothingFactor;
        player.interpolatedAngle += deltaAngle * smoothingFactor;
        
        // Use interpolated values for rendering
        player.renderX = player.interpolatedX;
        player.renderY = player.interpolatedY;
        player.renderAngle = player.interpolatedAngle;
      } else {
        // Local player uses actual position
        player.renderX = player.x;
        player.renderY = player.y;
        player.renderAngle = player.angle;
      }
    });
  }
  
  normalizeAngleDelta(delta) {
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    return delta;
  }
  
  getPlayerColors() {
    const colors = ['blue', 'red', 'green', 'yellow', 'purple', 'orange'];
    const usedColors = new Set(this.getAllPlayers().map(p => p.color));
    return colors.filter(color => !usedColors.has(color));
  }
}

export { PlayerManager };
