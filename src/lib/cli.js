export class Program {
  constructor() {
    this._args = [];
    this._options = {};
    this._commands = [];
    this._description = "";
    this._version = "";
    this._argumentDefinitions = [];
    this._optionDefinitions = [];
  }

  version(v) {
    this._version = v;
    return this;
  }

  description(d) {
    this._description = d;
    return this;
  }

  argument(name, desc, defaultValue) {
    this._argumentDefinitions.push({ name, desc, defaultValue });
    return this;
  }

  option(flags, desc, defaultValue) {
    const pattern = /--([^ <,]+)/;
    const match = flags.match(pattern);
    if (match) {
      const key = match[1];
      this._optionDefinitions.push({ key, flags, desc, defaultValue });
    }
    return this;
  }

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
      if (arg.startsWith("--")) {
        const key = arg.slice(2);
        const def = this._optionDefinitions.find((d) => d.key === key);
        if (def) {
          // If next arg isn't an option, it might be a value (though commander options often are flags)
          // For reclaimspace, they seem to be flags or strings
          if (rawArgs[i + 1] && !rawArgs[i + 1].startsWith("-")) {
            options[key] = rawArgs[++i];
          } else {
            options[key] = true;
          }
        }
      } else if (arg.startsWith("-")) {
        // Handle short flags if needed, but reclaimspace uses --
      } else {
        args.push(arg);
      }
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

  opts() {
    return this._parsedOptions;
  }
}

export const program = new Program();
