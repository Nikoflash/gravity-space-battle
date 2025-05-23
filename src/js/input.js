// input.js
export class InputHandler {
    constructor() {
        this.keys = {};
        document.addEventListener('keydown', (e) => this.keys[e.key] = true);
        document.addEventListener('keyup', (e) => this.keys[e.key] = false);
    }
    
    /**
     * Get multiplayer input state for a player
     * @param {string} playerId - Player ID to get inputs for
     * @returns {Object} Input state object
     */
    getMultiplayerInputs(playerId) {
        // For now, only local player can provide inputs
        // In the future, this could support multiple local players
        
        // Player 1 controls (WASD)
        if (playerId && playerId.includes('player-1')) {
            return {
                thrust: this.keys['w'] || this.keys['W'],
                rotateLeft: this.keys['a'] || this.keys['A'],
                rotateRight: this.keys['d'] || this.keys['D'],
                fire: this.keys['s'] || this.keys['S']
            };
        }
        
        // Default to arrow keys for any player
        return {
            thrust: this.keys['ArrowUp'],
            rotateLeft: this.keys['ArrowLeft'],
            rotateRight: this.keys['ArrowRight'],
            fire: this.keys['ArrowDown']
        };
    }
    
    /**
     * Reset all key states
     */
    reset() {
        this.keys = {};
    }
}
