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
    const result = program.version("1.0.0");
    expect(result).toBe(program);
    expect(program._version).toBe("1.0.0");
  });

  it("should set description correctly", () => {
    const result = program.description("A test CLI tool");
    expect(result).toBe(program);
    expect(program._description).toBe("A test CLI tool");
  });

  it("should allow method chaining", () => {
    const result = program
      .version("2.0.0")
      .description("Chained CLI")
      .option("--test", "test option")
      .argument("<file>", "file to process");

    expect(result).toBe(program);
    expect(program._version).toBe("2.0.0");
    expect(program._description).toBe("Chained CLI");
  });

  it("should handle multiple options with default values", () => {
    program.option("--verbose", "verbose output", false);
    program.option("--count <n>", "count value", "10");
    program.option("--name <name>", "user name", "anonymous");

    program.parse(["node", "script", "--verbose"]);

    const opts = program.opts();
    expect(opts.verbose).toBe(true);
    expect(opts.count).toBe("10");
    expect(opts.name).toBe("anonymous");
  });

  it("should override default option values when provided", () => {
    program.option("--port <n>", "port number", "3000");
    program.parse(["node", "script", "--port", "8080"]);
    expect(program.opts().port).toBe("8080");
  });

  it("should handle option with value using = syntax and value containing =", () => {
    program.option("--env <vars>", "environment variables");
    program.parse(["node", "script", "--env=KEY=value"]);
    expect(program.opts().env).toBe("KEY=value");
  });

  it("should handle multiple = signs in option value", () => {
    program.option("--connection <string>", "connection string");
    program.parse(["node", "script", "--connection=host=localhost;port=5432"]);
    expect(program.opts().connection).toBe("host=localhost;port=5432");
  });

  it("should handle short flags with values", () => {
    program.option("-p, --port <n>", "port number");
    program.option("-h, --host <host>", "hostname");

    program.parse(["node", "script", "-p", "9000", "-h", "example.com"]);

    const opts = program.opts();
    expect(opts.port).toBe("9000");
    expect(opts.host).toBe("example.com");
  });

  it("should handle mixed short and long options", () => {
    program.option("-v, --verbose", "verbose mode");
    program.option("--debug", "debug mode");

    program.parse(["node", "script", "-v", "--debug"]);

    const opts = program.opts();
    expect(opts.verbose).toBe(true);
    expect(opts.debug).toBe(true);
  });

  it("should handle options and arguments mixed", () => {
    program.option("--output <file>", "output file");
    program.parse(["node", "script", "input.txt", "--output", "result.txt", "extra.txt"]);

    expect(program.args).toEqual(["input.txt", "extra.txt"]);
    expect(program.opts().output).toBe("result.txt");
  });

  it("should handle boolean flag followed by another option", () => {
    program.option("--verbose", "verbose mode");
    program.option("--file <name>", "file name");

    program.parse(["node", "script", "--verbose", "--file", "test.txt"]);

    const opts = program.opts();
    expect(opts.verbose).toBe(true);
    expect(opts.file).toBe("test.txt");
  });

  it("should handle array default values for arguments", () => {
    program.argument("[items...]", "items to process", ["default1", "default2", "default3"]);
    program.parse(["node", "script"]);
    expect(program.args).toEqual(["default1", "default2", "default3"]);
  });

  it("should parse empty arguments correctly", () => {
    program.parse(["node", "script"]);
    expect(program.args).toEqual([]);
  });

  it("should handle option values that look like flags when using = syntax", () => {
    program.option("--value <val>", "a value");
    program.parse(["node", "script", "--value=--something"]);
    expect(program.opts().value).toBe("--something");
  });

  it("should handle options with empty string values using = syntax", () => {
    program.option("--text <text>", "text value");
    program.parse(["node", "script", "--text="]);
    expect(program.opts().text).toBe("");
  });

  it("should handle undefined short flag gracefully", () => {
    program.option("--verbose", "verbose mode");
    program.parse(["node", "script", "-x"]);
    // -x is not defined, should be ignored or treated as arg
    expect(program.opts().verbose).toBe(false);
  });

  it("should set options to false by default when not provided", () => {
    program.option("--enable", "enable feature");
    program.option("--disable", "disable feature");
    program.parse(["node", "script"]);

    const opts = program.opts();
    expect(opts.enable).toBe(false);
    expect(opts.disable).toBe(false);
  });

  it("should handle single character option names", () => {
    program.option("-v", "version");
    program.parse(["node", "script", "-v"]);
    expect(program.opts().v).toBeUndefined();
  });

  it("should handle option definition with multiple spaces and separators", () => {
    program.option("-o,  --output  <file>", "output file");
    program.parse(["node", "script", "--output", "out.txt"]);
    expect(program.opts().output).toBe("out.txt");
  });

  it("should handle arguments with non-array default value", () => {
    program.argument("[dir]", "directory", ".");
    program.parse(["node", "script"]);
    expect(program.args).toEqual(["."]);
  });

  it("should preserve order of positional arguments", () => {
    program.parse(["node", "script", "first", "second", "third"]);
    expect(program.args).toEqual(["first", "second", "third"]);
  });

  it("should handle complex real-world scenario", () => {
    program
      .version("1.0.0")
      .description("Real CLI tool")
      .option("-v, --verbose", "verbose output")
      .option("--dry-run", "dry run mode")
      .option("--ignore <patterns>", "ignore patterns")
      .option("--include <patterns>", "include patterns")
      .argument("[dirs...]", "directories to scan", ["."])
      .parse([
        "node",
        "script",
        "--verbose",
        "--ignore=node_modules,dist",
        "src",
        "lib",
      ]);

    expect(program.args).toEqual(["src", "lib"]);
    const opts = program.opts();
    expect(opts.verbose).toBe(true);
    expect(opts["dry-run"]).toBe(false);
    expect(opts.ignore).toBe("node_modules,dist");
    expect(opts.include).toBe(false);
  });
});