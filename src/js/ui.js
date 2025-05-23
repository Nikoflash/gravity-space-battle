// ui.js
export class UI {
    constructor(ctx, restartCallback) {
        this.ctx = ctx;
        this.restartCallback = restartCallback;
        this.restartButton = null;
    }

    drawHealthBar(player) {
        const barWidth = this.ctx.canvas.width * 0.4;
        const barHeight = 5;
        const x = player.color === 'blue' ? 10 : this.ctx.canvas.width - barWidth - 10;
        const y = 10;

        // Draw background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(x, y, barWidth, barHeight);

        // Draw health bar
        this.ctx.fillStyle = player.color;
        const healthPercent = player.health / 100;
        const healthWidth = barWidth * healthPercent;
        
        if (player.color === 'blue') {
            // Player 1 (blue) - decrease from right to left
            const healthX = x + barWidth - healthWidth;
            this.ctx.fillRect(healthX, y, healthWidth, barHeight);
        } else {
            // Player 2 (red) - decrease from left to right
            this.ctx.fillRect(x, y, healthWidth, barHeight);
        }
    }

    drawGameOver(players) {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        const winner = players[0].health <= 0 ? 'Player 2' : 'Player 1';
        this.ctx.fillText(`${winner} Wins!`, this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);

        // Create and add restart button
        this.createRestartButton();
    }

    createRestartButton() {
        if (!this.restartButton) {
            this.restartButton = document.createElement('button');
            this.restartButton.textContent = 'Restart Game';
            this.restartButton.style.position = 'absolute';
            this.restartButton.style.left = '50%';
            this.restartButton.style.top = '60%';
            this.restartButton.style.transform = 'translate(-50%, -50%)';
            this.restartButton.addEventListener('click', () => {
                this.restartCallback();
                this.removeRestartButton();
            });
            document.body.appendChild(this.restartButton);
        }
    }

    removeRestartButton() {
        if (this.restartButton) {
            this.restartButton.remove();
            this.restartButton = null;
        }
    }
    
    updateMultiplayerHealth(healthData) {
        // Draw health bars for all players
        const barHeight = 5;
        const barWidth = 150;
        const padding = 10;
        let yOffset = padding;
        
        healthData.forEach((player, index) => {
            const x = padding;
            const y = yOffset;
            
            // Draw player name and color
            this.ctx.fillStyle = player.color;
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(player.name, x, y - 2);
            
            // Draw background
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(x, y, barWidth, barHeight);
            
            // Draw health bar
            this.ctx.fillStyle = player.color;
            const healthPercent = Math.max(0, player.health / player.maxHealth);
            const healthWidth = barWidth * healthPercent;
            this.ctx.fillRect(x, y, healthWidth, barHeight);
            
            // Draw health text
            this.ctx.fillStyle = 'white';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`${Math.round(player.health)}/${player.maxHealth}`, x + barWidth + 40, y + barHeight);
            
            yOffset += barHeight + padding + 10;
        });
    }
}