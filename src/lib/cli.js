/**
 * Simple CLI program handler inspired by Commander.js.
 */
export class Program {
  /**
   * Initializes a new instance of the Program class.
   *
   * @remarks
   * All properties are initialized to their default values.
   * @property {Array<string>} args - List of command line arguments.
   * @property {Object} _options - List of parsed options.
   * @property {Array<string>} _commands - List of command names.
   * @property {string} _name - Name of the program.
   * @property {string} _description - Description of the program.
   * @property {string} _version - Version of the program.
   * @property {Array<Object>} _argumentDefinitions - List of argument definitions.
   * @property {Array<Object>} _optionDefinitions - List of option definitions.
   */
  constructor() {
    this.args = [];
    this._options = {};
    this._commands = [];
    this._name = "";
    this._description = "";
    this._version = "";
    this._argumentDefinitions = [];
    this._optionDefinitions = [];
  }

  /**
   * Sets the name of the application.
   * @param {string} n - Name string.
   * @returns {Program} Chained instance.
   */
  name(n) {
    this._name = n;
    return this;
  }

  /**
   * Sets the version of the application.
   * @param {string} v - Version string.
   * @returns {Program} Chained instance.
   */
  version(v) {
    this._version = v;
    return this;
  }

  /**
   * Sets the description of the application.
   * @param {string} d - Description string.
   * @returns {Program} Chained instance.
   */
  description(d) {
    this._description = d;
    return this;
  }

  /**
   * Defines a positional argument.
   * @param {string} name - Argument name/pattern.
   * @param {string} desc - Description for help.
   * @param {any} [defaultValue] - Default value if not provided.
   * @returns {Program} Chained instance.
   */
  argument(name, desc, defaultValue) {
    this._argumentDefinitions.push({ name, desc, defaultValue });
    return this;
  }

  /**
   * Defines a command-line option/flag.
   * @param {string} flags - Flag names (e.g., "-y, --yes").
   * @param {string} desc - Description for help.
   * @param {any} [defaultValue] - Default value for the option.
   * @returns {Program} Chained instance.
   */
  option(flags, desc, defaultValue) {
    const parts = flags.split(/[, |]+/).map((p) => p.trim());
    const long = parts
      .find((p) => p.startsWith("--"))
      ?.replace(/^--/, "")
      .split(/[ <]/)[0];
    const short = parts.find((p) => p.startsWith("-") && !p.startsWith("--"))?.replace(/^-/, "");

    const isBoolean = !flags.includes("<") && !flags.includes("[");

    if (long) {
      this._optionDefinitions.push({
        key: long,
        short,
        flags,
        desc,
        defaultValue,
        boolean: isBoolean,
      });
    }
    return this;
  }

  /**
   * Generates and returns the help text.
   * @returns {string} Formatted help text.
   */
  helpInformation() {
    const lines = [];

    if (this._description) {
      lines.push(this._description);
      lines.push("");
    }

    const name = this._name || "program";
    const usage = `Usage: ${name} [options]${this._argumentDefinitions.length ? ` ${this._argumentDefinitions.map((a) => a.name).join(" ")}` : ""}`;
    lines.push(usage);
    lines.push("");

    if (this._argumentDefinitions.length) {
      lines.push("Arguments:");
      for (const arg of this._argumentDefinitions) {
        lines.push(
          `  ${arg.name.padEnd(20)} ${arg.desc}${arg.defaultValue !== undefined ? ` (default: ${JSON.stringify(arg.defaultValue)})` : ""}`,
        );
      }
      lines.push("");
    }

    if (this._optionDefinitions.length) {
      lines.push("Options:");
      // Add automatic help option to the display
      const displayOptions = [
        ...this._optionDefinitions,
        { flags: "-h, --help", desc: "display help for command" },
      ];
      if (this._version) {
        displayOptions.push({
          flags: "-v, --version",
          desc: "output the version number",
        });
      }

      for (const opt of displayOptions) {
        lines.push(
          `  ${opt.flags.padEnd(20)} ${opt.desc}${opt.defaultValue !== undefined ? ` (default: ${JSON.stringify(opt.defaultValue)})` : ""}`,
        );
      }
      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Parses command line arguments and options.
   * Note: values beginning with "-" must use the --opt=value form.
   * @param {Array<string>} argv - Process arguments list.
   * @returns {Program} Chained instance.
   */
  parse(argv) {
    const rawArgs = argv.slice(2);

    // Handle help and version flags first
    if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
      console.log(this.helpInformation());
      process.exit(0);
    }

    if (
      this._version &&
      (rawArgs.includes("--version") || rawArgs.includes("-v") || rawArgs.includes("-V"))
    ) {
      console.log(this._version);
      process.exit(0);
    }

    const args = [];
    const options = {};

    // Set default values
    for (const opt of this._optionDefinitions) {
      if (opt.defaultValue !== undefined) {
        options[opt.key] = opt.defaultValue;
      } else {
        options[opt.key] = false;
      }
    }

    for (let i = 0; i < rawArgs.length; i++) {
      const arg = rawArgs[i];

      if (arg.startsWith("-")) {
        let key = null;
        let value = null;

        if (arg.startsWith("--")) {
          key = arg.slice(2);
          if (key.includes("=")) {
            const parts = key.split("=");
            key = parts[0];
            value = parts.slice(1).join("=");
          }
        } else {
          const shortLetter = arg.slice(1);
          const def = this._optionDefinitions.find((d) => d.short === shortLetter);
          if (def) {
            key = def.key;
          }
        }

        if (key) {
          const def = this._optionDefinitions.find((d) => d.key === key);
          if (def) {
            if (value !== null) {
              options[key] = value;
            } else if (!def.boolean) {
              if (rawArgs[i + 1] && !rawArgs[i + 1].startsWith("-")) {
                options[key] = rawArgs[++i];
              } else {
                console.error(`error: option '--${key}' argument missing`);
                console.error(this.helpInformation());
                process.exit(1);
              }
            } else {
              options[key] = true;
            }
            continue;
          }
        }

        // Unknown option
        console.error(`error: unknown option '${arg}'`);
        console.log(this.helpInformation());
        process.exit(1);
      }

      args.push(arg);
    }

    this.args = args;
    this._parsedOptions = options;

    // Apply default arguments if none provided
    if (this.args.length === 0) {
      for (const argDef of this._argumentDefinitions) {
        if (argDef.defaultValue !== undefined) {
          // Handle array default
          if (Array.isArray(argDef.defaultValue)) {
            this.args.push(...argDef.defaultValue);
          } else {
            this.args.push(argDef.defaultValue);
          }
        }
      }
    }

    return this;
  }

  /**
   * Returns the parsed options.
   * @returns {Object} Key-value pairs of parsed options.
   */
  opts() {
    return this._parsedOptions;
  }
}

export const program = new Program();
