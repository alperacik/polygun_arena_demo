# Polygun Arena - Refactored

A 3D shooting game built with Three.js, featuring a modular and maintainable architecture.

## 🏗️ Architecture Overview

The codebase has been refactored to follow clean architecture principles with clear separation of concerns:

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
- **JOYSTICK_CONFIG**: Input sensitivity and sizing
- **UI_CONFIG**: UI element dimensions and styling
- **ANIMATION_CONFIG**: Weapon animation frame ranges
- **COLORS**: Color scheme definitions
- **APP_LINKS**: Store links for mobile apps

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
