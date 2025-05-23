# Multiplayer Setup Guide

## Prerequisites

1. Node.js installed (v14 or higher)
2. npm installed
3. Git installed (optional but recommended)

## Local Development Setup

### 1. Install Netlify CLI

```bash
npm install -g netlify-cli
```

### 2. Install Project Dependencies

In the project root directory:

```bash
npm install
```

### 3. Initialize Netlify (First Time Only)

```bash
netlify init
```

Choose:
- "Create & configure a new site" if this is your first time
- Select your team
- Choose a site name (or leave blank for random name)

### 4. Start Local Development Server

```bash
netlify dev
```

This will:
- Start the Parcel development server on port 1234
- Start Netlify Functions on port 8888
- Proxy everything through port 3000

### 5. Access the Game

Open your browser and navigate to:
```
http://localhost:3000
```

## WebSocket Development

For local WebSocket development, you'll need to run a separate WebSocket server:

### 1. Create a Local WebSocket Server

Create `dev-websocket-server.js` in the project root:

```javascript
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3001 });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('message', (message) => {
    console.log('Received:', message.toString());
    // Echo back for testing
    ws.send(message);
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server running on ws://localhost:3001');
```

### 2. Run the WebSocket Server

In a separate terminal:

```bash
node dev-websocket-server.js
```

## Environment Variables

The `.env` file contains:
- `GAME_SECRET`: Secret key for game sessions
- `WS_PORT`: WebSocket server port for development
- `SUPABASE_URL`: (To be added) Supabase project URL
- `SUPABASE_ANON_KEY`: (To be added) Supabase anonymous key

## Deployment

### Deploy to Netlify

```bash
netlify deploy --prod
```

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:
1. Kill the process using the port
2. Or change the port in netlify.toml

### WebSocket Connection Failed

1. Ensure the WebSocket server is running
2. Check the browser console for errors
3. Verify the WebSocket URL in network-manager.js

### Functions Not Working

1. Check that functions directory exists: `netlify/functions/`
2. Verify function syntax
3. Check Netlify CLI output for errors

## Next Steps

1. Set up Supabase for persistent storage
2. Implement proper WebSocket handling in Netlify Functions
3. Add authentication system
4. Enhance game state synchronization
