# Polygun Arena

A 3D shooting game built with Three.js, featuring a modular and maintainable architecture.

---

## 🚀 Getting Started

Follow these steps to set up and run the project locally:

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd polygun_arena
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm start
```

- Open [http://localhost:9000](http://localhost:9000) in your browser to play.

### 4. Build for Production

```bash
npm run build
```

- Output will be in the `dist/` folder.

### 5. Code Quality Tools

```bash
npm run lint    # Check code with ESLint
npm run format  # Format code with Prettier
```

### Troubleshooting

- If you see missing module errors, run `npm install` again.
- If port 9000 is in use, edit the port in `webpack.config.js`.
- For Three.js/WebGL errors, ensure your browser supports WebGL.

---

## 🏗️ Architecture Overview

The codebase follows clean architecture principles with clear separation of concerns:

### Core Components

- **GameManager**: Orchestrates all game components and manages the game loop
- **Game**: Handles game state, scene setup, and core game logic
- **Renderer**: Manages Three.js rendering and viewport handling
- **PlayerController**: Controls player movement, camera, and weapon animations
- **TargetController**: Manages target spawning, hit detection, and game progression
- **Joystick**: Handles touch/pointer input for movement and rotation
- **GameUIOverlay**: Manages UI elements (crosshair, hit markers, game over screen)
- **AssetLoader**: Handles loading and caching of 3D assets
- **EventBus**: Provides event-driven communication between components

### File Structure

```
src/
├── classes/
│   ├── GameManager.js      # Main orchestrator
│   ├── Game.js            # Game state and logic
│   ├── Renderer.js        # Rendering management
│   ├── PlayerController.js # Player and camera control
│   ├── TargetController.js # Target management
│   ├── Joystick.js        # Input handling
│   ├── GameUIOverlay.js   # UI management
│   ├── AssetLoader.js     # Asset loading
│   └── EventBus.js        # Event system
├── helpers/
│   ├── constants.js       # Configuration constants
│   ├── EventNames.js      # Event name constants
│   └── utils.js          # Utility functions
├── index.js              # Application entry point
└── template.html         # HTML template
```

## 🎮 Game Features

- **Dual Joystick Controls**: Left joystick for movement, right for camera rotation
- **Weapon System**: Animated weapon with deploy, fire, reload, and idle states
- **Target Shooting**: Multiple targets with health points
- **Responsive UI**: Crosshair, hit markers, and game over overlay
- **Mobile Optimized**: Touch controls and responsive design

## 🛠️ Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development Server

```bash
npm start
```

### Build for Production

```bash
npm run build
```

### Code Quality

```bash
npm run lint    # ESLint
npm run format  # Prettier
```

## 🔧 Configuration

All game configuration is centralized in `src/helpers/constants.js`:

- **GAME_CONFIG**: Game mechanics, speeds, positions
- **TARGET_CONFIGS**: Predefined target layouts and configurations
- **CURRENT_TARGET_CONFIG**: Active target configuration
- **JOYSTICK_CONFIG**: Input sensitivity and sizing
- **UI_CONFIG**: UI element dimensions and styling
- **ANIMATION_CONFIG**: Weapon animation frame ranges
- **COLORS**: Color scheme definitions
- **APP_LINKS**: Store links for mobile apps

### Target Configuration System

The game now supports multiple target layouts and configurations:

#### Available Layouts

1. **Linear**: Targets in a straight line (default)
2. **Circular**: Targets arranged in a circle
3. **Grid**: Targets in a rectangular grid
4. **V Formation**: Targets in a V-shaped formation
5. **Scattered**: Randomly positioned targets
6. **Pyramid**: Targets in a pyramid formation
7. **Moving**: Targets that move back and forth

#### Switching Configurations

- **Recommended:** Use the npm build scripts above to generate builds for each configuration.
- **Advanced:** You can still manually set the default config in `src/helpers/constants.js` for development, but for production builds, use the scripts for best results.

#### Configuration Properties

Each target configuration supports these properties:

- **layout**: Layout type ('linear', 'circular', 'grid', etc.)
- **count**: Number of targets
- **scale**: Target size multiplier
- **hp**: Health points per target
- **rotation**: Initial rotation of targets
- **basePosition/centerPosition**: Base position for layout
- **spacing**: Distance between targets
- **movement**: Movement settings for moving targets

#### Kill Count System

The game automatically calculates the required kills to win based on the current target configuration:

- **Dynamic Kill Count**: The win condition adapts to the number of targets in the current configuration
- **Safe Calculation**: Uses `Math.min(targetCount, KILL_COUNT_TO_WIN)` to ensure the game is always winnable
- **Special Layouts**: Grid and Pyramid layouts calculate their target count dynamically

**Example:**

- Linear layout (10 targets) → Win at 10 kills
- Circular layout (8 targets) → Win at 8 kills
- Moving layout (6 targets) → Win at 6 kills
- Grid layout (3×4 = 12 targets) → Win at 10 kills (capped by KILL_COUNT_TO_WIN)

## 🏛️ Design Patterns

### Event-Driven Architecture

Components communicate through the EventBus system, promoting loose coupling:

```javascript
// Subscribe to events
eventBus.on(GAME_OVER_EVENT_NAME, () => {
  // Handle game over
});

// Emit events
eventBus.emit(GAME_OVER_EVENT_NAME);
```

### Dependency Injection

Components receive their dependencies through constructor parameters:

```javascript
const playerController = new PlayerController(
  scene,
  weaponObj,
  weaponAnimObj,
  enableDebug,
  renderer,
  raycaster,
  eventBus
);
```

### Single Responsibility Principle

Each class has a single, well-defined responsibility:

- `GameManager`: Orchestration
- `Game`: Game state and logic
- `Renderer`: Rendering concerns
- `PlayerController`: Player behavior
- etc.

## 🚀 Performance Optimizations

- **Asset Caching**: FBX models are loaded once and cached
- **Efficient Rendering**: Only render when necessary
- **Memory Management**: Proper disposal of Three.js resources
- **Event Cleanup**: Automatic cleanup of event listeners

## 📱 Mobile Support

- Touch-optimized joystick controls
- Responsive UI scaling
- Mobile-specific app store links
- Touch event handling

## 🔄 Game Loop

1. **Input Processing**: Handle joystick input
2. **Game State Update**: Update player position, rotation, and game state
3. **Collision Detection**: Check for target hits
4. **Animation Update**: Update weapon and other animations
5. **Rendering**: Render the scene to the screen

## 🏹 Building for Different Target Configurations

You can build the game for each target configuration separately using the provided npm scripts. Each build will output to its own subdirectory under `dist/`.

### Build Scripts

- `npm run build:linear` → outputs to `dist/linear/`
- `npm run build:circular` → outputs to `dist/circular/`
- `npm run build:grid` → outputs to `dist/grid/`
- `npm run build:v_formation` → outputs to `dist/v_formation/`
- `npm run build:scattered` → outputs to `dist/scattered/`
- `npm run build:pyramid` → outputs to `dist/pyramid/`
- `npm run build:moving` → outputs to `dist/moving/`

To build all configurations at once:

```bash
npm run build:all
```

This will generate all variants in their respective folders under `dist/`.

### How it works

The build system uses the `--env TARGET_CONFIG_NAME=<CONFIG>` flag to select the target configuration at build time. You no longer need to manually edit `CURRENT_TARGET_CONFIG` in the code.
