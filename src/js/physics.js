// physics.js
export class PhysicsEngine {
  constructor(config) {
    this.config = config;
  }

  applyGravity(objects) {
    objects.forEach((obj) => {
      if (this.config.gravityType === "point") {
        const gravityX = this.config.gravityPoint.x * window.innerWidth - obj.x;
        const gravityY =
          this.config.gravityPoint.y * window.innerHeight - obj.y;
        const distance = Math.sqrt(gravityX * gravityX + gravityY * gravityY);

        if (distance > 0) {
          const gravityForce = this.config.gravityStrength / (distance * 0.1);
          obj.velocity.x += (gravityX / distance) * gravityForce;
          obj.velocity.y += (gravityY / distance) * gravityForce;
        }
      } else if (this.config.gravityType === "side") {
        switch (this.config.gravityDirection) {
          case "bottom":
            obj.velocity.y += this.config.gravityStrength;
            break;
          case "top":
            obj.velocity.y -= this.config.gravityStrength;
            break;
          case "left":
            obj.velocity.x -= this.config.gravityStrength;
            break;
          case "right":
            obj.velocity.x += this.config.gravityStrength;
            break;
        }
      }
    });
  }

  updatePosition(obj, customMaxSpeed = null) {
    // Apply air resistance
    obj.velocity.x *= this.config.airResistance;
    obj.velocity.y *= this.config.airResistance;

    // Apply max speed if enabled (use custom max speed if provided)
    if (this.config.hasMaxSpeed) {
      const maxSpeed = customMaxSpeed || this.config.maxSpeed;
      const speed = Math.sqrt(obj.velocity.x ** 2 + obj.velocity.y ** 2);
      if (speed > maxSpeed) {
        const factor = maxSpeed / speed;
        obj.velocity.x *= factor;
        obj.velocity.y *= factor;
      }
    }

    // Update position
    let newX = obj.x + obj.velocity.x;
    let newY = obj.y + obj.velocity.y;

    // Handle side gravity collision and wrap-around
    if (this.config.gravityType === "side") {
      switch (this.config.gravityDirection) {
        case "bottom":
          if (newY > window.innerHeight - 10) {
            newY = window.innerHeight - 10;
            obj.velocity.y = 0;
          }
          if (newY < 0) newY = window.innerHeight;
          if (newX < 0) newX = window.innerWidth;
          if (newX > window.innerWidth) newX = 0;
          break;
        case "top":
          if (newY < 10) {
            newY = 10;
            obj.velocity.y = 0;
          }
          if (newY > window.innerHeight) newY = 0;
          if (newX < 0) newX = window.innerWidth;
          if (newX > window.innerWidth) newX = 0;
          break;
        case "left":
          if (newX < 10) {
            newX = 10;
            obj.velocity.x = 0;
          }
          if (newX > window.innerWidth) newX = 0;
          if (newY < 0) newY = window.innerHeight;
          if (newY > window.innerHeight) newY = 0;
          break;
        case "right":
          if (newX > window.innerWidth - 10) {
            newX = window.innerWidth - 10;
            obj.velocity.x = 0;
          }
          if (newX < 0) newX = window.innerWidth;
          if (newY < 0) newY = window.innerHeight;
          if (newY > window.innerHeight) newY = 0;
          break;
      }
    } else {
      // Wrap around screen edges for other gravity types
      if (newX < 0) newX = window.innerWidth;
      if (newX > window.innerWidth) newX = 0;
      if (newY < 0) newY = window.innerHeight;
      if (newY > window.innerHeight) newY = 0;
    }

    obj.x = newX;
    obj.y = newY;
  }
}
