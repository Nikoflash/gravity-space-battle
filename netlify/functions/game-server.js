/**
 * Game Server Function
 * Handles WebSocket connections and game state management
 */

// In-memory storage for active games and connections
// Note: This will reset when the function cold starts
const games = new Map();
const connections = new Map();

/**
 * Generate a unique room code
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Main handler function
 */
export async function handler(event, context) {
  const { httpMethod, path, headers, body } = event;
  
  // Handle CORS preflight
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    };
  }

  // For now, return a simple response
  // WebSocket handling will be implemented with a WebSocket library
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      message: 'Game server is running',
      timestamp: new Date().toISOString()
    })
  };
}

/**
 * Create a new game room
 */
function createRoom(hostId, settings) {
  const roomCode = generateRoomCode();
  const room = {
    code: roomCode,
    hostId: hostId,
    players: new Map(),
    settings: settings,
    state: 'waiting', // waiting, playing, finished
    createdAt: Date.now()
  };
  
  games.set(roomCode, room);
  return room;
}

/**
 * Join an existing room
 */
function joinRoom(roomCode, playerId, playerName) {
  const room = games.get(roomCode);
  if (!room) {
    throw new Error('Room not found');
  }
  
  if (room.players.size >= room.settings.maxPlayers) {
    throw new Error('Room is full');
  }
  
  if (room.state !== 'waiting') {
    throw new Error('Game already in progress');
  }
  
  const player = {
    id: playerId,
    name: playerName,
    isHost: playerId === room.hostId,
    color: getPlayerColor(room.players.size),
    ready: false
  };
  
  room.players.set(playerId, player);
  return { room, player };
}

/**
 * Get player color based on index
 */
function getPlayerColor(index) {
  const colors = ['blue', 'red', 'green', 'yellow', 'purple', 'orange'];
  return colors[index % colors.length];
}

/**
 * Remove player from room
 */
function removePlayer(roomCode, playerId) {
  const room = games.get(roomCode);
  if (!room) return;
  
  room.players.delete(playerId);
  
  // If room is empty, delete it
  if (room.players.size === 0) {
    games.delete(roomCode);
    return null;
  }
  
  // If host left, assign new host
  if (room.hostId === playerId && room.players.size > 0) {
    const newHost = room.players.values().next().value;
    room.hostId = newHost.id;
    newHost.isHost = true;
  }
  
  return room;
}
