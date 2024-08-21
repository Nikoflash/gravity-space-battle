// menu.js
export class Menu {
    constructor(startGameCallback, resumeGameCallback, restartGameCallback) {
        this.startGameCallback = startGameCallback;
        this.resumeGameCallback = resumeGameCallback;
        this.restartGameCallback = restartGameCallback;
        this.menuElement = document.getElementById('startMenu');
        this.form = document.getElementById('gameSettingsForm');
        this.resumeButton = document.createElement('button');
        this.resumeButton.textContent = 'Resume Game';
        this.resumeButton.id = 'resumeButton';
        this.resumeButton.style.display = 'none';
        this.form.appendChild(this.resumeButton);

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            const config = this.getConfigFromForm();
            if (this.resumeButton.style.display === 'none') {
                this.startGameCallback(config);
            } else {
                this.resumeGameCallback(config);
            }
            this.hide();
        });

        this.resumeButton.addEventListener('click', (e) => {
            e.preventDefault();
            const config = this.getConfigFromForm();
            this.resumeGameCallback(config);
            this.hide();
        });

        this.setupEventListeners();
    }

    show(isGameInProgress = false) {
        this.menuElement.style.display = 'block';
        const startButton = document.querySelector('#gameSettingsForm button[type="submit"]');
        const resumeButton = document.getElementById('resumeButton');
        const restartButton = document.getElementById('restartButton');

        if (isGameInProgress) {
            startButton.style.display = 'none';
            resumeButton.style.display = 'inline-block';
            restartButton.style.display = 'inline-block';
        } else {
            startButton.style.display = 'inline-block';
            resumeButton.style.display = 'none';
            restartButton.style.display = 'none';
        }
    }

    hide() {
        this.menuElement.style.display = 'none';
    }

    setupEventListeners() {
        // Add event listeners for showing/hiding gravity settings
        const gravityType = document.getElementById('gravityType');
        const pointGravitySettings = document.getElementById('pointGravitySettings');
        const sideGravitySettings = document.getElementById('sideGravitySettings');
        gravityType.addEventListener('change', () => {
            pointGravitySettings.style.display = gravityType.value === 'point' ? 'block' : 'none';
            sideGravitySettings.style.display = gravityType.value === 'side' ? 'block' : 'none';
        });

        // Add event listener for air resistance slider
        const airResistanceSlider = document.getElementById('airResistance');
        const airResistanceValue = document.getElementById('airResistanceValue');
        airResistanceSlider.addEventListener('input', () => {
            airResistanceValue.textContent = airResistanceSlider.value;
        });

        // Add restart buttons
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Restart Game';
        restartButton.id = 'restartButton';
        restartButton.style.display = 'none';
        restartButton.addEventListener('click', () => {
            this.hide();
            this.restartGameCallback(this.getConfigFromForm());
        });

        this.form.appendChild(restartButton);
    }

    getConfigFromForm() {
         const airResistanceValue = parseInt(
           document.getElementById("airResistance").value
         );
         // Convert air resistance from 0-10 scale to 0.9-1 scale
         const calculatedAirResistance = 1 - airResistanceValue / 100;
        return {
            gravityType: document.getElementById('gravityType').value,
            gravityPoint: {
                x: parseFloat(document.getElementById('gravityPointX').value),
                y: parseFloat(document.getElementById('gravityPointY').value)
            },
            gravityDirection: document.getElementById('gravityDirection').value,
            gravityStrength: parseFloat(document.getElementById('gravityStrength').value),
            thrustPower: parseFloat(document.getElementById('thrustPower').value),
            airResistance: calculatedAirResistance,
            hasMaxSpeed: document.getElementById('hasMaxSpeed').checked,
            maxSpeed: parseFloat(document.getElementById('maxSpeed').value),
            rotationSpeed: parseFloat(document.getElementById('rotationSpeed').value),
            projectileSpeed: parseFloat(document.getElementById('projectileSpeed').value),
            maxProjectiles: parseInt(document.getElementById('maxProjectiles').value)
        };
    }
}