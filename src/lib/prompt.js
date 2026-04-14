import readline from "node:readline";
import chalk from "./ansi.js";

const isRaw = process.stdout.isTTY;

/**
 * Prompt the user with a sequence of questions and collect responses.
 * @param {Array<Object>} questions - Array of question objects. Each object must include `type` ('confirm', 'checkbox', or 'list') and `name`. For `confirm` provide `message`. For `checkbox` and `list` provide `choices` (array of strings or objects with `name` and `value`); `checkbox` may also include an optional `header`.
 * @returns {Object} An object mapping each question `name` to its answer: for `confirm` a boolean; for `checkbox` an array of selected values (for string choices the string is used as both label and value); for `list` the selected value or `null` if there are no choices.
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
 * Prompt the user to select one or more choices from a checkbox-style list.
 *
 * In non-TTY environments, prints the message and numbered choices, reads a single line
 * of numbers (space-separated), and treats an empty input as selecting all choices.
 * The optional `header` is displayed above the prompt and may contain newlines.
 *
 * @param {Object} q - Question configuration.
 * @param {string} q.message - Prompt message displayed to the user.
 * @param {Array<string|Object>} q.choices - Choices to present. Each item may be a string (used as both label and value) or an object with `name` (label) and `value`.
 * @param {string} [q.header] - Optional header text shown above the prompt.
 * @returns {Array<any>} An array of the selected choice `value`s; for string choices the string is used as both label and value.
 */
async function checkboxPrompt(q) {
  if (!isRaw) {
    // Fallback for non-TTY
    console.log(`${chalk.green("?")} ${q.message}`);
    q.choices.forEach((c, i) => {
      console.log(`  ${i + 1}) ${c.name || c}`);
    });
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
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

  return new Promise((resolve, reject) => {
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

    /**
     * Clean up after the user has finished interacting with the checkbox prompt.
     *
     * Restores the terminal to its original state.
     */
    const cleanup = () => {
      process.stdin.removeListener("data", onData);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
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

    /**
     * Handles data input from the user.
     *
     * @param {string} data - A single character of user input.
     *
     * Handles the following keys:
     *   - Ctrl+C: Exits the program.
     *   - Enter: Submits the current selection.
     *   - Space: Toggles the selected state of the current item.
     *   - A: Toggles the selected state of all items.
     *   - Up/Down arrow: Moves the cursor up/down.
     */
    const onData = (data) => {
      const key = data.toString();
      if (key === "\u0003") {
        cleanup();
        process.emit("SIGINT");
        const error = new Error("User interrupted");
        error.isTtyError = true;
        reject(error);
        return;
      } else if (key === "\r" || key === "\n") {
        cleanup();
        resolve(Array.from(selected).map((i) => choices[i].value));
        return;
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
 * Show a single-choice list prompt and return the chosen option's value.
 *
 * Presents `q.choices` as either strings (used as both label and value) or objects
 * of shape `{ name, value }`. In a non-TTY environment the first choice is returned
 * immediately; in a TTY environment an interactive arrow-key UI is presented.
 *
 * @param {Object} q - Question object.
 * @param {string} q.message - Prompt message displayed above the list.
 * @param {(string|{name:string,value:any})[]} q.choices - Choices to present; each item may be a string (used for both label and value) or an object with `name` (label) and `value`.
 * @returns {any} The selected choice's `value`, or `null` if `q.choices` is empty.
 */
async function listPrompt(q) {
  const choices = q.choices.map((c) => (typeof c === "string" ? { name: c, value: c } : c));

  if (choices.length === 0) return null;
  if (!isRaw) {
    return choices[0].value;
  }

  return new Promise((resolve, reject) => {
    let cursor = 0;

    /**
     * Render the single-choice list prompt.
     * This function is responsible for drawing the prompt in the terminal.
     */
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

    /**
     * Clean up after the user has finished interacting with the single-choice list prompt.
     *
     * Restores the terminal to its original state.
     */
    const cleanup = () => {
      process.stdin.removeListener("data", onData);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdout.write("\x1B[?25h"); // Show cursor
      for (let i = 0; i < choices.length + 3; i++) {
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine(0);
      }
    };

    /**
     * Handles data input from the user.
     *
     * @param {string} data - A single character of user input.
     *
     * Handles the following keys:
     *   - Ctrl+C: Exits the program.
     *   - Enter: Submits the current selection.
     *   - Up arrow: Moves the cursor up.
     *   - Down arrow: Moves the cursor down.
     */
    const onData = (data) => {
      const key = data.toString();
      if (key === "\u0003") {
        cleanup();
        process.emit("SIGINT");
        const error = new Error("User interrupted");
        error.isTtyError = true;
        reject(error);
        return;
      } else if (key === "\r" || key === "\n") {
        cleanup();
        resolve(choices[cursor].value);
        return;
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
