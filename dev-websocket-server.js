/**
 * Development WebSocket Server
 * For local testing of multiplayer functionality
 */

const WebSocket = require('ws');
const http = require('http');

// Create HTTP server
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Game rooms storage
const rooms = new Map();
const connections = new Map();

// Generate unique IDs
let connectionIdCounter = 0;
function generateConnectionId() {
  return `player-${++connectionIdCounter}`;
}

// Generate room codes
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  const connectionId = generateConnectionId();
  
  // Store connection
  connections.set(connectionId, {
    ws: ws,
    id: connectionId,
    roomCode: null,
    playerName: null
  });
  
  console.log(`Client connected: ${connectionId}`);
  
  // Send connection ID to client
  ws.send(JSON.stringify({
    type: 'connection-id',
    data: { id: connectionId }
  }));
  
  // Handle messages
  ws.on('message', (message) => {
    try {
      const { type, data } = JSON.parse(message);
      handleMessage(connectionId, type, data);
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
  
  // Handle disconnect
  ws.on('close', () => {
    console.log(`Client disconnected: ${connectionId}`);
    handleDisconnect(connectionId);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for ${connectionId}:`, error);
  });
  
  // Handle ping/pong
  ws.on('ping', () => {
    ws.pong();
  });
});

// Message handler
function handleMessage(connectionId, type, data) {
  const connection = connections.get(connectionId);
  if (!connection) return;
  
  switch (type) {
    case 'create-room':
      handleCreateRoom(connectionId, data);
      break;
    case 'join-room':
      handleJoinRoom(connectionId, data);
      break;
    case 'leave-room':
      handleLeaveRoom(connectionId);
      break;
    case 'start-game':
      handleStartGame(connectionId, data);
      break;
    case 'player-input':
      handlePlayerInput(connectionId, data);
      break;
    case 'ping':
      connection.ws.send(JSON.stringify({ type: 'pong', data: {} }));
      break;
    default:
      console.log(`Unknown message type: ${type}`);
  }
}

// Create room handler
function handleCreateRoom(connectionId, data) {
  const connection = connections.get(connectionId);
  const roomCode = generateRoomCode();
  
  // Create room
  const room = {
    code: roomCode,
    hostId: connectionId,
    players: new Map(),
    settings: data.gameSettings || {},
    state: 'waiting',
    gameState: null
  };
  
  // Add host to room
  const player = {
    id: connectionId,
    name: data.name || 'Player 1',
    isHost: true,
    color: 'blue',
    ready: false
  };
  
  room.players.set(connectionId, player);
  rooms.set(roomCode, room);
  
  // Update connection
  connection.roomCode = roomCode;
  connection.playerName = player.name;
  
  // Send response
  connection.ws.send(JSON.stringify({
    type: 'room-created',
    data: {
      room: {
        code: roomCode,
        settings: room.settings
      },
      playerId: connectionId,
      playerName: player.name
    }
  }));
  
  console.log(`Room created: ${roomCode} by ${connectionId}`);
}

// Join room handler
function handleJoinRoom(connectionId, data) {
  const connection = connections.get(connectionId);
  const room = rooms.get(data.roomCode);
  
  if (!room) {
    connection.ws.send(JSON.stringify({
      type: 'room-error',
      data: { message: 'Room not found' }
    }));
    return;
  }
  
  if (room.players.size >= 4) {
    connection.ws.send(JSON.stringify({
      type: 'room-error',
      data: { message: 'Room is full' }
    }));
    return;
  }
  
  // Add player to room
  const colors = ['blue', 'red', 'green', 'yellow'];
  const player = {
    id: connectionId,
    name: data.playerName || `Player ${room.players.size + 1}`,
    isHost: false,
    color: colors[room.players.size],
    ready: false
  };
  
  room.players.set(connectionId, player);
  connection.roomCode = data.roomCode;
  connection.playerName = player.name;
  
  // Send join confirmation to joining player
  connection.ws.send(JSON.stringify({
    type: 'room-joined',
    data: {
      room: {
        code: room.code,
        settings: room.settings
      },
      players: Array.from(room.players.values())
    }
  }));
  
  // Notify other players
  broadcastToRoom(room.code, {
    type: 'player-joined',
    data: { player }
  }, connectionId);
  
  console.log(`${connectionId} joined room ${data.roomCode}`);
}

// Leave room handler
function handleLeaveRoom(connectionId) {
  const connection = connections.get(connectionId);
  if (!connection || !connection.roomCode) return;
  
  const room = rooms.get(connection.roomCode);
  if (!room) return;
  
  // Remove player
  room.players.delete(connectionId);
  
  // If room is empty, delete it
  if (room.players.size === 0) {
    rooms.delete(room.code);
    console.log(`Room ${room.code} deleted (empty)`);
    return;
  }
  
  // If host left, assign new host
  let newHostId = null;
  if (room.hostId === connectionId) {
    const newHost = room.players.values().next().value;
    newHost.isHost = true;
    room.hostId = newHost.id;
    newHostId = newHost.id;
  }
  
  // Notify remaining players
  broadcastToRoom(room.code, {
    type: 'player-left',
    data: { 
      playerId: connectionId,
      newHostId: newHostId
    }
  });
  
  // Clear connection room info
  connection.roomCode = null;
  
  console.log(`${connectionId} left room ${room.code}`);
}

// Start game handler
function handleStartGame(connectionId, data) {
  const room = rooms.get(data.roomCode);
  if (!room || room.hostId !== connectionId) return;
  
  if (room.players.size < 2) {
    const connection = connections.get(connectionId);
    connection.ws.send(JSON.stringify({
      type: 'room-error',
      data: { message: 'Need at least 2 players to start' }
    }));
    return;
  }
  
  room.state = 'playing';
  
  // Initialize game state with proper spacing
  const playerCount = room.players.size;
  const centerX = 640; // Canvas center
  const centerY = 360; // Canvas center
  const radius = 200; // Spawn radius
  
  room.gameState = {
    players: {},
    projectiles: [],
    timestamp: Date.now(),
    settings: room.settings
  };
  
  // Initialize player states with circular positioning
  let index = 0;
  room.players.forEach((player, id) => {
    const angle = (index / playerCount) * Math.PI * 2;
    room.gameState.players[id] = {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      angle: angle + Math.PI, // Face center
      velocityX: 0,
      velocityY: 0,
      health: 100,
      score: 0,
      color: player.color,
      name: player.name,
      alive: true,
      inputs: {
        thrust: false,
        rotateLeft: false,
        rotateRight: false,
        fire: false
      },
      lastFireTime: 0,
      projectileCount: 0
    };
    index++;
  });
  
  // Start game loop
  startGameLoop(room.code);
  
  // Notify all players
  broadcastToRoom(room.code, {
    type: 'game-starting',
    data: {
      gameState: room.gameState,
      settings: room.settings
    }
  });
  
  console.log(`Game started in room ${room.code}`);
}

// Player input handler
function handlePlayerInput(connectionId, data) {
  const connection = connections.get(connectionId);
  if (!connection || !connection.roomCode) return;
  
  const room = rooms.get(connection.roomCode);
  if (!room || room.state !== 'playing') return;
  
  const playerState = room.gameState.players[connectionId];
  if (!playerState || !playerState.alive) return;
  
  // Update player inputs
  playerState.inputs = data.input;
  
  // Send acknowledgment with server timestamp
  connection.ws.send(JSON.stringify({
    type: 'input-ack',
    data: {
      sequence: data.sequence,
      serverTime: Date.now()
    }
  }));
}

// Handle disconnect
function handleDisconnect(connectionId) {
  const connection = connections.get(connectionId);
  if (connection && connection.roomCode) {
    handleLeaveRoom(connectionId);
  }
  connections.delete(connectionId);
}

// Game loop management
const gameLoops = new Map();

function startGameLoop(roomCode) {
  // Run game loop at 60 FPS
  const interval = setInterval(() => {
    updateGameState(roomCode);
  }, 1000 / 60);
  
  gameLoops.set(roomCode, interval);
}

function stopGameLoop(roomCode) {
  const interval = gameLoops.get(roomCode);
  if (interval) {
    clearInterval(interval);
    gameLoops.delete(roomCode);
  }
}

// Update game state
function updateGameState(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.state !== 'playing') {
    stopGameLoop(roomCode);
    return;
  }
  
  const gameState = room.gameState;
  const settings = room.settings;
  const deltaTime = 1 / 60; // Fixed timestep
  
  // Update each player
  Object.entries(gameState.players).forEach(([playerId, player]) => {
    if (!player.alive) return;
    
    // Apply inputs
    if (player.inputs.rotateLeft) {
      player.angle -= settings.rotationSpeed || 5 * deltaTime;
    }
    if (player.inputs.rotateRight) {
      player.angle += settings.rotationSpeed || 5 * deltaTime;
    }
    
    if (player.inputs.thrust) {
      const thrustPower = settings.thrustPower || 500;
      player.velocityX += Math.cos(player.angle) * thrustPower * deltaTime;
      player.velocityY += Math.sin(player.angle) * thrustPower * deltaTime;
    }
    
    // Apply gravity
    applyGravity(player, settings, deltaTime);
    
    // Apply air resistance
    const airResistance = settings.airResistance || 0.99;
    player.velocityX *= airResistance;
    player.velocityY *= airResistance;
    
    // Apply max speed if enabled
    if (settings.maxSpeedEnabled) {
      const maxSpeed = settings.maxSpeed || 300;
      const speed = Math.sqrt(player.velocityX ** 2 + player.velocityY ** 2);
      if (speed > maxSpeed) {
        player.velocityX = (player.velocityX / speed) * maxSpeed;
        player.velocityY = (player.velocityY / speed) * maxSpeed;
      }
    }
    
    // Update position
    player.x += player.velocityX * deltaTime;
    player.y += player.velocityY * deltaTime;
    
    // Boundary check
    const canvasWidth = 1280;
    const canvasHeight = 720;
    
    if (player.x < 20) {
      player.x = 20;
      player.velocityX = Math.abs(player.velocityX) * 0.5;
    } else if (player.x > canvasWidth - 20) {
      player.x = canvasWidth - 20;
      player.velocityX = -Math.abs(player.velocityX) * 0.5;
    }
    
    if (player.y < 20) {
      player.y = 20;
      player.velocityY = Math.abs(player.velocityY) * 0.5;
    } else if (player.y > canvasHeight - 20) {
      player.y = canvasHeight - 20;
      player.velocityY = -Math.abs(player.velocityY) * 0.5;
    }
    
    // Handle firing
    if (player.inputs.fire) {
      fireProjectile(gameState, playerId, player, settings);
    }
  });
  
  // Update projectiles
  updateProjectiles(gameState, settings, deltaTime);
  
  // Check collisions
  checkCollisions(gameState);
  
  // Check win condition
  const alivePlayers = Object.values(gameState.players).filter(p => p.alive);
  if (alivePlayers.length <= 1) {
    handleGameEnd(roomCode, alivePlayers[0]);
    return;
  }
  
  // Broadcast state update
  broadcastToRoom(roomCode, {
    type: 'game-state-update',
    data: {
      players: gameState.players,
      projectiles: gameState.projectiles,
      timestamp: Date.now()
    }
  });
}

// Apply gravity based on settings
function applyGravity(player, settings, deltaTime) {
  const gravityType = settings.gravityType || 'point';
  const gravityStrength = settings.gravityStrength || 200;
  
  switch (gravityType) {
    case 'point':
      const gravityX = (settings.gravityPointX || 0.5) * 1280;
      const gravityY = (settings.gravityPointY || 0.5) * 720;
      const dx = gravityX - player.x;
      const dy = gravityY - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const force = gravityStrength / Math.max(distance, 50);
        player.velocityX += (dx / distance) * force * deltaTime;
        player.velocityY += (dy / distance) * force * deltaTime;
      }
      break;
      
    case 'side':
      const direction = settings.gravityDirection || 'bottom';
      switch (direction) {
        case 'bottom':
          player.velocityY += gravityStrength * deltaTime;
          break;
        case 'top':
          player.velocityY -= gravityStrength * deltaTime;
          break;
        case 'left':
          player.velocityX -= gravityStrength * deltaTime;
          break;
        case 'right':
          player.velocityX += gravityStrength * deltaTime;
          break;
      }
      break;
      
    case 'none':
      // No gravity
      break;
  }
}

// Fire projectile
function fireProjectile(gameState, playerId, player, settings) {
  const now = Date.now();
  const fireDelay = 500; // 500ms between shots
  const maxProjectiles = settings.maxProjectiles || 3;
  
  if (now - player.lastFireTime < fireDelay) return;
  if (player.projectileCount >= maxProjectiles) return;
  
  const projectileSpeed = settings.projectileSpeed || 400;
  const projectile = {
    id: `${playerId}-${now}`,
    ownerId: playerId,
    x: player.x + Math.cos(player.angle) * 30,
    y: player.y + Math.sin(player.angle) * 30,
    velocityX: Math.cos(player.angle) * projectileSpeed + player.velocityX * 0.5,
    velocityY: Math.sin(player.angle) * projectileSpeed + player.velocityY * 0.5,
    lifetime: 3000 // 3 seconds
  };
  
  gameState.projectiles.push(projectile);
  player.lastFireTime = now;
  player.projectileCount++;
}

// Update projectiles
function updateProjectiles(gameState, settings, deltaTime) {
  const now = Date.now();
  
  gameState.projectiles = gameState.projectiles.filter(projectile => {
    // Apply gravity to projectiles
    const player = { 
      x: projectile.x, 
      y: projectile.y,
      velocityX: projectile.velocityX,
      velocityY: projectile.velocityY
    };
    applyGravity(player, settings, deltaTime);
    projectile.velocityX = player.velocityX;
    projectile.velocityY = player.velocityY;
    
    // Update position
    projectile.x += projectile.velocityX * deltaTime;
    projectile.y += projectile.velocityY * deltaTime;
    
    // Check boundaries
    if (projectile.x < 0 || projectile.x > 1280 || 
        projectile.y < 0 || projectile.y > 720) {
      const owner = gameState.players[projectile.ownerId];
      if (owner) owner.projectileCount--;
      return false;
    }
    
    // Check lifetime
    projectile.lifetime -= deltaTime * 1000;
    if (projectile.lifetime <= 0) {
      const owner = gameState.players[projectile.ownerId];
      if (owner) owner.projectileCount--;
      return false;
    }
    
    return true;
  });
}

// Check collisions
function checkCollisions(gameState) {
  // Check projectile-player collisions
  gameState.projectiles = gameState.projectiles.filter(projectile => {
    for (const [playerId, player] of Object.entries(gameState.players)) {
      if (!player.alive || playerId === projectile.ownerId) continue;
      
      const dx = projectile.x - player.x;
      const dy = projectile.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 20) { // Hit radius
        player.health -= 20;
        if (player.health <= 0) {
          player.alive = false;
          player.health = 0;
          
          // Award kill to shooter
          const shooter = gameState.players[projectile.ownerId];
          if (shooter) shooter.score++;
        }
        
        // Remove projectile
        const owner = gameState.players[projectile.ownerId];
        if (owner) owner.projectileCount--;
        return false;
      }
    }
    return true;
  });
}

// Handle game end
function handleGameEnd(roomCode, winner) {
  const room = rooms.get(roomCode);
  if (!room) return;
  
  room.state = 'ended';
  stopGameLoop(roomCode);
  
  broadcastToRoom(roomCode, {
    type: 'game-ended',
    data: {
      winner: winner ? {
        id: Object.keys(room.gameState.players).find(id => 
          room.gameState.players[id] === winner
        ),
        name: winner.name,
        score: winner.score
      } : null
    }
  });
  
  console.log(`Game ended in room ${roomCode}`);
}

// Broadcast to all players in a room
function broadcastToRoom(roomCode, message, excludeId = null) {
  const room = rooms.get(roomCode);
  if (!room) return;
  
  const messageStr = JSON.stringify(message);
  room.players.forEach((player, playerId) => {
    if (playerId !== excludeId) {
      const connection = connections.get(playerId);
      if (connection && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(messageStr);
      }
    }
  });
}

// Start server
const PORT = process.env.WS_PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});
