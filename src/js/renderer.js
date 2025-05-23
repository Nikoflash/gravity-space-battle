// renderer.js
export class Renderer {
    constructor(ctx) {
        this.ctx = ctx;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    drawSpaceship(shipOrX, y, angle, color, isLocal = false) {
        // Handle both object and individual parameters
        if (typeof shipOrX === 'object') {
            // Legacy single-player mode
            const ship = shipOrX;
            this.drawSpaceshipObject(ship);
        } else {
            // Multiplayer mode with individual parameters
            this.ctx.save();
            this.ctx.translate(shipOrX, y);
            this.ctx.rotate(angle);
            
            // Draw spaceship body
            this.ctx.beginPath();
            this.ctx.moveTo(0, -10);
            this.ctx.lineTo(-7, 10);
            this.ctx.lineTo(7, 10);
            this.ctx.closePath();
            this.ctx.fillStyle = color;
            this.ctx.fill();
            
            // Draw outline for local player
            if (isLocal) {
                this.ctx.strokeStyle = 'white';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }

            this.ctx.restore();
        }
    }
    
    // Legacy method for compatibility
    drawSpaceshipObject(ship) {
        this.ctx.save();
        this.ctx.translate(ship.x, ship.y);
        this.ctx.rotate(ship.angle);
        
        // Use spaceship size as scale factor (default size 50 = scale 1.0)
        const scale = ship.config.spaceshipSize / 50;
        this.ctx.scale(scale, scale);
        
        // Draw spaceship body
        this.ctx.beginPath();
        this.ctx.moveTo(0, -10);
        this.ctx.lineTo(-7, 10);
        this.ctx.lineTo(7, 10);
        this.ctx.closePath();
        this.ctx.fillStyle = ship.color;
        this.ctx.fill();

        // Draw regular thrust flame
        if (ship.thrusting) {
            this.ctx.beginPath();
            this.ctx.moveTo(-5, 10);
            this.ctx.lineTo(0, 20);
            this.ctx.lineTo(5, 10);
            this.ctx.closePath();
            this.ctx.fillStyle = 'orange';
            this.ctx.fill();
        }

        // Draw boost flame (larger and blue)
        if (ship.boosting) {
            this.ctx.beginPath();
            this.ctx.moveTo(-7, 10);
            this.ctx.lineTo(0, 25);
            this.ctx.lineTo(7, 10);
            this.ctx.closePath();
            this.ctx.fillStyle = '#00BFFF'; // Deep sky blue for boost
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawProjectile(xOrProj, y) {
        // Handle both object and individual parameters
        if (typeof xOrProj === 'object') {
            // Legacy single-player mode
            const proj = xOrProj;
            this.drawProjectileObject(proj);
        } else {
            // Multiplayer mode with individual parameters
            this.ctx.beginPath();
            this.ctx.arc(xOrProj, y, 2, 0, Math.PI * 2);
            this.ctx.fillStyle = 'yellow';
            this.ctx.fill();
        }
    }
    
    // Legacy method for compatibility
    drawProjectileObject(proj) {
        this.ctx.beginPath();
        this.ctx.arc(proj.x, proj.y, 2, 0, Math.PI * 2);
        this.ctx.fillStyle = 'yellow';
        this.ctx.fill();
    }
    
    drawPlayerName(x, y, name) {
        this.ctx.save();
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(name, x, y);
        this.ctx.restore();
    }

    drawGravity(physics) {
        const config = physics.config || physics;
        
        if (config.gravityType === 'point') {
            const gravityX = (config.gravityPoint?.x || config.gravityPointX || 0.5) * this.ctx.canvas.width;
            const gravityY = (config.gravityPoint?.y || config.gravityPointY || 0.5) * this.ctx.canvas.height;
            
            this.ctx.beginPath();
            this.ctx.arc(gravityX, gravityY, 5, 0, Math.PI * 2);
            this.ctx.fillStyle = 'white';
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.arc(gravityX, gravityY, 100, 0, Math.PI * 2);
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
