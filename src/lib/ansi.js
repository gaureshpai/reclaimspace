const ESC = "\u001b[";
const _RESET = "\u001b[0m";

const codes = {
  reset: [0, 0],
  bold: [1, 22],
  dim: [2, 22],
  italic: [3, 23],
  underline: [4, 24],
  inverse: [7, 27],
  hidden: [8, 28],
  strikethrough: [9, 29],

  black: [30, 39],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  white: [37, 39],
  gray: [90, 39],

  bgBlack: [40, 49],
  bgRed: [41, 49],
  bgGreen: [42, 49],
  bgYellow: [43, 49],
  bgBlue: [44, 49],
  bgMagenta: [45, 49],
  bgCyan: [46, 49],
  bgWhite: [47, 49],
};

const ansi = {};

for (const [name, [start, end]] of Object.entries(codes)) {
  ansi[name] = (str) => `${ESC}${start}m${str}${ESC}${end}m`;
}

// Chainable mock for chalk-like usage
const _chalkMock = {
  ...ansi,
  bold: (str) => ansi.bold(str),
  cyan: (str) => {
    const fn = (s) => ansi.cyan(s);
    fn.bold = (s) => ansi.bold(ansi.cyan(s));
    return typeof str === "string" ? fn(str) : fn;
  },
  green: (str) => ansi.green(str),
  red: (str) => ansi.red(str),
  yellow: (str) => ansi.yellow(str),
  blue: (str) => ansi.blue(str),
  magenta: (str) => ansi.magenta(str),
  white: (str) => ansi.white(str),
  gray: (str) => ansi.gray(str),
};

// Add a more flexible chainer
/**
 * Creates a chainable ANSI style formatter.
 * @param {Array<string>} styles - Initial styles to apply.
 * @returns {Function} A formatter function that also has style properties for chaining.
 */
const createChainer = (styles = []) => {
  const formatter = (str) => {
    return styles.reduce(
      (acc, style) =>
        codes[style] ? `${ESC}${codes[style][0]}m${acc}${ESC}${codes[style][1]}m` : acc,
      str,
    );
  };

  for (const name of Object.keys(codes)) {
    Object.defineProperty(formatter, name, {
      get: () => createChainer([...styles, name]),
    });
  }

  return formatter;
};

const chalk = createChainer();

export default chalk;
