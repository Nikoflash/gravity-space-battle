// spaceship.js
import { Projectile } from "./projectile.js";

export class Spaceship {
  constructor(x, y, color, controls, config) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.angle = 0;
    this.velocity = { x: 0, y: 0 };
    this.health = 100;
    this.controls = controls;
    this.projectiles = [];
    this.thrusting = false;
    this.boosting = false;
    this.lastBoostDrainTime = 0;
    this.config = config;
    this.gravitySideTouchTime = 0;
    this.lastGroundDamageTime = 0;
    this.lastFireTime = 0;
    this.maxHealth = 100;
  }

  update(keys, canvas, physics) {
    this.thrusting = false;
    this.boosting = false;
    
    // Handle regular thrust
    if (keys[this.controls.thrust]) {
      this.velocity.x += Math.sin(this.angle) * this.config.thrustPower;
      this.velocity.y -= Math.cos(this.angle) * this.config.thrustPower;
      this.thrusting = true;
    }

    // Handle boost (extra thrust that drains health)
    if (keys[this.controls.boost] && this.health > 0) {
      this.velocity.x += Math.sin(this.angle) * this.config.boostPower;
      this.velocity.y -= Math.cos(this.angle) * this.config.boostPower;
      this.boosting = true;
      this.drainHealthForBoost();
    }

    if (keys[this.controls.left]) {
      this.angle -= this.config.rotationSpeed;
    }

    if (keys[this.controls.right]) {
      this.angle += this.config.rotationSpeed;
    }

    if (keys[this.controls.fire]) {
      this.fire();
    }

    // Apply physics (including air resistance and max speed)
    // When boosting, allow 20% higher max speed
    const maxSpeed = this.boosting ? this.config.maxSpeed * 1.2 : this.config.maxSpeed;
    physics.updatePosition(this, maxSpeed);

    // Update projectiles
    this.projectiles = this.projectiles.filter((proj) => {
      proj.update();
      return proj.isActive(canvas);
    });

    const currentTime = Date.now();
    this.checkGroundDamage(currentTime, canvas);

    // Ensure health doesn't go below 0
    this.health = Math.max(0, this.health);
  }

  fire() {
    const currentTime = Date.now();
    const timeBetweenShots = 1000 / this.config.fireRate; // Convert fire rate to milliseconds between shots
    
    // Check if enough time has passed since last shot and we haven't exceeded max projectiles
    if (currentTime - this.lastFireTime >= timeBetweenShots && 
        this.projectiles.length < this.config.maxProjectiles) {
      // Scale projectile spawn position with spaceship size
      const noseDistance = (this.config.spaceshipSize / 50) * 10;
      const noseX = this.x + Math.sin(this.angle) * noseDistance;
      const noseY = this.y - Math.cos(this.angle) * noseDistance;
      this.projectiles.push(
        new Projectile(noseX, noseY, this.angle, this.config.projectileSpeed)
      );
      this.lastFireTime = currentTime;
    }
  }

  draw(renderer) {
    renderer.drawSpaceship(this);
    this.projectiles.forEach((proj) => renderer.drawProjectile(proj));
  }

  drainHealthForBoost() {
    const currentTime = Date.now();
    const drainInterval = 100; // Drain health every 100ms for smooth drain
    
    if (currentTime - this.lastBoostDrainTime >= drainInterval) {
      const healthToDrain = (this.config.boostHealthDrain * drainInterval) / 1000; // Convert to per-interval drain
      this.health -= healthToDrain;
      this.lastBoostDrainTime = currentTime;
      
      // Prevent health from going negative
      if (this.health < 0) {
        this.health = 0;
      }
    }
  }

  checkGroundDamage(currentTime, canvas) {
    let inDamageZone = false;
    const buffer = 10; // 10 pixels from the edge

    if (this.config.gravityType === 'side') {
      switch (this.config.gravityDirection) {
        case "bottom":
          inDamageZone = this.y + this.config.spaceshipSize >= canvas.height - buffer;
          break;
        case "top":
          inDamageZone = this.y <= buffer;
          break;
        case "left":
          inDamageZone = this.x <= buffer;
          break;
        case "right":
          inDamageZone = this.x + this.config.spaceshipSize >= canvas.width - buffer;
          break;
      }
    } else if (this.config.gravityType === 'point') {
      const distanceToGravityPoint = Math.sqrt(
        Math.pow((this.config.gravityPoint.x * canvas.width) - this.x, 2) +
        Math.pow((this.config.gravityPoint.y * canvas.height) - this.y, 2)
      );
      // Scale damage zone with spaceship size (default size 50 = radius 20)
      const damageRadius = (this.config.spaceshipSize / 50) * 20;
      inDamageZone = distanceToGravityPoint < damageRadius;
    }

    if (inDamageZone) {
      if (this.gravitySideTouchTime === 0) {
        this.gravitySideTouchTime = currentTime;
      }
      if (
        currentTime - this.gravitySideTouchTime >=
          this.config.groundDamageInterval &&
        currentTime - this.lastGroundDamageTime >=
          this.config.groundDamageInterval
      ) {
        this.health -= this.config.groundDamagePercent;
        this.lastGroundDamageTime = currentTime;
      }
    } else {
      if (this.gravitySideTouchTime !== 0) {
      }
      this.gravitySideTouchTime = 0;
      this.lastGroundDamageTime = 0;
    }
  }
}