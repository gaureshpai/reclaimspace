import { prompt } from "../src/lib/prompt.js";
import readline from "node:readline";

// Mock readline
jest.mock("node:readline");

describe("prompt", () => {
  let mockRl;
  let originalIsTTY;

  beforeEach(() => {
    // Save original isTTY
    originalIsTTY = process.stdout.isTTY;

    // Set to non-TTY mode for testing (uses fallback mode)
    Object.defineProperty(process.stdout, "isTTY", {
      value: false,
      configurable: true,
    });

    // Reset all mocks
    jest.clearAllMocks();

    // Mock readline interface
    mockRl = {
      question: jest.fn(),
      close: jest.fn(),
    };

    readline.createInterface.mockReturnValue(mockRl);
  });

  afterEach(() => {
    // Restore original isTTY
    Object.defineProperty(process.stdout, "isTTY", {
      value: originalIsTTY,
      configurable: true,
    });
  });

  describe("confirm type questions", () => {
    it("should return true for empty input (default yes)", async () => {
      mockRl.question.mockImplementation((__msg, callback) => {
        callback("");
      });

      const questions = [
        {
          type: "confirm",
          name: "proceed",
          message: "Do you want to continue?",
        },
      ];

      const result = await prompt(questions);

      expect(result.proceed).toBe(true);
      expect(mockRl.question).toHaveBeenCalledWith(
        expect.stringContaining("Do you want to continue?"),
        expect.any(Function),
      );
      expect(mockRl.close).toHaveBeenCalled();
    });

    it("should return true for 'y' input", async () => {
      mockRl.question.mockImplementation((__msg, callback) => {
        callback("y");
      });

      const questions = [
        {
          type: "confirm",
          name: "agree",
          message: "Do you agree?",
        },
      ];

      const result = await prompt(questions);

      expect(result.agree).toBe(true);
    });

    it("should return true for 'yes' input", async () => {
      mockRl.question.mockImplementation((__msg, callback) => {
        callback("yes");
      });

      const questions = [
        {
          type: "confirm",
          name: "confirm",
          message: "Confirm?",
        },
      ];

      const result = await prompt(questions);

      expect(result.confirm).toBe(true);
    });

    it("should return false for 'n' input", async () => {
      mockRl.question.mockImplementation((__msg, callback) => {
        callback("n");
      });

      const questions = [
        {
          type: "confirm",
          name: "proceed",
          message: "Continue?",
        },
      ];

      const result = await prompt(questions);

      expect(result.proceed).toBe(false);
    });

    it("should return false for 'no' input", async () => {
      mockRl.question.mockImplementation((__msg, callback) => {
        callback("no");
      });

      const questions = [
        {
          type: "confirm",
          name: "proceed",
          message: "Continue?",
        },
      ];

      const result = await prompt(questions);

      expect(result.proceed).toBe(false);
    });

    it("should handle uppercase input", async () => {
      mockRl.question.mockImplementation((__msg, callback) => {
        callback("NO");
      });

      const questions = [
        {
          type: "confirm",
          name: "proceed",
          message: "Continue?",
        },
      ];

      const result = await prompt(questions);

      expect(result.proceed).toBe(false);
    });

    it("should handle input with whitespace", async () => {
      mockRl.question.mockImplementation((__msg, callback) => {
        callback("  n  ");
      });

      const questions = [
        {
          type: "confirm",
          name: "proceed",
          message: "Continue?",
        },
      ];

      const result = await prompt(questions);

      expect(result.proceed).toBe(false);
    });

    it("should handle 'nope' starting with n", async () => {
      mockRl.question.mockImplementation((__msg, callback) => {
        callback("nope");
      });

      const questions = [
        {
          type: "confirm",
          name: "proceed",
          message: "Continue?",
        },
      ];

      const result = await prompt(questions);

      expect(result.proceed).toBe(false);
    });
  });

  describe("checkbox type questions - non-TTY mode", () => {
    it("should return all choices when empty input is provided", async () => {
      mockRl.question.mockImplementation((__msg, callback) => {
        callback("");
      });

      const questions = [
        {
          type: "checkbox",
          name: "features",
          message: "Select features",
          choices: ["feature1", "feature2", "feature3"],
        },
      ];

      const result = await prompt(questions);

      expect(result.features).toEqual(["feature1", "feature2", "feature3"]);
      expect(mockRl.close).toHaveBeenCalled();
    });

    it("should return selected choices based on numeric input", async () => {
      mockRl.question.mockImplementation((__msg, callback) => {
        callback("1 3");
      });

      const questions = [
        {
          type: "checkbox",
          name: "features",
          message: "Select features",
          choices: ["feature1", "feature2", "feature3"],
        },
      ];

      const result = await prompt(questions);

      expect(result.features).toEqual(["feature1", "feature3"]);
    });

    it("should handle choices with name and value objects", async () => {
      mockRl.question.mockImplementation((__msg, callback) => {
        callback("1 2");
      });

      const questions = [
        {
          type: "checkbox",
          name: "options",
          message: "Select options",
          choices: [
            { name: "Option A", value: "a" },
            { name: "Option B", value: "b" },
            { name: "Option C", value: "c" },
          ],
        },
      ];

      const result = await prompt(questions);

      expect(result.options).toEqual(["a", "b"]);
    });

    it("should filter out invalid indices", async () => {
      mockRl.question.mockImplementation((_msg, callback) => {
        callback("1 10 2");
      });

      const questions = [
        {
          type: "checkbox",
          name: "items",
          message: "Select items",
          choices: ["item1", "item2"],
        },
      ];

      const result = await prompt(questions);

      expect(result.items).toEqual(["item1", "item2"]);
    });

    it("should handle multiple spaces in input", async () => {
      mockRl.question.mockImplementation((_msg, callback) => {
        callback("1    2    3");
      });

      const questions = [
        {
          type: "checkbox",
          name: "items",
          message: "Select items",
          choices: ["a", "b", "c"],
        },
      ];

      const result = await prompt(questions);

      expect(result.items).toEqual(["a", "b", "c"]);
    });

    it("should handle single selection", async () => {
      mockRl.question.mockImplementation((_msg, callback) => {
        callback("2");
      });

      const questions = [
        {
          type: "checkbox",
          name: "single",
          message: "Pick one",
          choices: ["opt1", "opt2", "opt3"],
        },
      ];

      const result = await prompt(questions);

      expect(result.single).toEqual(["opt2"]);
    });

    it("should display choices with numbers in console log", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      mockRl.question.mockImplementation((_msg, callback) => {
        callback("1");
      });

      const questions = [
        {
          type: "checkbox",
          name: "test",
          message: "Test question",
          choices: ["choice1", "choice2"],
        },
      ];

      await prompt(questions);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Test question"));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("1) choice1"));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("2) choice2"));

      consoleSpy.mockRestore();
    });

    it("should handle non-numeric input gracefully", async () => {
      mockRl.question.mockImplementation((_msg, callback) => {
        callback("abc xyz");
      });

      const questions = [
        {
          type: "checkbox",
          name: "items",
          message: "Select",
          choices: ["a", "b", "c"],
        },
      ];

      const result = await prompt(questions);

      // NaN - 1 results in invalid indices, filtered out
      expect(result.items).toEqual([]);
    });
  });

  describe("list type questions - non-TTY mode", () => {
    it("should return first choice when not in TTY mode", async () => {
      const questions = [
        {
          type: "list",
          name: "color",
          message: "Pick a color",
          choices: ["red", "blue", "green"],
        },
      ];

      const result = await prompt(questions);

      expect(result.color).toBe("red");
    });

    it("should return first choice value for object choices", async () => {
      const questions = [
        {
          type: "list",
          name: "size",
          message: "Pick a size",
          choices: [
            { name: "Small", value: "s" },
            { name: "Medium", value: "m" },
            { name: "Large", value: "l" },
          ],
        },
      ];

      const result = await prompt(questions);

      expect(result.size).toBe("s");
    });

    it("should return null for empty choices array", async () => {
      const questions = [
        {
          type: "list",
          name: "empty",
          message: "Pick from empty",
          choices: [],
        },
      ];

      const result = await prompt(questions);

      expect(result.empty).toBeNull();
    });
  });

  describe("multiple questions", () => {
    it("should process multiple questions in order", async () => {
      let questionCount = 0;
      mockRl.question.mockImplementation((_msg, callback) => {
        questionCount++;
        if (questionCount === 1) {
          callback("yes");
        } else if (questionCount === 2) {
          callback("1 2");
        }
      });

      const questions = [
        {
          type: "confirm",
          name: "proceed",
          message: "Continue?",
        },
        {
          type: "checkbox",
          name: "items",
          message: "Select items",
          choices: ["a", "b", "c"],
        },
      ];

      const result = await prompt(questions);

      expect(result.proceed).toBe(true);
      expect(result.items).toEqual(["a", "b"]);
    });

    it("should handle mixed question types", async () => {
      let questionCount = 0;
      mockRl.question.mockImplementation((_msg, callback) => {
        questionCount++;
        if (questionCount === 1) {
          callback("n");
        } else if (questionCount === 2) {
          callback("");
        }
      });

      const questions = [
        {
          type: "confirm",
          name: "skip",
          message: "Skip?",
        },
        {
          type: "checkbox",
          name: "all",
          message: "Select all",
          choices: ["x", "y"],
        },
        {
          type: "list",
          name: "first",
          message: "Pick first",
          choices: ["alpha", "beta"],
        },
      ];

      const result = await prompt(questions);

      expect(result.skip).toBe(false);
      expect(result.all).toEqual(["x", "y"]);
      expect(result.first).toBe("alpha");
    });
  });

  describe("edge cases", () => {
    it("should handle empty questions array", async () => {
      const result = await prompt([]);
      expect(result).toEqual({});
    });

    it("should return empty object for unknown question types", async () => {
      const questions = [
        {
          type: "unknown",
          name: "test",
          message: "Test",
        },
      ];

      const result = await prompt(questions);
      expect(result).toEqual({});
    });

    it("should handle questions without proper type", async () => {
      const questions = [
        {
          name: "noType",
          message: "No type specified",
        },
      ];

      const result = await prompt(questions);
      expect(result).toEqual({});
    });

    it("should handle mixed string and object choices in checkbox", async () => {
      mockRl.question.mockImplementation((_msg, callback) => {
        callback("1 3");
      });

      const questions = [
        {
          type: "checkbox",
          name: "mixed",
          message: "Mixed choices",
          choices: ["stringChoice", { name: "Object Choice", value: "objValue" }, "anotherString"],
        },
      ];

      const result = await prompt(questions);
      expect(result.mixed).toEqual(["stringChoice", "anotherString"]);
    });

    it("should handle zero-based index correctly", async () => {
      mockRl.question.mockImplementation((_msg, callback) => {
        callback("0 1");
      });

      const questions = [
        {
          type: "checkbox",
          name: "items",
          message: "Select",
          choices: ["a", "b", "c"],
        },
      ];

      const result = await prompt(questions);
      // 0 - 1 = -1 (invalid), 1 - 1 = 0 (valid)
      expect(result.items).toEqual(["a"]);
    });

    it("should handle negative numbers in input", async () => {
      mockRl.question.mockImplementation((_msg, callback) => {
        callback("-1 2");
      });

      const questions = [
        {
          type: "checkbox",
          name: "items",
          message: "Select",
          choices: ["a", "b"],
        },
      ];

      const result = await prompt(questions);
      // -1 - 1 = -2 (invalid), 2 - 1 = 1 (valid)
      expect(result.items).toEqual(["b"]);
    });
  });

  describe("TTY mode behavior", () => {
    it("should use fallback mode for checkbox when stdout is not TTY", async () => {
      mockRl.question.mockImplementation((_msg, callback) => {
        callback("");
      });

      const questions = [
        {
          type: "checkbox",
          name: "items",
          message: "Select",
          choices: ["a", "b"],
        },
      ];

      const result = await prompt(questions);

      // In non-TTY mode, empty input returns all choices
      expect(result.items).toEqual(["a", "b"]);
    });

    it("should use fallback mode for list questions in non-TTY", async () => {
      const questions = [
        {
          type: "list",
          name: "pick",
          message: "Choose one",
          choices: ["first", "second", "third"],
        },
      ];

      const result = await prompt(questions);

      // In non-TTY mode, returns first choice
      expect(result.pick).toBe("first");
    });
  });

  describe("readline interface creation", () => {
    it("should create readline interface for confirm questions", async () => {
      mockRl.question.mockImplementation((_msg, callback) => {
        callback("yes");
      });

      const questions = [
        {
          type: "confirm",
          name: "test",
          message: "Test?",
        },
      ];

      await prompt(questions);

      expect(readline.createInterface).toHaveBeenCalledWith({
        input: process.stdin,
        output: process.stdout,
      });
    });

    it("should create readline interface for checkbox questions in non-TTY", async () => {
      mockRl.question.mockImplementation((_msg, callback) => {
        callback("1");
      });

      const questions = [
        {
          type: "checkbox",
          name: "test",
          message: "Test?",
          choices: ["a"],
        },
      ];

      await prompt(questions);

      expect(readline.createInterface).toHaveBeenCalledWith({
        input: process.stdin,
        output: process.stdout,
      });
    });
  });

  describe("choice object handling", () => {
    it("should extract values from choice objects in checkbox", async () => {
      mockRl.question.mockImplementation((_msg, callback) => {
        callback("1 2 3");
      });

      const questions = [
        {
          type: "checkbox",
          name: "langs",
          message: "Select languages",
          choices: [
            { name: "JavaScript", value: "js" },
            { name: "TypeScript", value: "ts" },
            { name: "Python", value: "py" },
          ],
        },
      ];

      const result = await prompt(questions);

      expect(result.langs).toEqual(["js", "ts", "py"]);
    });

    it("should use name as value when value is not provided in choice object", async () => {
      mockRl.question.mockImplementation((_msg, callback) => {
        callback("");
      });

      const questions = [
        {
          type: "checkbox",
          name: "test",
          message: "Test",
          choices: [{ name: "Option 1" }, { name: "Option 2" }],
        },
      ];

      const result = await prompt(questions);

      // When empty input (select all), should use the objects themselves
      expect(result.test).toEqual([{ name: "Option 1" }, { name: "Option 2" }]);
    });
  });

  describe("input normalization", () => {
    it("should trim and lowercase confirm inputs", async () => {
      const testCases = [
        { input: "  YES  ", expected: true },
        { input: "\tY\t", expected: true },
        { input: "  NO  ", expected: false },
        { input: "\nN\n", expected: false },
      ];

      for (const testCase of testCases) {
        mockRl.question.mockImplementation((_msg, callback) => {
          callback(testCase.input);
        });

        const result = await prompt([{ type: "confirm", name: "test", message: "Test?" }]);

        expect(result.test).toBe(testCase.expected);
      }
    });

    it("should handle various whitespace in checkbox inputs", async () => {
      mockRl.question.mockImplementation((_msg, callback) => {
        callback("  1\t2\n3  ");
      });

      const questions = [
        {
          type: "checkbox",
          name: "items",
          message: "Select",
          choices: ["a", "b", "c"],
        },
      ];

      const result = await prompt(questions);

      expect(result.items).toEqual(["a", "b", "c"]);
    });
  });

  describe("confirm question variations", () => {
    it("should treat 'N' as no", async () => {
      mockRl.question.mockImplementation((_msg, callback) => {
        callback("N");
      });

      const result = await prompt([{ type: "confirm", name: "test", message: "Test?" }]);

      expect(result.test).toBe(false);
    });

    it("should treat 'Y' as yes", async () => {
      mockRl.question.mockImplementation((_msg, callback) => {
        callback("Y");
      });

      const result = await prompt([{ type: "confirm", name: "test", message: "Test?" }]);

      expect(result.test).toBe(true);
    });

    it("should treat any non-n-starting input as yes", async () => {
      const yesInputs = ["sure", "okay", "yep", "absolutely", "1", "true"];

      for (const input of yesInputs) {
        mockRl.question.mockImplementation((_msg, callback) => {
          callback(input);
        });

        const result = await prompt([{ type: "confirm", name: "test", message: "Test?" }]);

        expect(result.test).toBe(true);
      }
    });
  });
});
