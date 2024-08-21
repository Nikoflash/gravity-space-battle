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
    this.config = config;
    this.gravitySideTouchTime = 0;
    this.lastGroundDamageTime = 0;
    this.maxHealth = 100;
  }

  update(keys, canvas, physics) {
    this.thrusting = false;
    if (keys[this.controls.thrust]) {
      this.velocity.x += Math.sin(this.angle) * this.config.thrustPower;
      this.velocity.y -= Math.cos(this.angle) * this.config.thrustPower;
      this.thrusting = true;
    }

    if (keys[this.controls.left]) {
      this.angle -= this.config.rotationSpeed;
    }

    if (keys[this.controls.right]) {
      this.angle += this.config.rotationSpeed;
    }

    if (keys[this.controls.fire]) {
      this.fire();
      keys[this.controls.fire] = false; // Prevent continuous firing
    }

    // Apply physics (including air resistance and max speed)
    physics.updatePosition(this);

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
    if (this.projectiles.length < this.config.maxProjectiles) {
      const noseX = this.x + Math.sin(this.angle) * 10;
      const noseY = this.y - Math.cos(this.angle) * 10;
      this.projectiles.push(
        new Projectile(noseX, noseY, this.angle, this.config.projectileSpeed)
      );
    }
  }

  draw(renderer) {
    renderer.drawSpaceship(this);
    this.projectiles.forEach((proj) => renderer.drawProjectile(proj));
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
      inDamageZone = distanceToGravityPoint < 20;
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