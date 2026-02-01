import chalk from "./ansi.js";

export class SingleBar {
  constructor(options = {}) {
    this.options = options;
    this.total = 0;
    this.value = 0;
    this._startTime = Date.now();
  }

  start(total, startValue) {
    this.total = total;
    this.value = startValue;
    this.render();
  }

  update(value) {
    this.value = value;
    this.render();
  }

  increment() {
    this.value++;
    this.render();
  }

  stop() {
    this.render();
    process.stdout.write("\n");
  }

  render() {
    const percentage = Math.floor((this.value / this.total) * 100) || 0;
    const barWidth = 40;
    const filledWidth = Math.floor((percentage / 100) * barWidth);
    const bar = "█".repeat(filledWidth) + "░".repeat(barWidth - filledWidth);

    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(
      `Progress |${chalk.cyan(bar)}| ${percentage}% | ${this.value}/${this.total}`,
    );
  }
}

export const Presets = {
  shades_classic: {},
};

export default {
  SingleBar,
  Presets,
};
