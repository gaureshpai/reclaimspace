import readline from "node:readline";
import chalk from "./ansi.js";

const isRaw = process.stdout.isTTY;

/**
 * Utility for interactive CLI prompts.
 * @param {Array<Object>} questions - List of question objects.
 * @returns {Promise<Object>} Object containing answers.
 */
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
          const normalized = input.trim().toLowerCase();
          resolve(!normalized.startsWith("n"));
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

/**
 * Present a checkbox-style prompt and return the values the user selects.
 *
 * @param {Object} q - Question configuration.
 * @param {string} q.message - Prompt message displayed to the user.
 * @param {Array<string|Object>} q.choices - Array of choices; each item may be a string (used for both label and value) or an object with `name` (label) and `value`.
 * @param {string} [q.header] - Optional header text shown above the prompt; may contain newlines.
 * @returns {Array<any>} An array of the selected choice `value`s (or the choice itself when a string was provided).
 */
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
    const headerLines = q.header ? q.header.split("\n") : [];

    // Viewport management
    const computedRowsFallback = process.stdout.rows
      ? process.stdout.rows - 5 - headerLines.length
      : 10;
    const pageSize = Math.max(1, Math.min(choices.length, computedRowsFallback));
    let viewportStart = 0;

    const render = () => {
      process.stdout.write("\x1B[?25l"); // Hide cursor

      if (q.header) {
        process.stdout.write(`${q.header}\n`);
      }

      process.stdout.write(`${chalk.green("?")} ${chalk.bold(q.message)}\n`);

      if (cursor < viewportStart) {
        viewportStart = cursor;
      } else if (cursor >= viewportStart + pageSize) {
        viewportStart = cursor - pageSize + 1;
      }

      const viewportEnd = Math.min(viewportStart + pageSize, choices.length);
      const visibleChoices = choices.slice(viewportStart, viewportEnd);

      if (viewportStart > 0) {
        process.stdout.write(chalk.dim("  ↑ (More items above)\n"));
      }

      visibleChoices.forEach((c, index) => {
        const i = viewportStart + index;
        const isSelected = selected.has(i);
        const isCursor = i === cursor;
        const prefix = isCursor ? chalk.cyan("❯") : " ";
        const check = isSelected ? chalk.green("◉") : "○";
        process.stdout.write(`${prefix} ${check} ${c.name}\n`);
      });

      if (viewportEnd < choices.length) {
        process.stdout.write(chalk.dim("  ↓ (More items below)\n"));
      }

      process.stdout.write(
        chalk.dim("\n(Use arrow keys to move, space to select, a to toggle all, enter to proceed)"),
      );
    };

    const cleanup = () => {
      process.stdin.removeListener("data", onData);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdin.pause();
      process.stdout.write("\x1B[?25h");

      const visibleLines = Math.min(pageSize, choices.length);
      const scrollIndicators =
        (viewportStart > 0 ? 1 : 0) + (viewportStart + pageSize < choices.length ? 1 : 0);
      const totalLines = headerLines.length + 1 + visibleLines + scrollIndicators + 2;

      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);

      for (let i = 1; i < totalLines; i++) {
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine(0);
      }
    };

    const onData = (data) => {
      const key = data.toString();
      if (key === "\u0003") {
        cleanup();
        process.exit();
      } else if (key === "\r" || key === "\n") {
        cleanup();
        resolve(Array.from(selected).map((i) => choices[i].value));
      } else if (key === " ") {
        if (selected.has(cursor)) {
          selected.delete(cursor);
        } else {
          selected.add(cursor);
        }
      } else if (key === "a") {
        if (selected.size === choices.length) {
          selected.clear();
        } else {
          choices.forEach((_, i) => {
            selected.add(i);
          });
        }
      } else if (key === "\u001b[A") {
        cursor = (cursor - 1 + choices.length) % choices.length;
      } else if (key === "\u001b[B") {
        cursor = (cursor + 1) % choices.length;
      }

      const currentVisibleLines = Math.min(pageSize, choices.length);
      const currentScrollIndicators =
        (viewportStart > 0 ? 1 : 0) + (viewportStart + pageSize < choices.length ? 1 : 0);
      const linesToClear =
        headerLines.length + 1 + currentVisibleLines + currentScrollIndicators + 2;

      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);

      for (let i = 1; i < linesToClear; i++) {
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine(0);
      }
      render();
    };

    render();

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on("data", onData);
    }
  });
}

/**
 * Interactive list prompt for selecting a single item.
 * @param {Object} q - Question object.
 * @returns {Promise<any>} Selected value.
 */
async function listPrompt(q) {
  const choices = q.choices.map((c) => (typeof c === "string" ? { name: c, value: c } : c));

  if (choices.length === 0) return null;
  if (!isRaw) {
    return choices[0].value;
  }

  return new Promise((resolve) => {
    let cursor = 0;

    const render = () => {
      process.stdout.write("\x1B[?25l"); // Hide cursor
      process.stdout.write(`${chalk.green("?")} ${chalk.bold(q.message)}\n`);

      choices.forEach((c, i) => {
        const isCursor = i === cursor;
        const prefix = isCursor ? chalk.cyan("❯") : " ";
        process.stdout.write(`${prefix} ${c.name}\n`);
      });

      process.stdout.write(chalk.dim("\n(Use arrow keys to move, enter to select)"));
    };

    const cleanup = () => {
      process.stdin.removeListener("data", onData);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdin.pause();
      process.stdout.write("\x1B[?25h"); // Show cursor
      for (let i = 0; i < choices.length + 3; i++) {
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine(0);
      }
    };

    const onData = (data) => {
      const key = data.toString();
      if (key === "\u0003") {
        cleanup();
        process.exit();
      } else if (key === "\r" || key === "\n") {
        cleanup();
        resolve(choices[cursor].value);
      } else if (key === "\u001b[A") {
        // Up
        cursor = (cursor - 1 + choices.length) % choices.length;
      } else if (key === "\u001b[B") {
        // Down
        cursor = (cursor + 1) % choices.length;
      }

      for (let i = 0; i < choices.length + 2; i++) {
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine(0);
      }
      render();
    };

    render(); // Initial render

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on("data", onData);
    }
  });
}

export default { prompt };
