// config.js
export class GameConfig {
    constructor() {
        this.gravityType = 'side';
        this.gravityDirection = 'bottom'; // Default value
        this.gravityPoint = { x: 0.5, y: 0.5 };
        this.thrustPower = 0.2;
        this.airResistance = 0.99;
        this.hasMaxSpeed = true;
        this.maxSpeed = 10;
        this.rotationSpeed = 0.1;
        this.projectileSpeed = 5;
        this.maxProjectiles = 5;
        this.deltaTime = 16;
        this.groundDamageInterval = 1000; // 1 second in milliseconds
        this.groundDamagePercent = 20; // 20% health loss
        this.spaceshipSize = 50; // Make sure this matches your spaceship's actual size
        
        this.player1Controls = {
            thrust: 'w',
            left: 'a',
            right: 'd',
            fire: 's'
        };
        
        this.player2Controls = {
            thrust: 'ArrowUp',
            left: 'ArrowLeft',
            right: 'ArrowRight',
            fire: 'ArrowDown'
        };
    }

    updateFromMenu(menuConfig) {
        Object.assign(this, menuConfig);
    }
}