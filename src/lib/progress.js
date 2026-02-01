import readline from "node:readline";
import chalk from "./ansi.js";

/**
 * A simple ASCII progress bar for TTY environments.
 */
export class SingleBar {
  constructor(options = {}) {
    this.options = options;
    this.total = 0;
    this.value = 0;
    this._startTime = Date.now();
  }

  /**
   * Starts the progress bar.
   * @param {number} total - Total value for 100%.
   * @param {number} [startValue=0] - Initial value.
   */
  start(total, startValue = 0) {
    this.total = Math.max(0, Number(total) || 0);
    this.value = Math.max(0, Number(startValue) || 0);
    this.render();
  }

  /**
   * Updates the current progress value.
   * @param {number} value - New progress value.
   */
  update(value) {
    this.value = Math.max(0, Number(value) || 0);
    this.render();
  }

  /**
   * Increments the current progress value by 1.
   */
  increment() {
    this.value++;
    this.render();
  }

  /**
   * Stops the progress bar and cleans up the line.
   */
  stop() {
    this.render();
    if (process.stdout.isTTY) {
      process.stdout.write("\n");
    }
  }

  /**
   * Renders the progress bar to stdout if TTY is enabled.
   */
  render() {
    if (!process.stdout.isTTY) return;

    const percentage =
      this.total > 0 ? Math.min(100, Math.floor((this.value / this.total) * 100)) : 0;
    const barWidth = 40;
    const filledWidth = Math.floor((percentage / 100) * barWidth);

    const completeChar = this.options.barCompleteChar || "█";
    const incompleteChar = this.options.barIncompleteChar || "░";
    const bar = completeChar.repeat(filledWidth) + incompleteChar.repeat(barWidth - filledWidth);

    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);

    if (this.options.format) {
      const output = this.options.format
        .replace("{bar}", bar)
        .replace("{percentage}", percentage)
        .replace("{value}", this.value)
        .replace("{total}", this.total);
      process.stdout.write(output);
    } else {
      process.stdout.write(
        `Progress |${chalk.cyan(bar)}| ${percentage}% | ${this.value}/${this.total}`,
      );
    }
  }
}

export const Presets = {
  shades_classic: {},
};

export default {
  SingleBar,
  Presets,
};
