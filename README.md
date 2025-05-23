# Gravity Space Battle

A 2D multiplayer space combat game featuring customizable gravity physics, built with vanilla JavaScript and HTML5 Canvas. Navigate spaceships through various gravity fields while battling your opponent in this physics-based arena fighter.

## 🎮 Game Features

### Core Gameplay

- **Two-Player Local Multiplayer**: Battle against a friend using keyboard controls
- **Physics-Based Combat**: Master momentum and gravity to outmaneuver your opponent
- **Customizable Gravity**: Choose from three distinct gravity modes that dramatically change gameplay
- **Projectile Weapons**: Fire limited projectiles with realistic physics
- **Health System**: Take damage from projectiles and environmental hazards
- **Real-time Configuration**: Adjust game settings on-the-fly during gameplay

### Gravity Modes

1. **Point Gravity**: Creates a central gravity well that pulls ships toward a configurable point
2. **Side Gravity**: Traditional directional gravity (up, down, left, or right)
3. **No Gravity**: Pure momentum-based movement in zero-gravity space

### Environmental Hazards

- **Collision Damage**: Ships take damage when touching gravity sources or boundaries
- **Timed Damage System**: Continuous contact with hazards deals periodic damage
- **Strategic Positioning**: Use gravity wells tactically to damage opponents

## 🚀 Getting Started

### Prerequisites

- Node.js (for development server)
- Modern web browser with Canvas support

### Installation

1. Clone the repository:

```bash
git clone [repository-url]
cd gravity-space-battle
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

4. Open your browser and navigate to the provided local URL (typically `http://localhost:1234`)

### Building for Production

```bash
npm run build
```

## 🎯 How to Play

### Controls

#### Player 1 (Blue Ship)

- **W**: Thrust forward
- **A**: Rotate left
- **D**: Rotate right
- **S**: Fire projectile

#### Player 2 (Red Ship)

- **↑**: Thrust forward
- **←**: Rotate left
- **→**: Rotate right
- **↓**: Fire projectile

### General Controls

- **ESC**: Pause game and return to settings menu

### Game Mechanics

1. **Movement**: Use thrust to accelerate in the direction your ship is facing
2. **Rotation**: Turn your ship to change thrust direction
3. **Shooting**: Fire projectiles that travel in straight lines and deal damage on impact
4. **Gravity**: Learn to use gravity to your advantage - slingshot around gravity wells or use them as shields
5. **Health Management**: Avoid prolonged contact with hazardous areas and enemy fire

## ⚙️ Configuration Options

### Gravity Settings

- **Gravity Type**: Point, Side, or None
- **Gravity Point Position**: X/Y coordinates for point gravity (0.0 to 1.0)
- **Gravity Direction**: Top, Bottom, Left, or Right for side gravity
- **Gravity Strength**: Intensity of gravitational force

### Ship Movement

- **Thrust Power**: Acceleration strength of ship engines
- **Air Resistance**: Drag coefficient affecting momentum
- **Max Speed Toggle**: Enable/disable speed limitations
- **Max Speed**: Maximum velocity when enabled
- **Rotation Speed**: How quickly ships can turn

### Weapons

- **Projectile Speed**: Velocity of fired projectiles
- **Max Projectiles**: Maximum number of simultaneous projectiles per player

## 🏗️ Architecture

The game follows a modular architecture with clear separation of concerns:

```
src/
├── index.html          # Main HTML structure and game settings UI
├── styles.css          # Game styling and UI layout
└── js/
    ├── game.js         # Main game loop and state management
    ├── config.js       # Game configuration and settings
    ├── physics.js      # Physics engine and gravity calculations
    ├── spaceship.js    # Player ship mechanics and behavior
    ├── projectile.js   # Projectile physics and lifecycle
    ├── collision.js    # Collision detection system
    ├── renderer.js     # Canvas rendering and graphics
    ├── input.js        # Keyboard input handling
    ├── ui.js          # User interface elements (health bars, game over)
    └── menu.js        # Settings menu and game state transitions
```

### Key Components

#### Game Engine (`game.js`)

- Central game loop management
- State transitions (menu → game → pause → game over)
- Component coordination and dependency injection

#### Physics Engine (`physics.js`)

- Gravity calculations for all three modes
- Position updates with collision boundaries
- Velocity management including air resistance and speed limits

#### Spaceship System (`spaceship.js`)

- Player input processing
- Movement and rotation mechanics
- Weapon firing system
- Health management and environmental damage

#### Collision System (`collision.js`)

- Projectile-to-ship collision detection
- Damage application on successful hits

#### Rendering System (`renderer.js`)

- Canvas drawing operations
- Gravity visualization
- Ship and projectile graphics

## 🔧 Technical Details

### Technologies Used

- **Vanilla JavaScript**: Core game logic and ES6 modules
- **HTML5 Canvas**: 2D graphics rendering
- **Parcel**: Build tool and development server
- **CSS3**: UI styling and responsive design

### Performance Considerations

- Efficient collision detection using distance calculations
- Optimized rendering with canvas state management
- Modular loading prevents unnecessary processing
- Frame-rate independent physics calculations

### Browser Compatibility

- Modern browsers supporting ES6 modules
- Canvas 2D rendering context
- RequestAnimationFrame API

## 🎨 Customization

The game is designed to be easily customizable:

1. **Physics Parameters**: Modify `config.js` to adjust default values
2. **Visual Style**: Update `styles.css` for different UI themes
3. **Ship Graphics**: Customize drawing functions in `renderer.js`
4. **Controls**: Remap keys in the configuration object
5. **Game Rules**: Adjust damage values, health amounts, and timing in respective modules

## 🐛 Known Issues

- Game requires manual restart after completion
- No AI opponent option currently available
- Limited to keyboard input (no gamepad support)

## 🤝 Contributing

This project welcomes contributions! Areas for improvement include:

- AI opponent implementation
- Gamepad/controller support
- Sound effects and music
- Particle effects for explosions
- Power-ups and special abilities
- Network multiplayer support

## 📝 License

This project is available under the ISC License. See the package.json file for details.

## 🎮 Gameplay Tips

1. **Master the Gravity**: Each gravity mode requires different strategies
2. **Projectile Conservation**: You have limited shots - make them count
3. **Use Momentum**: Build up speed and use gravity to slingshot around the arena
4. **Environmental Awareness**: Avoid prolonged contact with gravity sources
5. **Predictive Aiming**: Lead your shots based on your opponent's movement patterns

---

Have fun battling among the stars! 🌟
