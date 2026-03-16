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

  describe("version and description", () => {
    it("should set version", () => {
      const result = program.version("1.0.0");
      expect(result).toBe(program);
      expect(program._version).toBe("1.0.0");
    });

    it("should set description", () => {
      const result = program.description("Test program");
      expect(result).toBe(program);
      expect(program._description).toBe("Test program");
    });

    it("should allow method chaining", () => {
      const result = program.version("2.0.0").description("Chained test");
      expect(result).toBe(program);
      expect(program._version).toBe("2.0.0");
      expect(program._description).toBe("Chained test");
    });

    it("should chain multiple options and arguments", () => {
      const result = program
        .version("1.0.0")
        .description("Test")
        .option("-v, --verbose", "Verbose output")
        .argument("[dir]", "Directory", ".");

      expect(result).toBe(program);
      expect(program._version).toBe("1.0.0");
      expect(program._description).toBe("Test");
      expect(program._optionDefinitions).toHaveLength(1);
      expect(program._argumentDefinitions).toHaveLength(1);
    });
  });

  describe("option default values", () => {
    it("should use default value for option when not provided", () => {
      program.option("--port <number>", "Port number", "3000");
      program.parse(["node", "script"]);
      expect(program.opts().port).toBe("3000");
    });

    it("should override default value when option is provided", () => {
      program.option("--port <number>", "Port number", "3000");
      program.parse(["node", "script", "--port", "8080"]);
      expect(program.opts().port).toBe("8080");
    });

    it("should set false as default for boolean options without default", () => {
      program.option("--verbose", "Verbose output");
      program.parse(["node", "script"]);
      expect(program.opts().verbose).toBe(false);
    });

    it("should handle multiple options with defaults", () => {
      program.option("--host <host>", "Host", "localhost");
      program.option("--port <port>", "Port", "3000");
      program.option("--ssl", "Enable SSL", false);
      program.parse(["node", "script", "--ssl"]);

      const opts = program.opts();
      expect(opts.host).toBe("localhost");
      expect(opts.port).toBe("3000");
      expect(opts.ssl).toBe(true);
    });
  });

  describe("short flags with values", () => {
    it("should parse short flag with value", () => {
      program.option("-i, --input <file>", "Input file");
      program.parse(["node", "script", "-i", "test.txt"]);
      expect(program.opts().input).toBe("test.txt");
    });

    it("should parse multiple short flags with and without values", () => {
      program.option("-v, --verbose", "Verbose");
      program.option("-o, --output <file>", "Output file");
      program.parse(["node", "script", "-v", "-o", "output.txt"]);

      const opts = program.opts();
      expect(opts.verbose).toBe(true);
      expect(opts.output).toBe("output.txt");
    });
  });

  describe("complex option parsing", () => {
    it("should parse options before arguments", () => {
      program.option("--verbose", "Verbose");
      program.parse(["node", "script", "--verbose", "arg1", "arg2"]);

      // When a flag is followed by a non-flag value, it consumes it as the value
      expect(program.opts().verbose).toBe("arg1");
      expect(program.args).toEqual(["arg2"]);
    });

    it("should parse arguments before options", () => {
      program.option("--verbose", "Verbose");
      program.parse(["node", "script", "arg1", "--verbose", "arg2"]);

      // When a flag is followed by a non-flag value, it consumes it as the value
      expect(program.opts().verbose).toBe("arg2");
      expect(program.args).toEqual(["arg1"]);
    });

    it("should parse intermixed options and arguments", () => {
      program.option("--flag1", "Flag 1");
      program.option("--flag2", "Flag 2");
      program.parse(["node", "script", "arg1", "--flag1", "arg2", "--flag2"]);

      const opts = program.opts();
      // flag1 followed by arg2, so it consumes arg2 as value
      expect(opts.flag1).toBe("arg2");
      // flag2 has no value after it, so it becomes true
      expect(opts.flag2).toBe(true);
      expect(program.args).toEqual(["arg1"]);
    });

    it("should handle multiple = syntax options", () => {
      program.option("--name <name>", "Name");
      program.option("--age <age>", "Age");
      program.parse(["node", "script", "--name=John", "--age=25"]);

      const opts = program.opts();
      expect(opts.name).toBe("John");
      expect(opts.age).toBe("25");
    });

    it("should handle = syntax with values containing =", () => {
      program.option("--config <config>", "Config");
      program.parse(["node", "script", "--config=key=value"]);
      expect(program.opts().config).toBe("key=value");
    });

    it("should handle options with spaces in values", () => {
      program.option("--message <msg>", "Message");
      program.parse(["node", "script", "--message", "hello world"]);
      expect(program.opts().message).toBe("hello world");
    });
  });

  describe("argument definitions", () => {
    it("should store argument definitions", () => {
      program.argument("<dir>", "Directory");
      expect(program._argumentDefinitions).toHaveLength(1);
      expect(program._argumentDefinitions[0]).toEqual({
        name: "<dir>",
        desc: "Directory",
        defaultValue: undefined,
      });
    });

    it("should handle multiple argument definitions", () => {
      program.argument("<source>", "Source file");
      program.argument("<dest>", "Destination file", "output.txt");

      expect(program._argumentDefinitions).toHaveLength(2);
      expect(program._argumentDefinitions[0].name).toBe("<source>");
      expect(program._argumentDefinitions[1].name).toBe("<dest>");
      expect(program._argumentDefinitions[1].defaultValue).toBe("output.txt");
    });

    it("should apply array default arguments", () => {
      program.argument("[dirs...]", "Directories", ["dir1", "dir2"]);
      program.parse(["node", "script"]);
      expect(program.args).toEqual(["dir1", "dir2"]);
    });

    it("should apply single default argument", () => {
      program.argument("[dir]", "Directory", "default");
      program.parse(["node", "script"]);
      expect(program.args).toEqual(["default"]);
    });

    it("should not apply default when args are provided", () => {
      program.argument("[dir]", "Directory", "default");
      program.parse(["node", "script", "custom"]);
      expect(program.args).toEqual(["custom"]);
    });
  });

  describe("option definitions", () => {
    it("should store option definitions", () => {
      program.option("-v, --verbose", "Verbose output");
      expect(program._optionDefinitions).toHaveLength(1);
      expect(program._optionDefinitions[0]).toMatchObject({
        key: "verbose",
        short: "v",
        flags: "-v, --verbose",
        desc: "Verbose output",
      });
    });

    it("should handle options with only long form", () => {
      program.option("--debug", "Debug mode");
      expect(program._optionDefinitions[0]).toMatchObject({
        key: "debug",
        short: undefined,
        flags: "--debug",
      });
    });

    it("should handle options with value placeholders", () => {
      program.option("--input <file>", "Input file");
      expect(program._optionDefinitions[0]).toMatchObject({
        key: "input",
        flags: "--input <file>",
      });
    });

    it("should handle different separator styles", () => {
      program.option("-p|--port <n>", "Port", "3000");
      expect(program._optionDefinitions[0]).toMatchObject({
        key: "port",
        short: "p",
        defaultValue: "3000",
      });
    });

    it("should parse with various flag separators", () => {
      program.option("-x, --extra", "Extra");
      program.option("-f | --force", "Force");
      program.parse(["node", "script", "-x", "-f"]);

      const opts = program.opts();
      expect(opts.extra).toBe(true);
      expect(opts.force).toBe(true);
    });
  });

  describe("help and version flags", () => {
    let mockExit;
    let mockLog;

    beforeEach(() => {
      mockExit = jest.spyOn(process, "exit").mockImplementation((code) => {
        throw new Error(`Process exited with code ${code}`);
      });
      mockLog = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      mockExit.mockRestore();
      mockLog.mockRestore();
    });

    it("should display help and exit on --help", () => {
      program.description("Test description");
      expect(() => program.parse(["node", "script", "--help"])).toThrow(
        "Process exited with code 0",
      );
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Test description"));
      expect(mockExit).toHaveBeenCalledWith(0);
    });

    it("should display help and exit on -h", () => {
      program.name("test-app");
      expect(() => program.parse(["node", "script", "-h"])).toThrow("Process exited with code 0");
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Usage: test-app"));
      expect(mockExit).toHaveBeenCalledWith(0);
    });

    it("should display version and exit on --version", () => {
      program.version("1.2.3");
      expect(() => program.parse(["node", "script", "--version"])).toThrow(
        "Process exited with code 0",
      );
      expect(mockLog).toHaveBeenCalledWith("1.2.3");
      expect(mockExit).toHaveBeenCalledWith(0);
    });

    it("should display version and exit on -v", () => {
      program.version("1.2.3");
      expect(() => program.parse(["node", "script", "-v"])).toThrow("Process exited with code 0");
      expect(mockLog).toHaveBeenCalledWith("1.2.3");
      expect(mockExit).toHaveBeenCalledWith(0);
    });
  });

  describe("edge cases", () => {
    it("should handle empty argv", () => {
      program.parse(["node", "script"]);
      expect(program.args).toEqual([]);
      expect(program.opts()).toEqual({});
    });

    it("should handle only node and script in argv", () => {
      program.option("--flag", "Flag", false);
      program.parse(["node", "script"]);
      expect(program.opts().flag).toBe(false);
    });

    it("should handle flag followed by another flag", () => {
      program.option("--first", "First");
      program.option("--second", "Second");
      program.parse(["node", "script", "--first", "--second"]);

      const opts = program.opts();
      expect(opts.first).toBe(true);
      expect(opts.second).toBe(true);
    });

    it("should treat value starting with dash using = syntax", () => {
      program.option("--prefix <p>", "Prefix");
      program.parse(["node", "script", "--prefix=-test"]);
      expect(program.opts().prefix).toBe("-test");
    });

    it("should not consume following flag as value", () => {
      program.option("--input <file>", "Input");
      program.option("--output", "Output");
      program.parse(["node", "script", "--input", "--output"]);

      // When next arg is a flag, the option becomes true
      expect(program.opts().input).toBe(true);
      expect(program.opts().output).toBe(true);
    });

    it("should handle unknown short flags", () => {
      program.parse(["node", "script", "-x"]);
      expect(program.args).toEqual(["-x"]);
    });

    it("should initialize with empty state", () => {
      expect(program.args).toEqual([]);
      expect(program._options).toEqual({});
      expect(program._commands).toEqual([]);
      expect(program._description).toBe("");
      expect(program._version).toBe("");
      expect(program._argumentDefinitions).toEqual([]);
      expect(program._optionDefinitions).toEqual([]);
    });
  });

  describe("return value and chaining", () => {
    it("should return this from version()", () => {
      const result = program.version("1.0.0");
      expect(result).toBe(program);
    });

    it("should return this from description()", () => {
      const result = program.description("test");
      expect(result).toBe(program);
    });

    it("should return this from argument()", () => {
      const result = program.argument("<file>", "File");
      expect(result).toBe(program);
    });

    it("should return this from option()", () => {
      const result = program.option("--test", "Test");
      expect(result).toBe(program);
    });

    it("should return this from parse()", () => {
      const result = program.parse(["node", "script"]);
      expect(result).toBe(program);
    });
  });

  describe("opts() method", () => {
    it("should return parsed options", () => {
      program.option("--test", "Test");
      program.parse(["node", "script", "--test"]);
      const opts = program.opts();
      expect(opts).toEqual({ test: true });
    });

    it("should return empty object when no options defined", () => {
      program.parse(["node", "script"]);
      // Returns empty object, not undefined
      expect(program.opts()).toEqual({});
    });

    it("should return object with default values", () => {
      program.option("--port <n>", "Port", "3000");
      program.option("--host <h>", "Host", "localhost");
      program.parse(["node", "script"]);

      const opts = program.opts();
      expect(opts.port).toBe("3000");
      expect(opts.host).toBe("localhost");
    });
  });
});
