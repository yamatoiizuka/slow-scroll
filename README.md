# Super Slow Smooth Scroll

Enables smooth and slow scrolling across all browsers.

**[View Demo](https://yamatoiizuka.github.io/slow-scroll/)**

### How It Works

```
Time:    0ms          16ms         33ms         50ms         66ms (next scroll)
         │            │            │            │            │
Scroll:  scrollBy(1px)                                       scrollBy(1px)
         │            │            │            │            │
Visual:  translate(0) (-0.25px)    (-0.5px)     (-0.75px)    translate(0)
         │            │            │            │            │
Result:  [------------- Appears smooth at 60fps -------------]
```

The target element uses `translateY` to visually interpolate between actual scroll updates, appearing smooth at the device's native refresh rate.

## Installation

### npm

```bash
npm install slow-scroll
```

```javascript
import createSlowScroll from "slow-scroll";
```

## Usage

### Basic Example

```javascript
import createSlowScroll from "slow-scroll";

// Create instance - starts automatically (autoplay: true by default)
const scroller = createSlowScroll({
  target: ".content", // Scrollable container (required)
  interpolationTarget: ".inner", // Element to apply interpolation (optional, defaults to target)
  speed: 30, // Pixels per second - positive = down/right, negative = up/left (default: 30)
  interpolation: true, // Enable interpolation (default: true)
  bounce: false, // Reverse at boundaries (default: false)
  isHorizontal: false, // Scroll horizontally instead of vertically (default: false)
  autoplay: true, // Start automatically (default: true)
});

// Stop scrolling when needed
scroller.stop();

// Restart if stopped
scroller.start();
```

**Recommended speed**: 15-30 px/s for best balance between smoothness and performance.

### Separate Interpolation Target

When you want to scroll one element but apply interpolation to another (useful for complex layouts):

```javascript
const scroller = createSlowScroll({
  target: ".scrollable-container", // Element with overflow: auto
  interpolationTarget: ".inner-content", // Element to apply smooth interpolation
  speed: 20,
  interpolation: true,
});
```

### Manual Control (Without Autoplay)

```javascript
const scroller = createSlowScroll({
  target: ".content",
  speed: 30,
  autoplay: false, // Disable autoplay
});

// Start manually when needed
document.getElementById("startBtn").addEventListener("click", () => {
  scroller.start();
});

document.getElementById("stopBtn").addEventListener("click", () => {
  scroller.stop();
});
```

### With Bounce Effect ↕︎

```javascript
const scroller = createSlowScroll({
  target: ".content",
  speed: 24, // 24 pixels per second
  bounce: true, // Enable bounce at boundaries
  onDirectionChange: (direction) => {
    console.log(`Now scrolling: ${direction}`); // 'up', 'down', 'left', or 'right'
  },
});
// Starts automatically
```

**Notes:**
- When `bounce` is `false`, scrolling stops when reaching page boundaries
- When `bounce` is `true`, scroll direction automatically reverses at boundaries

### Horizontal Scrolling →

```javascript
const scroller = createSlowScroll({
  target: ".horizontal-content",
  isHorizontal: true, // Enable horizontal scrolling
  speed: 30, // Scroll right at 30px/s
});
// Starts automatically
```

### Reverse Direction Scrolling ↑←

Use negative speed values to scroll in the opposite direction:

```javascript
// Scroll up instead of down
const upScroller = createSlowScroll({
  target: ".content",
  speed: -30, // Negative speed = scroll up
});

// Scroll left instead of right
const leftScroller = createSlowScroll({
  target: ".horizontal-content",
  isHorizontal: true,
  speed: -30, // Negative speed = scroll left
});
```

### Pause on User Interaction

Pause scrolling when user touches or moves mouse over the scroll area:

```javascript
const scroller = createSlowScroll({
  target: ".content",
  speed: 30,
  pauseOnTouch: true, // Pause when user touches (useful for mobile/tablet)
  pauseOnMouseMove: true, // Pause when mouse is moving (useful for desktop)
});
// Scrolling automatically resumes when user stops interacting
```

**Use cases:**
- `pauseOnTouch`: Prevents auto-scroll from interfering with user's touch scrolling on mobile devices
- `pauseOnMouseMove`: Pauses when user moves mouse, allowing them to interact with content
- Both options work together - enable one or both based on your needs

### Dynamic Speed Control

```javascript
const scroller = createSlowScroll({
  target: ".content",
  speed: 30,
});

// Change speed dynamically (automatically restarts if running)
scroller.setSpeed(50); // Speed up to 50px/s
scroller.setSpeed(15); // Slow down to 15px/s

// Example: Speed control with buttons
document.getElementById("speedUpBtn").addEventListener("click", () => {
  const config = scroller.getConfig();
  scroller.setSpeed(config.speed + 10);
});

document.getElementById("slowDownBtn").addEventListener("click", () => {
  const config = scroller.getConfig();
  scroller.setSpeed(Math.max(5, config.speed - 10)); // Minimum 5px/s
});
```

### Without Interpolation (Compare Performance)

```javascript
const scroller = createSlowScroll({
  target: ".content",
  speed: 15, // 15 pixels per second
  interpolation: false, // Disable for comparison
  onBoundaryReached: (boundary) => {
    console.log(`Reached ${boundary}, stopping`); // 'top', 'bottom', 'left', or 'right'
  },
});
// Starts automatically
```

### Check Status

```javascript
// Check if currently running
if (scroller.isRunning()) {
  console.log("Scrolling is active");
}

// Get current configuration
const config = scroller.getConfig();
console.log(`Speed: ${config.speed}px/s, Horizontal: ${config.isHorizontal}`);
```

## API Reference

### Methods

| Method               | Parameters         | Returns   | Description                                                                   |
| -------------------- | ------------------ | --------- | ----------------------------------------------------------------------------- |
| `start()`            | None               | `void`    | Starts the auto-scrolling. Does nothing if already running.                   |
| `stop()`             | None               | `void`    | Stops the auto-scrolling and resets transform states.                         |
| `setSpeed(newSpeed)` | `newSpeed: number` | `void`    | Updates scroll speed in pixels per second. Automatically restarts if running. |
| `isRunning()`        | None               | `boolean` | Returns `true` if currently scrolling, `false` otherwise.                     |
| `getConfig()`        | None               | `object`  | Returns a copy of the current configuration object.                           |

### Configuration Options

| Option                | Type                    | Default      | Description                                                                                                                                                                   |
| --------------------- | ----------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `target`              | `string \| HTMLElement` | **Required** | CSS selector or DOM element of the scrollable container.                                                                                                                      |
| `interpolationTarget` | `string \| HTMLElement` | `null`       | CSS selector or DOM element to apply interpolation transform. If not specified, uses `target` for window scrolling, or the scrollable container itself for element scrolling. |
| `speed`               | `number`                | `30`         | Scroll speed in pixels per second (e.g., `24` = 24px/second). Positive values scroll down/right, negative values scroll up/left. Use `0` to pause.                            |
| `interpolation`       | `boolean`               | `true`       | Enable transform interpolation for smooth visual experience.                                                                                                                  |
| `bounce`              | `boolean`               | `false`      | Reverse scroll direction when reaching boundaries.                                                                                                                            |
| `isHorizontal`        | `boolean`               | `false`      | Scroll horizontally instead of vertically.                                                                                                                                    |
| `autoplay`            | `boolean`               | `true`       | Start scrolling automatically when instance is created.                                                                                                                       |
| `pauseOnTouch`        | `boolean`               | `false`      | Pause scrolling when user touches the scroll area (useful for mobile).                                                                                                        |
| `pauseOnMouseMove`    | `boolean`               | `false`      | Pause scrolling when mouse is moving over the scroll area.                                                                                                                    |
| `onDirectionChange`   | `function`              | `null`       | Callback function called when scroll direction changes (with bounce enabled). Receives new direction as parameter.                                                            |
| `onBoundaryReached`   | `function`              | `null`       | Callback function called when boundary is reached (with bounce disabled). Receives boundary type as parameter.                                                                |

## Development

### Run Demo Locally

```bash
cd demo
npm install
npm run dev
```

Opens the demo at `http://localhost:3000`

## License

MIT

## Author

Yamato Iizuka
