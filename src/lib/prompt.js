import readline from "node:readline";
import chalk from "./ansi.js";

const isRaw = process.stdin.isTTY;

export async function prompt(questions) {
  const result = {};

  for (const q of questions) {
    if (q.type === "confirm") {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      const answer = await new Promise((resolve) => {
        rl.question(`${chalk.green("?")} ${q.message} (Y/n) `, (input) => {
          resolve(input.toLowerCase() !== "n");
        });
      });
      rl.close();
      result[q.name] = answer;
    } else if (q.type === "checkbox") {
      result[q.name] = await checkboxPrompt(q);
    } else if (q.type === "list") {
      result[q.name] = await listPrompt(q);
    }
  }

  return result;
}

async function checkboxPrompt(q) {
  if (!isRaw) {
    // Fallback for non-TTY
    console.log(`${chalk.green("?")} ${q.message}`);
    q.choices.forEach((c, i) => {
      console.log(`  ${i + 1}) ${c.name || c}`);
    });
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((resolve) => {
      rl.question(`Enter numbers separated by space (empty for all): `, (input) => {
        if (!input.trim()) return resolve(q.choices.map((c) => c.value || c));
        const nums = input.split(/\s+/).map((n) => parseInt(n, 10) - 1);
        resolve(nums.filter((n) => q.choices[n]).map((n) => q.choices[n].value || q.choices[n]));
      });
    });
    rl.close();
    return answer;
  }

  return new Promise((resolve) => {
    let cursor = 0;
    const selected = new Set();
    const choices = q.choices.map((c) => (typeof c === "string" ? { name: c, value: c } : c));

    const render = () => {
      process.stdout.write("\x1B[?25l"); // Hide cursor
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`${chalk.green("?")} ${chalk.bold(q.message)}\n`);

      choices.forEach((c, i) => {
        const isSelected = selected.has(i);
        const isCursor = i === cursor;
        const prefix = isCursor ? chalk.cyan("❯") : " ";
        const check = isSelected ? chalk.green("◉") : "◯";
        console.log(`${prefix} ${check} ${c.name}`);
      });

      process.stdout.write(
        chalk.dim(
          "\n(Use arrow keys to move, space to select, a to toggle all, enter to proceed)",
        ),
      );
    };

    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\x1B[?25h"); // Show cursor
      // Clear the prompt lines
      for (let i = 0; i < choices.length + 3; i++) {
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine(0);
      }
    };

    render();

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", (data) => {
      const key = data.toString();
      if (key === "\u0003") {
        // Ctrl+C
        cleanup();
        process.exit();
      } else if (key === "\r" || key === "\n") {
        // Enter
        cleanup();
        resolve(Array.from(selected).map((i) => choices[i].value));
      } else if (key === " ") {
        // Space
        if (selected.has(cursor)) {
          selected.delete(cursor);
        } else {
          selected.add(cursor);
        }
      } else if (key === "a") {
        // Toggle all
        if (selected.size === choices.length) {
          selected.clear();
        } else {
          choices.forEach((_, i) => {
            selected.add(i);
          });
        }
      } else if (key === "\u001b[A") {
        // Up
        cursor = (cursor - 1 + choices.length) % choices.length;
      } else if (key === "\u001b[B") {
        // Down
        cursor = (cursor + 1) % choices.length;
      }

      // Move cursor back up to re-render
      for (let i = 0; i < choices.length + 2; i++) {
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine(0);
      }
      render();
    });
  });
}

async function listPrompt(q) {
  // Similar logic for list...
  return q.choices[0]?.value || q.choices[0];
}

export default { prompt };
