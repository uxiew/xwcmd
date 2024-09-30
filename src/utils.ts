import stripAnsi from "strip-ansi";
import { parse } from "./args/parser";
import { type Command } from "./command";
import { XWCMDError } from "./error";
import type {
  Arg, Args, ProcessArgv,
  CmdOptions, DefaultArgs, DefineCommands,
  FormatArgs, Meta,
  Resolvable,
} from "./types";

export const FLAG_STR = '--'
export const DEFAULT_STR = '__'

/** Regex to replace quotemark. */
export const QUOTES_REGEX = /(^"|"$)/g;

export const print = console.log

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
 * Convert string to camel-case. `sss-aa` -> `sssAa`
 * @param {string} str String to convert.
 * @returns {string}
 */
export function toCamelCase(str: string): string {
  return str.replace(/-/g, ' ').replace(/^\w|[A-Z]|\b\w|\s+/g, (ltr, idx) => idx === 0 ? ltr.toLowerCase() : ltr.toUpperCase()).replace(/\s+/g, '');
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
 * remove extra Angle brackets
 * @example
 * ```js
 *   ' <axx|c> ' -> 'axx|c'
 * ```
 */
export const parseByChar = (val: string, symbols = ['<', '>']) => val.match(new RegExp(`\\${symbols[0]}([^]*)\\${symbols[1]}`))?.[1] ?? ''

/**
 * Parse command-line arguments.
 * @example
 *
 * ```js
 *   [pkg!, re!|boolean, files|array]
 *    ->
 *   {
 *     string: ['pkg'],
 *     boolean: ['re'],
 *     array: [files],
 *     required:['pkg', 're'],
 *     _:[],
 *   }
 * ```
 */
export const parseDefaultArgs = (defaultArgs: DefaultArgs) => {
  const result = parseCliArgs(defaultArgs) as CmdOptions & { _: string[] }
  result._ = defaultArgs.map((p) => cleanArg(p[0]))
  return result
}

/**
 * remove `<xxx>`、`| xxx`,`! xxx !` and trim space,
 * get clean flag value
 */
export const cleanArg = (val: string) => {
  let trimmed = val
    .replace(/<.*>/, '')
    .replace(/(\[.*\])/g, (a) => a.replace(/\|/g, '&'))
    // remove things like `| array`
    .replace(/\|.+$/, '')
    .replace('&', '|')
    .trim()
    // Remove leading signs `!`, `...` and `-`
    .replace(/^(!|-|\.\.\.)/, '')
    // remove the ending required sign `!`
    .replace(/!$/, '')

  return trimmed
}

/**
 * @return {Array} all flags alias include flag itself.
 * @example
 *
 * ```js
 *  [i, install [+aa!] <hintxxx> | asd]
 * ->
 *  ['i', 'install <hintxxx> | asd']
 * ```
 */
export const splitFlag = (val: string) => {
  return val.replace(/\[(.+)\]/, '')
    .split(/,(?![^<]*>)/)
    .map((f) => f.trim())
}

type OptionalType = 'string' | 'boolean' | 'number' | 'array'

/**
 * parse flag and it's type from string like `-parse!`,
 * @param {String} val like `!bool! <hint>`, `!bool!`
 */
export function parseType(val: string): [OptionalType, string, boolean] {
  let type: OptionalType = 'string', required = false
  switch (val.replace(/<.*>/, '').charAt(0)) {
    case '-':
      type = 'number'
      break;
    case '!':
      type = 'boolean'
      break;
    case '.':
      type = 'array'
      break;
  }
  if (/.+!/.test(val)) required = true
  return [type, cleanArg(val), required]
}

/**
 * transform args to ofi params
 */
function argsHandle(args: Arg, options: CmdOptions) {
  const [flags, description, defaultValue] = args
  const flagArr = splitFlag(flags)
  const alias: string[] = []
  flagArr.forEach((f, i) => {
    const draftFlag = stripAnsi(f)
    let [type, val, required] = parseType(draftFlag);
    if (i === flagArr.length - 1) {
      if (required) options.required.push(val)
      options[type] ? options[type].push(val) : (options[type] = [val]);
      (options.alias || (options.alias = {}))[val] = alias
      if (typeof defaultValue !== 'undefined') {
        (options.default || (options.default = {}))[val] = defaultValue
      }
      options.description[val] = description ?? ''
      options.hints[val] = parseByChar(draftFlag)
    } else {
      alias.push(val)
    }
  })
}

/**
 * parse define params args to Parser's args ，return like this:
 * @example
 * ```js
 * {
 *   description: {},
 *   hints: {}，
 *   alias: { foo: ['f'] },
 *   default: { surname: 'obama', list: [] }
 *   number: ['size'],
 *   string: ['foo', 'name', 'surname'],
 *   boolean: ['dice', 'friendly'],
 *   array: ['list', 'my-numbers'],
 *   required: ['list', 'my-numbers'],
 * }
 * ```
 */
export function parseCliArgs(args: Args | DefaultArgs) {
  const options: CmdOptions = {
    alias: {},
    description: {},
    hints: {},
    required: []
  };
  if (args.length === 0) return options
  args.forEach((arg) => {
    const [flags, description] = arg
    argsHandle(arg as Arg, options)
  })
  return options
}

/**
 *  split alias and flag, and hint value,default value
 * @example
 *
 * ```js
 * [
 *     [`m,me, ${colors.blue('!mean')}! <hint>`, 'Is a description', 'default value],
 * ]
 * ->
 * [
 *     [`m,me`, `${colors.blue('mean')}`, `hint`, `array`, 'Is a description', 'default value`],
 * ]
 * ```
 */
export function formatArgs(args: Args) {
  return args.map((arg) => {
    const flags = arg.shift();
    if (typeof flags !== 'string') {
      throw new XWCMDError('The args definition error.');
    }
    const alias = splitFlag(flags)
    const flag = alias.pop()
    if (flag === undefined) {
      throw new XWCMDError('The args missing flag!');
    }
    const [type, val] = parseType(stripAnsi(flag))
    return [alias.join(','), val, parseByChar(flag), type, ...arg]
  }) as FormatArgs[]
}

/**
 * method for render Output, fill space like indent
 */
export function fillSpace(n: number) { return ' '.repeat(n) }

export function matchSubCmd(meta: Meta, currentCmd: string) {
  return meta.alias!.concat(meta.name).some((n: string) => stripAnsi(n) === currentCmd)
}

/**
 * remove color ANSI chars,get real length for layout
 */
export function stringLen(str: string) {
  return stripAnsi(str).length
}

/**
 * test a text is a link
 */
export function isLink(text: string) {
  return /^(https?|ftp):\/\//.test(text)
}

/**
 * make ANSI string concat with insertString
 */
export function concatANSI(str: string, insertStr: string) {
  const newANSIStr = str.replace(
    /\x1B\[[0-9;]*[mGK](.*?)\x1B\[[0-9;]*[mGK]/g,
    (m, p) => (m ? m.replace(p, insertStr + p) : m)
  )
  return newANSIStr === str ? insertStr + str : newANSIStr
}

export function resolveValue<T>(input: Resolvable<T>): T | Promise<T> {
  return typeof input === "function" ? (input as any)() : input;
}

/**
 * Parses input arguments and applies defaults.
 * @param {ProcessArgv} argv - the process argv
 * @param {Exclude<DefineCommands['args'], undefined>} args - args,like `['a,arg <hint>','desc','default_value]`
 */
export function parseArgs(argv: ProcessArgv, args: Exclude<DefineCommands['args'], undefined>) {
  return parse(argv.slice(2), parseCliArgs(args))
}

/**
 * get main command instance
 * @param { Command } cmd - current command
 */
export function resolveMainCmd(cmd: Command) {
  if (cmd.type === 'main') return cmd
  return resolveMainCmd(cmd.meta.parent!)
}

/**
 * Gets subcommand and the appropriate subcommand path,
 * @param { String } name - sub command' name
 * @param { Command } cmd - current command
 */
export function resolveSubCmd(cmd: Command, name: string) {
  const cmdInfo: { cmd: Command | null, argv: string[] } = {
    cmd: null,
    argv: [],
  }
  if (cmd.type !== "main") cmd = resolveMainCmd(cmd)

  const resolve = (cmd: Command) => {
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
