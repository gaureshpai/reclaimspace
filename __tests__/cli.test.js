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
});
