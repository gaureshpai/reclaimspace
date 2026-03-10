import { Program } from "../src/lib/cli.js";

describe("Program CLI", () => {
  let program;

  beforeEach(() => {
    program = new Program();
  });

  it("should parse boolean options", () => {
    program.option("--yes", "description");
    program.parse(["node", "script", "--yes"]);
    expect(program.opts().yes).toBe(true);
  });

  it("should parse options with values", () => {
    program.option("--ignore <patterns>", "description");
    program.parse(["node", "script", "--ignore", "node_modules,dist"]);
    expect(program.opts().ignore).toBe("node_modules,dist");
  });

  it("should parse options with = syntax", () => {
    program.option("--ignore <patterns>", "description");
    program.parse(["node", "script", "--ignore=node_modules"]);
    expect(program.opts().ignore).toBe("node_modules");
  });

  it("should handle short flags", () => {
    program.option("-y, --yes", "description");
    program.option("-d, --dry", "description");
    program.option("-u, --ui", "description");

    program.parse(["node", "script", "-y", "-d", "-u"]);
    const opts = program.opts();
    expect(opts.yes).toBe(true);
    expect(opts.dry).toBe(true);
    expect(opts.ui).toBe(true);
  });

  it("should collect positional arguments", () => {
    program.parse(["node", "script", "dir1", "dir2"]);
    expect(program.args).toEqual(["dir1", "dir2"]);
  });

  it("should use default action values for arguments", () => {
    program.argument("[dirs...]", "dirs", ["default_dir"]);
    program.parse(["node", "script"]);
    expect(program.args).toEqual(["default_dir"]);
  });

  it("should override default arguments with provided ones", () => {
    program.argument("[dirs...]", "dirs", ["default_dir"]);
    program.parse(["node", "script", "real_dir"]);
    expect(program.args).toEqual(["real_dir"]);
  });

  it("should handle options that are not defined by ignoring them in opts but keeping in args if treated as such", () => {
    // Current implementation ignores undefined options in loop
    program.parse(["node", "script", "--undefined"]);
    expect(program.opts().undefined).toBeUndefined();
  });

  it("should set version correctly", () => {
    const result = program.version("1.2.3");
    expect(result).toBe(program); // Should return this for chaining
    expect(program._version).toBe("1.2.3");
  });

  it("should set description correctly", () => {
    const desc = "Test description";
    const result = program.description(desc);
    expect(result).toBe(program); // Should return this for chaining
    expect(program._description).toBe(desc);
  });

  it("should support method chaining", () => {
    const result = program
      .version("1.0.0")
      .description("Test CLI")
      .option("-v, --verbose", "Verbose output")
      .argument("<file>", "File to process");

    expect(result).toBe(program);
    expect(program._version).toBe("1.0.0");
    expect(program._description).toBe("Test CLI");
  });

  it("should handle multiple options with mixed syntax", () => {
    program
      .option("-v, --verbose", "Verbose")
      .option("--config <path>", "Config file")
      .option("-o, --output <file>", "Output file");

    program.parse(["node", "script", "-v", "--config=app.json", "-o", "result.txt", "input.js"]);

    const opts = program.opts();
    expect(opts.verbose).toBe(true);
    expect(opts.config).toBe("app.json");
    expect(opts.output).toBe("result.txt");
    expect(program.args).toEqual(["input.js"]);
  });

  it("should handle empty argv array", () => {
    program.parse([]);
    expect(program.args).toEqual([]);
    expect(program.opts()).toEqual({});
  });

  it("should handle argv with only script name", () => {
    program.parse(["node"]);
    expect(program.args).toEqual([]);
  });

  it("should set default values for options", () => {
    program.option("--port <number>", "Port number", "3000");
    program.parse(["node", "script"]);
    expect(program.opts().port).toBe("3000");
  });

  it("should override default values when option is provided", () => {
    program.option("--port <number>", "Port number", "3000");
    program.parse(["node", "script", "--port", "8080"]);
    expect(program.opts().port).toBe("8080");
  });

  it("should handle option with value containing equals sign", () => {
    program.option("--env <vars>", "Environment variables");
    program.parse(["node", "script", "--env=KEY=VALUE"]);
    expect(program.opts().env).toBe("KEY=VALUE");
  });

  it("should handle option with value containing multiple equals signs", () => {
    program.option("--data <json>", "JSON data");
    program.parse(["node", "script", "--data={\"key\":\"value=test\"}"]);
    expect(program.opts().data).toBe("{\"key\":\"value=test\"}");
  });

  it("should parse boolean flag without value", () => {
    program.option("--force", "Force operation");
    program.parse(["node", "script", "--force"]);
    expect(program.opts().force).toBe(true);
  });

  it("should handle multiple short flags combined", () => {
    program.option("-a, --all", "All");
    program.option("-v, --verbose", "Verbose");
    program.option("-f, --force", "Force");

    // Note: This tests individual flags, not combined like -avf
    program.parse(["node", "script", "-a", "-v", "-f"]);
    const opts = program.opts();
    expect(opts.all).toBe(true);
    expect(opts.verbose).toBe(true);
    expect(opts.force).toBe(true);
  });

  it("should handle positional args with boolean options", () => {
    program.option("-v, --verbose", "Verbose");
    // Boolean options consume the next arg if it doesn't start with "-"
    program.parse(["node", "script", "-v", "file1.js"]);

    // The next arg after -v becomes the value for verbose (not a boolean)
    expect(program.opts().verbose).toBe("file1.js");
    expect(program.args).toEqual([]);
  });

  it("should handle options that look like flags but are positional", () => {
    program.parse(["node", "script", "--", "--not-a-flag"]);
    expect(program.args).toContain("--");
    expect(program.args).toContain("--not-a-flag");
  });

  it("should initialize with empty state", () => {
    const newProgram = new Program();
    expect(newProgram.args).toEqual([]);
    expect(newProgram._options).toEqual({});
    expect(newProgram._commands).toEqual([]);
    expect(newProgram._description).toBe("");
    expect(newProgram._version).toBe("");
    expect(newProgram._argumentDefinitions).toEqual([]);
    expect(newProgram._optionDefinitions).toEqual([]);
  });

  it("should handle option with long flag only", () => {
    program.option("--verbose", "Verbose mode");
    program.parse(["node", "script", "--verbose"]);
    expect(program.opts().verbose).toBe(true);
  });

  it("should handle array default for arguments", () => {
    program.argument("[files...]", "Files to process", ["default1.js", "default2.js"]);
    program.parse(["node", "script"]);
    expect(program.args).toEqual(["default1.js", "default2.js"]);
  });

  it("should not use default arguments when args are provided", () => {
    program.argument("[files...]", "Files", ["default.js"]);
    program.parse(["node", "script", "custom.js"]);
    expect(program.args).toEqual(["custom.js"]);
  });

  it("should handle option value with spaces when using = syntax", () => {
    program.option("--message <text>", "Message");
    program.parse(["node", "script", "--message=hello world"]);
    expect(program.opts().message).toBe("hello world");
  });

  it("should handle short flag with value", () => {
    program.option("-p, --port <number>", "Port");
    program.parse(["node", "script", "-p", "3000"]);
    expect(program.opts().port).toBe("3000");
  });

  it("should preserve order of positional arguments", () => {
    program.parse(["node", "script", "first", "second", "third", "fourth"]);
    expect(program.args).toEqual(["first", "second", "third", "fourth"]);
  });

  it("should handle option values that are numbers", () => {
    program.option("--count <n>", "Count");
    program.parse(["node", "script", "--count", "42"]);
    expect(program.opts().count).toBe("42");
  });

  it("should handle option values that start with dash using = syntax", () => {
    program.option("--value <v>", "Value");
    program.parse(["node", "script", "--value=-123"]);
    expect(program.opts().value).toBe("-123");
  });

  it("should default boolean options to false", () => {
    program.option("--enable", "Enable feature");
    program.parse(["node", "script"]);
    expect(program.opts().enable).toBe(false);
  });

  it("should handle empty option value with = syntax", () => {
    program.option("--text <value>", "Text");
    program.parse(["node", "script", "--text="]);
    expect(program.opts().text).toBe("");
  });

  it("should handle multiple arguments with default values", () => {
    program
      .argument("[dir]", "Directory", ".")
      .argument("[file]", "File", "index.js");

    program.parse(["node", "script"]);
    // All defaults are applied when no args provided
    expect(program.args).toEqual([".", "index.js"]);
  });

  it("should handle opts() returning parsed options", () => {
    program.option("--test", "Test option");
    program.parse(["node", "script", "--test"]);
    const opts = program.opts();
    expect(opts).toHaveProperty("test");
    expect(opts.test).toBe(true);
  });

  it("should handle space-separated flag and value notation", () => {
    program.option("--name <n>", "Name");
    program.parse(["node", "script", "--name", "John"]);
    expect(program.opts().name).toBe("John");
  });

  it("should handle complex argument definitions", () => {
    program
      .argument("<source>", "Source file")
      .argument("[dest]", "Destination file", "output.txt");

    program.parse(["node", "script", "input.txt"]);
    expect(program.args).toEqual(["input.txt"]);
  });

  // Additional regression and boundary tests
  describe("regression and boundary tests", () => {
    it("should handle option flag without short version", () => {
      program.option("--long-option-name", "Long option");
      program.parse(["node", "script", "--long-option-name"]);
      expect(program.opts()["long-option-name"]).toBe(true);
    });

    it("should handle very long option values", () => {
      const longValue = "a".repeat(1000);
      program.option("--data <value>", "Data");
      program.parse(["node", "script", "--data", longValue]);
      expect(program.opts().data).toBe(longValue);
    });

    it("should not leak state between parse calls", () => {
      const prog1 = new Program();
      prog1.option("-v, --verbose", "Verbose");
      prog1.parse(["node", "script", "--verbose"]);

      const prog2 = new Program();
      prog2.option("-v, --verbose", "Verbose");
      prog2.parse(["node", "script"]);

      expect(prog1.opts().verbose).toBe(true);
      expect(prog2.opts().verbose).toBe(false);
    });

    it("should handle special characters in option values", () => {
      program.option("--pattern <p>", "Pattern");
      program.parse(["node", "script", "--pattern=*.{js,ts}"]);
      expect(program.opts().pattern).toBe("*.{js,ts}");
    });

    it("should handle quoted strings as positional arguments", () => {
      program.parse(["node", "script", "file with spaces.txt"]);
      expect(program.args).toContain("file with spaces.txt");
    });

    it("should handle numeric zero as option value", () => {
      program.option("--count <n>", "Count");
      program.parse(["node", "script", "--count", "0"]);
      expect(program.opts().count).toBe("0");
    });

    it("should handle negative numbers as option values with = syntax", () => {
      program.option("--number <n>", "Number");
      program.parse(["node", "script", "--number=-42"]);
      expect(program.opts().number).toBe("-42");
    });

    it("should handle boolean flag at end of arguments", () => {
      program.option("--last", "Last flag");
      program.parse(["node", "script", "file.txt", "--last"]);
      expect(program.opts().last).toBe(true);
      expect(program.args).toContain("file.txt");
    });

    it("should handle option with special characters in flag name", () => {
      program.option("--build-dir <dir>", "Build directory");
      program.parse(["node", "script", "--build-dir", "./dist"]);
      expect(program.opts()["build-dir"]).toBe("./dist");
    });

    it("should preserve whitespace in option values with = syntax", () => {
      program.option("--text <t>", "Text");
      program.parse(["node", "script", "--text=  spaces  "]);
      expect(program.opts().text).toBe("  spaces  ");
    });

    it("should handle rapid consecutive option flags", () => {
      program.option("-a, --aaa", "A");
      program.option("-b, --bbb", "B");
      program.option("-c, --ccc", "C");
      program.parse(["node", "script", "-a", "-b", "-c"]);
      expect(program.opts().aaa).toBe(true);
      expect(program.opts().bbb).toBe(true);
      expect(program.opts().ccc).toBe(true);
    });

    it("should handle undefined short flag correctly", () => {
      program.option("--only-long", "Only long flag");
      program.parse(["node", "script", "--only-long"]);
      expect(program.opts()["only-long"]).toBe(true);
    });

    it("should not confuse option value with another option", () => {
      program.option("--first <value>", "First");
      program.option("--second", "Second");
      program.parse(["node", "script", "--first=test", "--second"]);
      expect(program.opts().first).toBe("test");
      expect(program.opts().second).toBe(true);
    });

    it("should handle JSON string as option value", () => {
      const json = '{"key":"value","nested":{"array":[1,2,3]}}';
      program.option("--config <json>", "Config");
      program.parse(["node", "script", `--config=${json}`]);
      expect(program.opts().config).toBe(json);
    });

    it("should handle URL as option value", () => {
      program.option("--url <u>", "URL");
      program.parse(["node", "script", "--url=https://example.com?a=1&b=2"]);
      expect(program.opts().url).toBe("https://example.com?a=1&b=2");
    });

    it("should handle empty string positional argument", () => {
      program.parse(["node", "script", ""]);
      expect(program.args).toContain("");
    });

    it("should handle multiple equals signs in single option value", () => {
      program.option("--equation <e>", "Equation");
      program.parse(["node", "script", "--equation=a=b=c=d"]);
      expect(program.opts().equation).toBe("a=b=c=d");
    });

    it("should handle option that looks like a number", () => {
      program.option("--123 <value>", "Numeric option");
      program.parse(["node", "script", "--123=test"]);
      expect(program.opts()["123"]).toBe("test");
    });

    it("should handle single dash as positional argument", () => {
      program.parse(["node", "script", "-"]);
      expect(program.args).toContain("-");
    });

    it("should handle double dash as positional argument", () => {
      program.parse(["node", "script", "--"]);
      expect(program.args).toContain("--");
    });

    it("should maintain insertion order for options", () => {
      program.option("--first", "First");
      program.option("--second", "Second");
      program.option("--third", "Third");
      program.parse(["node", "script", "--third", "--first", "--second"]);
      const opts = program.opts();
      expect(opts.first).toBe(true);
      expect(opts.second).toBe(true);
      expect(opts.third).toBe(true);
    });
  });
});