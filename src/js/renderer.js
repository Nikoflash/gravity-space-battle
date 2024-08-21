// renderer.js
export class Renderer {
    constructor(ctx) {
        this.ctx = ctx;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    drawSpaceship(ship) {
        this.ctx.save();
        this.ctx.translate(ship.x, ship.y);
        this.ctx.rotate(ship.angle);
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, -10);
        this.ctx.lineTo(-7, 10);
        this.ctx.lineTo(7, 10);
        this.ctx.closePath();
        this.ctx.fillStyle = ship.color;
        this.ctx.fill();

        if (ship.thrusting) {
            this.ctx.beginPath();
            this.ctx.moveTo(-5, 10);
            this.ctx.lineTo(0, 20);
            this.ctx.lineTo(5, 10);
            this.ctx.closePath();
            this.ctx.fillStyle = 'orange';
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawProjectile(proj) {
        this.ctx.beginPath();
        this.ctx.arc(proj.x, proj.y, 2, 0, Math.PI * 2);
        this.ctx.fillStyle = 'yellow';
        this.ctx.fill();
    }

    drawGravity(config) {
        if (config.gravityType === 'point') {
            this.ctx.beginPath();
            this.ctx.arc(config.gravityPoint.x * this.ctx.canvas.width, config.gravityPoint.y * this.ctx.canvas.height, 5, 0, Math.PI * 2);
            this.ctx.fillStyle = 'white';
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.arc(config.gravityPoint.x * this.ctx.canvas.width, config.gravityPoint.y * this.ctx.canvas.height, 100, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.stroke();
        } else if (config.gravityType === 'side') {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            switch (config.gravityDirection) {
                case "bottom":
                    this.ctx.moveTo(0, this.ctx.canvas.height);
                    this.ctx.lineTo(this.ctx.canvas.width, this.ctx.canvas.height);
                    break;
                case "top":
                    this.ctx.moveTo(0, 0);
                    this.ctx.lineTo(this.ctx.canvas.width, 0);
                    break;
                case "left":
                    this.ctx.moveTo(0, 0);
                    this.ctx.lineTo(0, this.ctx.canvas.height);
                    break;
                case "right":
                    this.ctx.moveTo(this.ctx.canvas.width, 0);
                    this.ctx.lineTo(this.ctx.canvas.width, this.ctx.canvas.height);
                    break;
            }
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }
}
