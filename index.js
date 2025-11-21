/**
 * Super Slow Smooth Scroll
 *
 * A hybrid scrolling system that combines low-frequency native scrolling
 * with high-frequency CSS transform interpolation for smooth visual experience.
 *
 * @author Yamato Iizuka
 * @version 1.3.0
 * @license MIT
 */

// ========================================
// Default Configuration
// ========================================
const DEFAULTS = {
  speed: 30, // Pixels per second
  interpolation: true, // Enable transform interpolation
  bounce: false, // Reverse direction at boundaries
  direction: "down", // Scroll direction: 'up', 'down', 'left', 'right'
  autoplay: true, // Start scrolling automatically on creation
  onDirectionChange: null,
  onBoundaryReached: null,
};

const VALID_DIRECTIONS = ["up", "down", "left", "right"];
const SCROLL_AMOUNT = 1; // Fixed at 1px for Safari compatibility
const USER_SCROLL_TIMEOUT = 0; // Time in ms to wait before resuming auto-scroll

// ========================================
// Helper Functions
// ========================================

/**
 * Detect iOS and iPadOS devices
 * @returns {boolean} True if device is iOS or iPadOS
 */
function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// ========================================
// Main Function
// ========================================

/**
 * Creates a smooth scrolling instance with transform interpolation
 *
 * @param {Object} options - Configuration options
 * @param {string|HTMLElement} options.target - CSS selector or DOM element of scrollable container (required)
 * @param {string|HTMLElement} [options.interpolationTarget] - CSS selector or DOM element to apply interpolation transform (optional, defaults to target)
 * @param {number} [options.speed=30] - Scroll speed in pixels per second
 * @param {boolean} [options.interpolation=true] - Enable transform interpolation for smoothness
 * @param {boolean} [options.bounce=false] - Reverse direction when reaching boundaries
 * @param {string} [options.direction='down'] - Scroll direction: 'up', 'down', 'left', 'right'
 * @param {boolean} [options.autoplay=true] - Start scrolling automatically on creation
 * @param {Function} [options.onDirectionChange] - Callback when scroll direction changes
 * @param {Function} [options.onBoundaryReached] - Callback when boundary is reached (if bounce is false)
 * @returns {Object} Instance with start() and stop() methods
 *
 * @example
 * // With autoplay (default)
 * const scroller = createSlowScroll({
 *   target: '.project-grid',
 *   speed: 24,  // 24 pixels per second
 *   interpolation: true,
 *   bounce: true,
 *   direction: 'down'
 * });
 * // Scrolling starts automatically
 *
 * // Without autoplay
 * const scroller = createSlowScroll({
 *   target: '.project-grid',
 *   speed: 24,
 *   autoplay: false
 * });
 * // Manually start when needed
 * scroller.start();
 * // Later...
 * scroller.stop();
 *
 * // With DOM element (useful for React)
 * const element = document.querySelector('.project-grid');
 * const scroller = createSlowScroll({
 *   target: element,
 *   speed: 24
 * });
 */
export function createSlowScroll(options = {}) {
  // Validate required options
  if (!options.target) {
    throw new Error('SmoothScroll: "target" option is required');
  }

  // Validate target type
  const isString = typeof options.target === "string";
  const isElement = options.target instanceof HTMLElement;

  if (!isString && !isElement) {
    throw new Error(
      'SmoothScroll: "target" must be a CSS selector string or HTMLElement'
    );
  }

  // Validate direction
  const direction = options.direction ?? DEFAULTS.direction;
  if (!VALID_DIRECTIONS.includes(direction)) {
    throw new Error(
      `SmoothScroll: Invalid direction "${direction}". Must be one of: ${VALID_DIRECTIONS.join(
        ", "
      )}`
    );
  }

  // Speed in pixels per second
  const speed = options.speed ?? DEFAULTS.speed;

  // For Safari compatibility: always scroll 1px per update
  // Calculate FPS based on desired speed (speed px/s = fps * 1px)
  const fps = speed / SCROLL_AMOUNT;

  // Configuration
  const config = {
    target: options.target,
    interpolationTarget: options.interpolationTarget ?? null, // null means use target
    speed: speed,
    fps: fps,
    scrollAmount: SCROLL_AMOUNT,
    interpolation: options.interpolation ?? DEFAULTS.interpolation,
    bounce: options.bounce ?? DEFAULTS.bounce,
    direction: direction,
    autoplay: options.autoplay ?? DEFAULTS.autoplay,
    onDirectionChange: options.onDirectionChange ?? DEFAULTS.onDirectionChange,
    onBoundaryReached: options.onBoundaryReached ?? DEFAULTS.onBoundaryReached,
  };

  // Helper function to get current frame interval
  const getFrameInterval = () => 1000 / config.fps;

  // Determine axis and initial direction based on config
  const isVertical = config.direction === "up" || config.direction === "down";
  const isHorizontal =
    config.direction === "left" || config.direction === "right";

  // Initial scroll direction: 1 for down/right, -1 for up/left
  const getInitialDirection = () => {
    if (config.direction === "down" || config.direction === "right") return 1;
    if (config.direction === "up" || config.direction === "left") return -1;
    return 1;
  };

  // State
  let animationId = null;
  let scrollDirection = getInitialDirection();
  let lastScrollTime = null;
  let targetElement = null;
  let scrollContainer = null; // The actual scrollable container (element or window)
  let transformTarget = null; // The element to apply transform to (same as scrollContainer for elements)

  // User scroll detection state (iOS/iPadOS only)
  let userScrollTimer = null;
  let isUserScrolling = false;
  let userScrollHandler = null;
  let isAutoScrolling = false; // Flag to distinguish auto-scroll from user scroll
  let lastScrollPosition = 0; // Track scroll position to detect user scrolling
  let scrollStepFn = null; // Reference to scrollStep function for resuming

  /**
   * Helper functions to abstract scrolling operations
   */
  const scrollHelpers = {
    // Get current scroll position
    getScrollPosition: () => {
      if (scrollContainer === window) {
        return isVertical ? window.scrollY : window.scrollX;
      } else {
        return isVertical
          ? scrollContainer.scrollTop
          : scrollContainer.scrollLeft;
      }
    },

    // Get maximum scroll position
    getMaxScroll: () => {
      if (scrollContainer === window) {
        return isVertical
          ? document.documentElement.scrollHeight - window.innerHeight
          : document.documentElement.scrollWidth - window.innerWidth;
      } else {
        return isVertical
          ? scrollContainer.scrollHeight - scrollContainer.clientHeight
          : scrollContainer.scrollWidth - scrollContainer.clientWidth;
      }
    },

    // Perform scroll
    scrollBy: (amount) => {
      // Mark as auto-scrolling to distinguish from user scroll
      isAutoScrolling = true;

      if (scrollContainer === window) {
        if (isVertical) {
          window.scrollBy(0, amount);
        } else {
          window.scrollBy(amount, 0);
        }
      } else {
        if (isVertical) {
          scrollContainer.scrollTop += amount;
        } else {
          scrollContainer.scrollLeft += amount;
        }
      }

      // Update last scroll position immediately after scrolling
      lastScrollPosition = scrollHelpers.getScrollPosition();

      // Reset flag on next animation frame to ensure scroll event has fired
      requestAnimationFrame(() => {
        isAutoScrolling = false;
      });
    },
  };

  /**
   * Start the smooth scrolling
   */
  function start() {
    // Already running
    if (animationId !== null) {
      console.warn("SmoothScroll: Already running");
      return;
    }

    // Get scroll container (target)
    if (typeof config.target === "string") {
      targetElement = document.querySelector(config.target);
      if (!targetElement) {
        throw new Error(
          `SmoothScroll: Element not found for selector "${config.target}"`
        );
      }
    } else {
      targetElement = config.target;
    }

    // Determine scroll container
    // Check if target element is scrollable
    const style = window.getComputedStyle(targetElement);
    const overflowY = style.overflowY;
    const overflowX = style.overflowX;

    const isScrollableY =
      (overflowY === "auto" || overflowY === "scroll") &&
      targetElement.scrollHeight > targetElement.clientHeight;
    const isScrollableX =
      (overflowX === "auto" || overflowX === "scroll") &&
      targetElement.scrollWidth > targetElement.clientWidth;

    if ((isVertical && isScrollableY) || (isHorizontal && isScrollableX)) {
      // Target element itself is scrollable
      scrollContainer = targetElement;
    } else {
      // Use window scrolling
      scrollContainer = window;
    }

    // Get interpolation target
    if (config.interpolationTarget) {
      // User specified interpolation target
      if (typeof config.interpolationTarget === "string") {
        transformTarget = document.querySelector(config.interpolationTarget);
        if (!transformTarget) {
          throw new Error(
            `SmoothScroll: Interpolation target not found for selector "${config.interpolationTarget}"`
          );
        }
      } else {
        transformTarget = config.interpolationTarget;
      }
    } else {
      // Default: same as scroll container
      transformTarget =
        scrollContainer === window ? targetElement : scrollContainer;
    }

    // Apply performance CSS properties if interpolation is enabled
    if (config.interpolation && transformTarget) {
      transformTarget.style.willChange = "transform";
      transformTarget.style.backfaceVisibility = "hidden";
    }

    lastScrollTime = null;
    lastScrollPosition = scrollHelpers.getScrollPosition();

    function scrollStep(currentTime) {
      // Initialize on first frame
      if (lastScrollTime === null) {
        lastScrollTime = currentTime;
      }

      const elapsed = currentTime - lastScrollTime;
      const frameInterval = getFrameInterval();

      // Execute actual scroll when frame interval has passed
      if (elapsed >= frameInterval) {
        // Boundary check based on direction
        let atBoundary = false;
        let boundaryType = null;

        const maxScroll = scrollHelpers.getMaxScroll();
        const currentScroll = scrollHelpers.getScrollPosition();

        if (isVertical) {
          // Check if reached bottom
          if (scrollDirection === 1 && currentScroll >= maxScroll - 1) {
            atBoundary = true;
            boundaryType = "bottom";
          }
          // Check if reached top
          else if (scrollDirection === -1 && currentScroll <= 1) {
            atBoundary = true;
            boundaryType = "top";
          }
        } else if (isHorizontal) {
          // Check if reached right
          if (scrollDirection === 1 && currentScroll >= maxScroll - 1) {
            atBoundary = true;
            boundaryType = "right";
          }
          // Check if reached left
          else if (scrollDirection === -1 && currentScroll <= 1) {
            atBoundary = true;
            boundaryType = "left";
          }
        }

        // Handle boundary
        if (atBoundary) {
          if (config.bounce) {
            // Reverse direction
            scrollDirection *= -1;

            // Determine new direction name
            let newDirectionName = "";
            if (isVertical) {
              newDirectionName = scrollDirection === 1 ? "down" : "up";
            } else {
              newDirectionName = scrollDirection === 1 ? "right" : "left";
            }

            if (config.onDirectionChange) {
              config.onDirectionChange(newDirectionName);
            }
          } else {
            // Stop scrolling
            if (config.onBoundaryReached) {
              config.onBoundaryReached(boundaryType);
            }
            stop();
            return;
          }
        }

        // Execute actual scroll
        scrollHelpers.scrollBy(config.scrollAmount * scrollDirection);

        // Reset transform (if interpolation is enabled)
        if (config.interpolation && transformTarget) {
          transformTarget.style.transform = "translate3d(0, 0, 0)";
        }

        // Update last scroll time
        lastScrollTime = currentTime;
      } else if (config.interpolation && transformTarget) {
        // Intermediate frames: interpolate with transform (only if enabled)
        const progress = elapsed / frameInterval; // 0-1
        const interpolation = config.scrollAmount * progress * scrollDirection;

        // Apply transform in opposite direction (pre-compensate for next scroll)
        if (isVertical) {
          transformTarget.style.transform = `translate3d(0, ${-interpolation}px, 0)`;
        } else {
          transformTarget.style.transform = `translate3d(${-interpolation}px, 0, 0)`;
        }
      }

      animationId = requestAnimationFrame(scrollStep);
    }

    // Store reference to scrollStep for resuming after user scroll
    scrollStepFn = scrollStep;

    animationId = requestAnimationFrame(scrollStep);

    // Setup user scroll detection for iOS/iPadOS
    if (isIOSDevice()) {
      userScrollHandler = function handleUserScroll() {
        // Ignore scroll events triggered by auto-scrolling
        if (isAutoScrolling) {
          return;
        }

        // Detect if this is a user-initiated scroll
        const currentScroll = scrollHelpers.getScrollPosition();
        const scrollDelta = Math.abs(currentScroll - lastScrollPosition);

        // Only react if scroll change is larger than auto-scroll amount
        // This helps distinguish user scrolling from auto-scrolling
        if (scrollDelta > config.scrollAmount * 2) {
          // If not already paused by user scroll
          if (!isUserScrolling && animationId !== null) {
            isUserScrolling = true;
            // Pause auto-scroll
            cancelAnimationFrame(animationId);
            animationId = null;
          }

          // Clear existing timer
          if (userScrollTimer) {
            clearTimeout(userScrollTimer);
          }

          // Set timer to resume auto-scroll after user stops scrolling
          userScrollTimer = setTimeout(() => {
            if (isUserScrolling) {
              isUserScrolling = false;
              // Resume auto-scroll
              lastScrollTime = null;
              lastScrollPosition = scrollHelpers.getScrollPosition();
              animationId = requestAnimationFrame(scrollStepFn);
            }
          }, USER_SCROLL_TIMEOUT);
        }
      };

      // Attach scroll event listener
      scrollContainer.addEventListener("scroll", userScrollHandler, {
        passive: true,
      });
    }
  }

  /**
   * Stop the smooth scrolling
   */
  function stop() {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
      lastScrollTime = null;

      // Reset transform and CSS properties (if interpolation is enabled)
      if (transformTarget && config.interpolation) {
        transformTarget.style.transform = "translate3d(0, 0, 0)";
        transformTarget.style.willChange = "auto";
        transformTarget.style.backfaceVisibility = "visible";
      }

      // Cleanup user scroll detection (iOS/iPadOS)
      if (userScrollHandler && scrollContainer) {
        scrollContainer.removeEventListener("scroll", userScrollHandler);
        userScrollHandler = null;
      }
      if (userScrollTimer) {
        clearTimeout(userScrollTimer);
        userScrollTimer = null;
      }
      isUserScrolling = false;
      isAutoScrolling = false;
      scrollStepFn = null;

      targetElement = null;
      scrollContainer = null;
      transformTarget = null;
    }
  }

  /**
   * Get current configuration
   */
  function getConfig() {
    return { ...config };
  }

  /**
   * Check if currently running
   */
  function isRunning() {
    return animationId !== null;
  }

  /**
   * Update scroll speed
   * @param {number} newSpeed - New speed in pixels per second
   */
  function setSpeed(newSpeed) {
    if (typeof newSpeed !== "number" || newSpeed <= 0) {
      console.warn(
        "SmoothScroll: Invalid speed value. Must be a positive number."
      );
      return;
    }

    const wasRunning = isRunning();

    // Stop current animation
    if (wasRunning) {
      stop();
    }

    // Update config
    config.speed = newSpeed;
    config.fps = newSpeed / SCROLL_AMOUNT;

    // Restart if it was running
    if (wasRunning) {
      start();
    }
  }

  // Auto-start if enabled
  if (config.autoplay) {
    start();
  }

  // Return public API
  return {
    start,
    stop,
    getConfig,
    isRunning,
    setSpeed,
  };
}

/**
 * Default export for CommonJS/UMD compatibility
 */
export default createSlowScroll;
