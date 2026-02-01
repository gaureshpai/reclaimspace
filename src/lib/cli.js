/**
 * Simple CLI program handler inspired by Commander.js.
 */
export class Program {
  constructor() {
    this.args = [];
    this._options = {};
    this._commands = [];
    this._description = "";
    this._version = "";
    this._argumentDefinitions = [];
    this._optionDefinitions = [];
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

    if (long) {
      this._optionDefinitions.push({ key: long, short, flags, desc, defaultValue });
    }
    return this;
  }

  /**
   * Parses command line arguments and options.
   * Note: values beginning with "-" must use the --opt=value form.
   * @param {Array<string>} argv - Process arguments list.
   * @returns {Program} Chained instance.
   */
  parse(argv) {
    const rawArgs = argv.slice(2);
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
            } else if (rawArgs[i + 1] && !rawArgs[i + 1].startsWith("-")) {
              options[key] = rawArgs[++i];
            } else {
              options[key] = true;
            }
            continue;
          }
        }
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
