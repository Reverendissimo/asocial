/**
 * Asocial Debug Utility
 * Centralized debug logging with conditional enable/disable
 */

class AsocialDebug {
  constructor() {
    this.enabled = false; // Set to true to enable debug logging
    this.prefix = '[ASOCIAL]';
  }

  /**
   * Enable debug logging
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable debug logging
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Check if debug is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Debug log (only if enabled)
   */
  log(message, ...args) {
    if (this.enabled) {
      console.log(`${this.prefix} ${message}`, ...args);
    }
  }

  /**
   * Debug error (always shown)
   */
  error(message, ...args) {
    console.error(`${this.prefix} ERROR: ${message}`, ...args);
  }

  /**
   * Debug warn (always shown)
   */
  warn(message, ...args) {
    console.warn(`${this.prefix} WARN: ${message}`, ...args);
  }

  /**
   * Debug info (only if enabled)
   */
  info(message, ...args) {
    if (this.enabled) {
      console.info(`${this.prefix} INFO: ${message}`, ...args);
    }
  }

  /**
   * Debug group start
   */
  group(label) {
    if (this.enabled) {
      console.group(`${this.prefix} ${label}`);
    }
  }

  /**
   * Debug group end
   */
  groupEnd() {
    if (this.enabled) {
      console.groupEnd();
    }
  }
}

// Create global debug instance
const debug = new AsocialDebug();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = debug;
} else {
  window.AsocialDebug = debug;
}

