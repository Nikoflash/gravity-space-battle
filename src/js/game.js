// game.js
// Last updated: 2025-01-24
import { GameConfig } from "./config.js";
import { Renderer } from "./renderer.js";
import { InputHandler } from "./input.js";
import { PhysicsEngine } from "./physics.js";
import { Spaceship } from "./spaceship.js";
import { CollisionSystem } from "./collision.js";
import { UI } from "./ui.js";
import { Menu } from "./menu.js";

export class Game {
  constructor() {
    this.config = new GameConfig();
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.renderer = new Renderer(this.ctx);
    this.input = new InputHandler();
    this.physics = new PhysicsEngine(this.config);
    this.collisionSystem = new CollisionSystem();
    this.ui = new UI(this.ctx, () => this.restartGame());
    this.menu = new Menu(
      (config) => this.startGame(config),
      (config) => this.resumeGame(config),
      (config) => this.restartGame(config)
    );

    this.players = [];
    this.gameOver = false;
    this.isRunning = false;
    this.state = 'menu'; // Add state property
    this.animationId = null; // Add animation ID for canceling

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (this.isRunning) {
          this.pauseGame();
        }
      }
    });
  }

  init() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.players = [
      new Spaceship(
        this.canvas.width * 0.25,
        this.canvas.height / 2,
        "blue",
        this.config.player1Controls,
        this.config
      ),
      new Spaceship(
        this.canvas.width * 0.75,
        this.canvas.height / 2,
        "red",
        this.config.player2Controls,
        this.config
      ),
    ];
  }

  update() {
    this.physics.applyGravity(this.players);
    this.players.forEach((player) => {
      player.update(this.input.keys, this.canvas, this.physics);
      this.collisionSystem.checkProjectileCollisions(player, this.players);
    });

    if (this.players.some((player) => player.health <= 0)) {
      this.gameOver = true;
    }
  }

  render() {
    this.renderer.clear();
    this.renderer.drawGravity(this.config);
    this.players.forEach((player) => {
      player.draw(this.renderer);
      this.ui.drawHealthBar(player);
    });

    if (this.gameOver) {
      this.ui.drawGameOver(this.players);
    }
  }

  gameLoop() {
    if (!this.isRunning) return;

    this.update();
    this.render();

    if (this.gameOver) {
      this.isRunning = false;
    } else {
      this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
  }

  startGame(config) {
    this.updateConfig(config);
    this.init();
    this.isRunning = true;
    this.gameLoop();
  }

  updateConfig(newConfig) {
    this.config.updateFromMenu(newConfig);
    this.applyConfig();
  }

  applyConfig() {
    this.physics = new PhysicsEngine(this.config);
    this.players.forEach((player) => {
      player.config = this.config;
    });
  }

  pauseGame() {
    this.isRunning = false;
    this.menu.show(true);
  }

  resumeGame(config) {
    this.config.updateFromMenu(config);
    this.applyConfig();
    this.isRunning = true;
    this.gameLoop();
  }

  restartGame(config) {
    this.gameOver = false;
    this.config.updateFromMenu(config);
    this.init();
    this.isRunning = true;
    this.gameLoop();
  }

  restart() {
    this.gameOver = false;
    this.players = [
      new Spaceship(
        this.canvas.width * 0.25,
        this.canvas.height / 2,
        "blue",
        this.config.player1Controls,
        this.config
      ),
      new Spaceship(
        this.canvas.width * 0.75,
        this.canvas.height / 2,
        "red",
        this.config.player2Controls,
        this.config
      ),
    ];
    this.gameLoop();
  }
  
  start() {
    this.state = 'playing';
    this.isRunning = true;
    this.gameLoop();
  }
  
  stop() {
    this.state = 'stopped';
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

const game = new Game();
let multiplayerGame = null;

// Handle multiplayer game start
window.addEventListener('startMultiplayerGame', async (event) => {
  const { roomCode, networkManager, gameData } = event.detail;
  
  console.log('Starting multiplayer game with event data:', event.detail);
  
  // Stop single player game if running
  game.stop();
  game.menu.hide();
  
  // Dynamically import multiplayer game to avoid circular dependency
  const { MultiplayerGame } = await import('./multiplayer-game.js');
  
  // Create and start multiplayer game
  multiplayerGame = new MultiplayerGame(
    game.canvas,
    game.config,
    networkManager,
    roomCode
  );
  
  // If we have game data, start the game immediately
  // The server now delays the game loop to give us time to set up
  if (gameData) {
    multiplayerGame.handleGameStart(gameData);
  }
});

// Handle return to lobby
window.addEventListener('return-to-lobby', () => {
  if (multiplayerGame) {
    multiplayerGame.stop();
    multiplayerGame = null;
  }
  
  // Show lobby UI
  import('./lobby-ui.js').then(module => {
    module.default.show();
  });
});

game.menu.show();
