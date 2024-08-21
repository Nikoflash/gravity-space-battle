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

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(x, y, barWidth, barHeight);

        this.ctx.fillStyle = player.color;
        this.ctx.fillRect(x, y, barWidth * (player.health / 100), barHeight);
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
}