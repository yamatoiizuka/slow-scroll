# Super Slow Smooth Scroll (ssss)

Enables smooth and slow scrolling across all browsers.

**[View Demo](https://yamatoiizuka.github.io/ssss/)**

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
npm install ssss
```

```javascript
import createSmoothScroll from "ssss";
```

## Usage

### Basic Example

```javascript
import createSmoothScroll from "ssss";

// Create instance - starts automatically (autoplay: true by default)
const scroller = createSmoothScroll({
  target: ".content", // Scrollable container (required)
  interpolationTarget: ".inner", // Element to apply interpolation (optional, defaults to target)
  speed: 30, // Pixels per second (default: 30)
  interpolation: true, // Enable interpolation (default: true)
  bounce: false, // Reverse at boundaries (default: false)
  direction: "down", // Scroll direction (default: 'down')
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
const scroller = createSmoothScroll({
  target: ".scrollable-container", // Element with overflow: auto
  interpolationTarget: ".inner-content", // Element to apply smooth interpolation
  speed: 20,
  interpolation: true,
});
```

### Manual Control (Without Autoplay)

```javascript
const scroller = createSmoothScroll({
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

### With Bounce Effect

```javascript
const scroller = createSmoothScroll({
  target: ".content",
  speed: 24, // 24 pixels per second
  bounce: true, // Enable bounce at boundaries
  onDirectionChange: (direction) => {
    console.log(`Now scrolling: ${direction}`); // 'up', 'down', 'left', or 'right'
  },
});
// Starts automatically
```

### Horizontal Scrolling

```javascript
const scroller = createSmoothScroll({
  target: ".horizontal-content",
  direction: "right", // Scroll horizontally
  speed: 30,
});
// Starts automatically
```

### Without Interpolation (Compare Performance)

```javascript
const scroller = createSmoothScroll({
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
console.log(`Speed: ${config.speed}px/s, Direction: ${config.direction}`);
```

**Notes:**

- `speed` directly controls pixels per second (e.g., `speed: 24` = 24px/second)
- When `bounce` is `false`, scrolling stops when reaching page boundaries
- When `bounce` is `true`, scroll direction automatically reverses at boundaries

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
