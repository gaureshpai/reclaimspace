import chalk from "./ansi.js";

export default function ora(text) {
  let interval;
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;

  return {
    start() {
      interval = setInterval(() => {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(`${chalk.cyan(frames[i])} ${text}`);
        i = (i + 1) % frames.length;
      }, 80);
      return this;
    },
    stop() {
      if (interval) {
        clearInterval(interval);
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
      }
      return this;
    },
  };
}
