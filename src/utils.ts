import { CLI } from "./CLI";
import type { CLIItemDef, CLIParamDef, Meta, ParsedResult, Resolvable } from "./types";
import type { Arrayable, Mapped } from "./argv/types";

export const FLAG_STR = '--'
export const DEFAULT_STR = '__'

/** Regex to replace quotemark. */
export const QUOTES_REGEX = /(^"|"$)/g;

/** argv parser options's data type*/
export const argvTypes = ['string', 'boolean', 'array', 'number']

function clean(out: string) {
  return out
    // remove start and end blank lines
    .replace(/^\n*|\s*$/g, '')
    // remove end SIGN
    .replace(/\n\s*;;/g, '')
}
// Prints to stdout with newline.
export const print = (out: string) => console.log(clean(out))

export function simpleEqual(a: string[], o: string[]) {
  return a.every((k, i) => o.indexOf(k) === i)
}

/**
 * Check if a value is a flag. (e.g., `-f`, `--option`, `--option=value`)
 * @param {string} str String to check.
 * @returns {boolean}
 */
export function isFlag(str: string): boolean {
  return str.codePointAt(0) === 45; // "-"
}

/**
 * Check if a value is a short flag. (e.g., `-f`)
 * @param {string} str String to check.
 * @returns {boolean}
 */
export function isShortFlag(str: string): boolean {
  return isFlag(str) && str.codePointAt(1) !== 45;
}

/**
 * Check if a value is a long flag. (e.g., `--option`, `--option=value`)
 * @param {string} str String to check.
 * @returns {boolean}
 */
export function isLongFlag(str: string): boolean {
  return isFlag(str) && str.codePointAt(1) === 45;
}

/**
 * Looks for options from given alias. `-x` --> `--xxx`.
 * @param {string} val `-x` Alias to look for.
 * @param {Mapped<Arrayable<string>>} alias Aliases.
 * @returns {string | undefined} `--xxx`
 * @private
 */
export function getAlias(val: string, alias: Mapped<Arrayable<string>>): string | undefined {
  if (!isShortFlag(val)) return;

  val = val.slice(1); // remove first hyphen

  const a = Object.entries(alias).some(([flag, vals]) => {
    const yes = Array.isArray(vals) ? vals.includes(val) :
      typeof (vals) === 'string' ? vals === val : false
    if (yes) { val = '--' + flag; return true }
  })

  if (a) return val
  // for (const [key, aval] of aliases) {
  //   if (Array.isArray(aval) && aval.includes(val)) return '--' + key;
  //   if (typeof (aval) === 'string' && aval === val) return '--' + key;
  // }
}

/**
 * Convert string to kebab-case.
 * @param {string} str String to convert.
 * @returns {string}
 */
export function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * replace `--xxx` -> `xxx`
 */
export function stripFlag(str: string): string {
  return str.replace(/^-+/, '')
}

/**
 * Convert string to camel-case. `N`->`N`, `sss-aa` -> `sssAa`
 * @param {string} str String to convert.
 * @returns {string}
 */
export function toCamelCase(str: string): string {
  // If the string does not contain '-', the original string is returned
  if (!str.includes('-')) return str;
  return str
    .toLowerCase()
    // Capitalize the letter after each '-'
    .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Check if a given value is like a number (i.e., it can be parsed as a number).
 * @param {*} value Value to check.
 * @returns {boolean}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isNumericLike(value: any): boolean {
  if (typeof value === 'number' || typeof value === 'string') {
    // eslint-disable-next-line unicorn/prefer-number-properties
    return !isNaN(Number(value));
  }
  return false;
}

export const toArray = <T extends any>(val: T | T[]) => Array.isArray(val) ? val : [val]



/**
 * Parse value
 * @param {string} val Value to convert.
 */
export const parseValue = (val: unknown) => {
  if (typeof val !== 'string') return val
  if (/^\[.*\]$/.test(val)) {
    try {
      // use JSON parse array like string，remove quot
      const arrayValue = JSON.parse(val.replace(/'/g, '"'));
      return Array.isArray(arrayValue) ? arrayValue : val;
    } catch (e) {
      return val;
    }
  }

  if (val === "true" || val === "false") {
    return val === "true";
  }
  if (isNumericLike(val)) {
    return Number.parseFloat(val);
  }

  if (typeof val === 'string') return val.replace(QUOTES_REGEX, '');

  return val;
}

/**
* format the output help
* @param options -  default: `{ clean: true, removeType: true}`
*/
export function format(output: string, options = CLI.settings) {
  if (options.clean) output = clean(output)
  if (options.removeType) {
    argvTypes.forEach((type) => {
      output = output.replace(new RegExp(type + '\s*$', 'g'), '')
    })
  }
  if (options.colorful) {
    // TODO colors
  }

  return output
}

/** ======================================= */
export function matchSubCmd(meta: Meta, cmdName: string) {
  return meta.alias!.concat(meta.name).some((n: string) => n === cmdName)
}

/**
 * test a text is a link
 */
export function isLink(text: string) {
  return /^(https?|ftp):\/\//.test(text)
}

/**
* resolve cli's args
*/
export function parseCLIArgs(argsDef: CLIParamDef): ParsedResult {
  const result: ParsedResult = {
    // Overwrite `version` when setting a subcommand
    meta: { type: 'sub', version: '', name: argsDef.name, alias: argsDef.alias },
    cmds: [],
    args: {
      _: [],
      default: {},
    },
    opts: {
      alias: {},
      default: {},
    }
  }

  const { opts } = result
  const fill = (data: CLIItemDef | undefined) => {
    data && Object.entries(data).forEach(
      ([name, { type, alias, choices, default: d, required }]) => {
        type = type || 'string';
        (opts[type] || (opts[type] = [])).push(name)
        alias && (opts.alias![name] = alias)
        d && (opts.default![name] = d)
        if (choices) {
          (opts.choices || (opts.choices = {}))[name] = choices
        }
        if (required) {
          (opts.required || (opts.required = [])).push(name)
        }
      })
  }
  fill(argsDef.arguments)
  fill(argsDef.options)
  return result
}

export function resolveValue<T>(input: Resolvable<T>): T | Promise<T> {
  return typeof input === "function" ? (input as any)() : input;
}

/**
 * get main command instance
 * @param { Command } cmd - current command
 */
export function resolveMainCmd(cmd: CLI) {
  if (cmd.meta.type === 'main') return cmd
  return resolveMainCmd(cmd.meta.parent!)
}

/**
 * Gets subcommand and the appropriate subcommand path,
 * @param { String } name - sub command' name
 * @param { Command } cmd - current command
 */
export function resolveSubCmd(cmd: CLI, name: string) {
  const cmdInfo: { cmd: CLI | null, argv: string[] } = {
    cmd: null,
    argv: [],
  }
  if (cmd.meta.type !== "main") cmd = resolveMainCmd(cmd)

  const resolve = (cmd: CLI) => {
    for (const c of cmd.subs) {
      cmdInfo.argv.push(c.meta.name)
      if (matchSubCmd(c.meta, name)) {
        cmdInfo.cmd = c
        return cmdInfo
      } else {
        const sub = resolve(c)
        cmdInfo.cmd = sub.cmd
        return cmdInfo
      }
    }
    return cmdInfo
  }

  return resolve(cmd)
}
