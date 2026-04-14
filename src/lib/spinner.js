import chalk from "./ansi.js";

/**
 * Creates a terminal spinner instance.
 * @param {string} initialText - Initial text to display next to the spinner.
 * @returns {Object} Spinner instance with start() and stop() methods.
 */
export default function ora(initialText) {
  let interval;
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;

  const spinner = {
    text: initialText,
    /**
     * Starts the spinner animation.
     * Clears the current line and writes the spinner frame followed by the text.
     * Updates the spinner frame every 80ms.
     * @returns {Object} Spinner instance for chaining.
     */
    start() {
      if (interval) clearInterval(interval);
      interval = setInterval(() => {
        if (process.stdout?.isTTY && process.stdout.clearLine && process.stdout.cursorTo) {
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write(`${chalk.cyan(frames[i])} ${spinner.text}`);
        }
        i = (i + 1) % frames.length;
      }, 80);
      return this;
    },
    /**
     * Stops the spinner animation and cleans up the current line.
     * If the current line is a TTY, clears the line and moves the cursor to the start of the line.
     * @returns {Object} Spinner instance for chaining.
     */
    stop() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      if (process.stdout?.isTTY && process.stdout.clearLine && process.stdout.cursorTo) {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
      }
      return this;
    },
  };

  return spinner;
}
