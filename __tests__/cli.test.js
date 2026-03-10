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

  it("should set and retrieve version", () => {
    program.version("1.0.0");
    expect(program._version).toBe("1.0.0");
  });

  it("should set and retrieve description", () => {
    program.description("Test program description");
    expect(program._description).toBe("Test program description");
  });

  it("should allow chaining of version, description, option, and argument", () => {
    const result = program
      .version("2.0.0")
      .description("Chained program")
      .option("--test", "test option")
      .argument("<dir>", "directory");

    expect(result).toBe(program);
    expect(program._version).toBe("2.0.0");
    expect(program._description).toBe("Chained program");
  });

  it("should use default value for option when not provided", () => {
    program.option("--count <n>", "count", "5");
    program.parse(["node", "script"]);
    expect(program.opts().count).toBe("5");
  });

  it("should override default value when option is provided", () => {
    program.option("--count <n>", "count", "5");
    program.parse(["node", "script", "--count", "10"]);
    expect(program.opts().count).toBe("10");
  });

  it("should handle boolean flag with default false", () => {
    program.option("--verbose", "verbose mode");
    program.parse(["node", "script"]);
    expect(program.opts().verbose).toBe(false);
  });

  it("should handle multiple equals signs in option value", () => {
    program.option("--config <value>", "config");
    program.parse(["node", "script", "--config=key=value=test"]);
    expect(program.opts().config).toBe("key=value=test");
  });

  it("should handle mix of short and long options", () => {
    program.option("-v, --verbose", "verbose");
    program.option("-q, --quiet", "quiet");
    program.parse(["node", "script", "-v", "--quiet"]);
    expect(program.opts().verbose).toBe(true);
    expect(program.opts().quiet).toBe(true);
  });

  it("should handle short option with value", () => {
    program.option("-p, --port <number>", "port");
    program.parse(["node", "script", "-p", "8080"]);
    expect(program.opts().port).toBe("8080");
  });

  it("should consume next non-flag argument as option value", () => {
    program.option("--flag", "flag");
    program.parse(["node", "script", "--flag", "arg1", "arg2"]);
    // The parser consumes arg1 as the value for --flag
    expect(program.opts().flag).toBe("arg1");
    expect(program.args).toEqual(["arg2"]);
  });

  it("should handle positional arguments before options", () => {
    program.option("--flag", "flag");
    program.parse(["node", "script", "arg1", "--flag", "arg2"]);
    // The parser consumes arg2 as the value for --flag
    expect(program.opts().flag).toBe("arg2");
    expect(program.args).toEqual(["arg1"]);
  });

  it("should handle option with value that looks like a flag using = syntax", () => {
    program.option("--value <v>", "value");
    program.parse(["node", "script", "--value=--weird-value"]);
    expect(program.opts().value).toBe("--weird-value");
  });

  it("should store option definitions", () => {
    program.option("--test", "test option");
    expect(program._optionDefinitions).toHaveLength(1);
    expect(program._optionDefinitions[0]).toMatchObject({
      key: "test",
      flags: "--test",
      desc: "test option",
    });
  });

  it("should store argument definitions", () => {
    program.argument("<dir>", "directory");
    expect(program._argumentDefinitions).toHaveLength(1);
    expect(program._argumentDefinitions[0]).toMatchObject({
      name: "<dir>",
      desc: "directory",
    });
  });

  it("should handle empty argv array", () => {
    program.option("--test", "test");
    program.parse(["node", "script"]);
    expect(program.args).toEqual([]);
    expect(program.opts().test).toBe(false);
  });

  it("should handle non-string default value for argument", () => {
    program.argument("[port]", "port", 3000);
    program.parse(["node", "script"]);
    expect(program.args).toEqual([3000]);
  });

  it("should apply array default value by spreading", () => {
    program.argument("[dirs...]", "directories", ["dir1", "dir2", "dir3"]);
    program.parse(["node", "script"]);
    expect(program.args).toEqual(["dir1", "dir2", "dir3"]);
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

  it("should extract short flag from option definition", () => {
    program.option("-t, --test", "test");
    expect(program._optionDefinitions[0].short).toBe("t");
  });

  it("should handle option definition without short flag", () => {
    program.option("--long-only", "long only");
    expect(program._optionDefinitions[0].short).toBeUndefined();
  });

  it("should handle complex flag definition with spaces", () => {
    program.option("-f | --file <path>", "file path");
    const def = program._optionDefinitions[0];
    expect(def.key).toBe("file");
    expect(def.short).toBe("f");
  });

  it("should handle undefined short flag lookup", () => {
    program.option("--test", "test");
    program.parse(["node", "script", "-x"]);
    expect(program.opts().test).toBe(false);
  });

  it("should return opts consistently after multiple calls", () => {
    program.option("--test", "test");
    program.parse(["node", "script", "--test"]);
    const opts1 = program.opts();
    const opts2 = program.opts();
    expect(opts1).toEqual(opts2);
    expect(opts1.test).toBe(true);
  });

  it("should handle argument with default undefined", () => {
    program.argument("[optional]", "optional arg");
    program.parse(["node", "script"]);
    expect(program.args).toEqual([]);
  });

  it("should parse only after slice(2) of argv", () => {
    program.option("--test", "test");
    program.parse(["node", "script.js", "--test", "arg1"]);
    // The parser consumes arg1 as the value for --test
    expect(program.opts().test).toBe("arg1");
    expect(program.args).toEqual([]);
  });
});