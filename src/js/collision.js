// collision.js
export class CollisionSystem {
    checkProjectileCollisions(player, allPlayers) {
        allPlayers.forEach(otherPlayer => {
            if (player !== otherPlayer) {
                player.projectiles.forEach((proj, index) => {
                    if (this.checkCollision(proj, otherPlayer)) {
                        otherPlayer.health -= 10;
                        player.projectiles.splice(index, 1);
                    }
                });
            }
        });
    }

    checkCollision(projectile, ship) {
        const dx = projectile.x - ship.x;
        const dy = projectile.y - ship.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // Use spaceship size to determine collision radius (scale from default size of 50)
        const shipRadius = (ship.config.spaceshipSize / 50) * 10;
        return distance < shipRadius;
    }
}
