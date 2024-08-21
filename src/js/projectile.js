// projectile.js
export class Projectile {
  constructor(x, y, angle, speed) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = speed;
  }

  update() {
    this.x += Math.sin(this.angle) * this.speed;
    this.y -= Math.cos(this.angle) * this.speed;
  }

  isActive(canvas) {
    return (
      this.x >= 0 &&
      this.x <= canvas.width &&
      this.y >= 0 &&
      this.y <= canvas.height
    );
  }
}
