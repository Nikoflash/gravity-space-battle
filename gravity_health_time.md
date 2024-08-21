class Spaceship {
    constructor(x, y, color, controls) {
        // ... other properties ...
        this.health = 100;
        this.groundTouchTime = 0;
        this.lastGroundDamageTime = 0;
    }

    update(currentTime) {
        // ... other update logic ...
        this.checkGroundDamage(currentTime);
    }

    checkGroundDamage(currentTime) {
        let inDamageZone = false;
        if (GRAVITY_TYPE === 'side') {
            switch (GRAVITY_DIRECTION) {
                case "bottom":
                    inDamageZone = this.y >= canvas.height - 10;
                    break;
                case "top":
                    inDamageZone = this.y <= 10;
                    break;
                case "left":
                    inDamageZone = this.x <= 10;
                    break;
                case "right":
                    inDamageZone = this.x >= canvas.width - 10;
                    break;
            }
        } else if (GRAVITY_TYPE === 'point') {
            const distanceToGravityPoint = Math.sqrt(
                Math.pow((GRAVITY_POINT.x * canvas.width) - this.x, 2) +
                Math.pow((GRAVITY_POINT.y * canvas.height) - this.y, 2)
            );
            inDamageZone = distanceToGravityPoint < 20;
        }

        if (inDamageZone) {
            if (this.groundTouchTime === 0) {
                this.groundTouchTime = currentTime;
            }
            if (currentTime - this.groundTouchTime >= GROUND_DAMAGE_INTERVAL &&
                currentTime - this.lastGroundDamageTime >= GROUND_DAMAGE_INTERVAL) {
                this.health -= GROUND_DAMAGE_PERCENT;
                this.lastGroundDamageTime = currentTime;
            }
        } else {
            this.groundTouchTime = 0;
            this.lastGroundDamageTime = 0;
        }
    }
}

// Constants used in the above code:
const GROUND_DAMAGE_INTERVAL = 1000; // 1 second in milliseconds
const GROUND_DAMAGE_PERCENT = 20; // 20% health loss


Here's an explanation of how this code works:

In the Spaceship constructor, we initialize:

health: The spaceship's health, starting at 100.
groundTouchTime: Tracks when the spaceship first touches the ground.
lastGroundDamageTime: Tracks when damage was last applied.


The update method calls checkGroundDamage every frame, passing the current time.
The checkGroundDamage method:

Determines if the spaceship is in the damage zone based on the gravity type and direction.
For side gravity, it checks if the spaceship is within 10 pixels of the gravity side.
For point gravity, it checks if the spaceship is within 20 pixels of the gravity point.


If the spaceship is in the damage zone:

It sets groundTouchTime if it's the first frame of contact.
It checks if enough time has passed since the initial contact and the last damage application.
If so, it reduces the spaceship's health by GROUND_DAMAGE_PERCENT (20%) and updates lastGroundDamageTime.


If the spaceship is not in the damage zone, it resets groundTouchTime and lastGroundDamageTime.

This mechanic ensures that:

The spaceship only takes damage after being in contact with the ground for 1 second.
Damage is applied every second after that.
The spaceship stops taking damage as soon as it leaves the ground.

To use this in your game:

Ensure the GROUND_DAMAGE_INTERVAL and GROUND_DAMAGE_PERCENT constants are defined.
Include this Spaceship class in your game code.
Call the update method of each spaceship instance in your game loop, passing the current time.

This mechanic adds an element of urgency and strategy to the game, encouraging players to avoid prolonged contact with the gravity source.