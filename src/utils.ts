import type { ArgsOptions } from "./args/types";
import { CmdError } from "./error";
import type { Arg, Args, CmdOptions, DefineCommands, Meta, Resolvable } from "./types";

/** Regex to replace quotemark. */
export const QUOTES_REGEX = /(^"|"$)/g;

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
 * Convert string to camel-case.
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

export const argTrim = (val: string) => {
    let trimmed = val.replace(/<.*?>/, '')
    trimmed = trimmed.replace(/\|.+$/, '');
    return trimmed.trim();
}

export const parseAlias = (val: string) => {
    return val.split(/,(?![^<]*>)/).map(argTrim)
}

type OptionalType = 'string' | 'boolean' | 'number' | 'array'

function handleType(value: string): [OptionalType, string] {
    const type = (/\|(.+)$/.exec(value)?.[1] ?? 'string').trim() as OptionalType
    return [type, argTrim(value)]
}

/**
 * transform args to ofi params
 */
function argsHandle(args: Arg, options: CmdOptions) {
    const [flags, description, defaultValue] = args
    const flagArr = parseAlias(flags)
    const alias: string[] = []
    flagArr.forEach((draftFlag, i) => {
        const flag = argTrim(draftFlag)
        if (i === flagArr.length - 1) {
            const [type, val] = handleType(draftFlag);
            options[type] ? options[type].push(val) : (options[type] = [val]);
            (options.alias || (options.alias = {}))[val] = alias
            if (typeof defaultValue !== 'undefined') {
                (options.default || (options.default = {}))[val] = defaultValue
            }
            options.description[flag] = description ?? ''
            options.hints[val] = (draftFlag).match(/<(.*?)>/)?.[1] ?? ''
        } else {
            alias.push(flag)
        }
    })
}

/**
 * parse define args to args Parser
 *      number: ['size'],
 *      string: ['foo', 'name', 'surname'],
 *      boolean: ['dice', 'friendly'],
 *      array: ['list', 'my-numbers'],
 *      alias: { foo: ['f'] },
 *      default: { surname: 'obama', list: [] }
 */
export function formatArgs(args: Args) {
    const options: CmdOptions = {
        description: {},
        hints: {}
    };
    if (args.length === 0) {
        return options
    }
    args.forEach((arg) => {
        const [flags, description] = arg
        // `Arg | [Arg, InOutput]` show in output or not
        if (Array.isArray(flags)) {
            const showInOutput = !!description
            const flagArr = flags[0].split(/,(?![^<]*>)/)
            const flag = argTrim(flagArr[flagArr.length - 1])
            // @ts-expect-error set hidden
            if (!showInOutput) options.description[flag] = false
            else argsHandle(flags, options)
        } else {
            argsHandle(arg as Arg, options)
        }
    })
    return options
}


/**
 * method for render Output, fill space like indent
 */
export function fillSpace(n: number) { return ' '.repeat(n) }

export function matchSubCmd(meta: Meta, currentCmd: string) {
    return meta.alias.concat(meta.name).some((n: string) => n.trim() === currentCmd)
}

/**
 * remove color ANSI chars,get real length for layout
 */
export function getExcludedANSILen(str: string) {
    return str.replace(/\x1B\[[0-9;]*[mGK]/g, '').length
}

/**
 * make ANSI string concat with insertString
 */
export function concatANSI(str: string, insertStr: string) {
    const newANSIStr = str.replace(/\x1B\[[0-9;]*[mGK](.*?)\x1B\[[0-9;]*[mGK]/g, (m, p) => (m ? m.replace(p, insertStr + p) : m))
    return newANSIStr === str ? insertStr + str : newANSIStr
}

export function resolveValue<T>(input: Resolvable<T>): T | Promise<T> {
    return typeof input === "function" ? (input as any)() : input;
}

/**
* @param text The text to be output.
* @param color The color code in ANSI escape sequence format.
* 
* @example
*
* ```js
*  setColorOutput('This text is green.', "1;34;90");
* ```
* 
*/
export function setColor(text: string, color: string = '\x1b[32m') {
    // ANSI escape sequence for resetting color to default after output
    const Reset = "\x1b[0m"  // reset all style
    // foreground color
    const FgBlack = "\x1b[30m"
    const FgRed = "\x1b[31m"
    const FgGreen = "\x1b[32m"
    const FgYellow = "\x1b[33m"
    const FgBlue = "\x1b[34m"
    const FgMagenta = "\x1b[35m"
    const FgCyan = "\x1b[36m"
    const FgWhite = "\x1b[37m"
    const FgGray = "\x1b[90m"
    const FgLightRed = "\x1b[91m"
    const FgLightGreen = "\x1b[92m"
    const FgLightYellow = "\x1b[93m"
    const FgLightBlue = "\x1b[94m"
    const FgLightMagenta = "\x1b[95m"
    const FgLightCyan = "\x1b[96m"
    const FgLightWhite = "\x1b[97m"
    // background color
    const BgBlack = "\x1b[40m"
    const BgRed = "\x1b[41m"
    const BgGreen = "\x1b[42m"
    const BgYellow = "\x1b[43m"
    const BgBlue = "\x1b[44m"
    const BgMagenta = "\x1b[45m"
    const BgCyan = "\x1b[46m"
    const BgWhite = "\x1b[47m"
    const BgGray = "\x1b[100m"
    const BgLightRed = "\x1b[101m"
    const BgLightGreen = "\x1b[102m"
    const BgLightYellow = "\x1b[103m"
    const BgLightBlue = "\x1b[104m"
    const BgLightMagenta = "\x1b[105m"
    const BgLightCyan = "\x1b[106m"
    const BgLightWhite = "\x1b[107m"
    // mode
    const Bold = "\x1b[1m"
    const Dim = "\x1b[2m"
    const Italic = "\x1b[3m"
    const Underline = "\x1b[4m"
    const Blink = "\x1b[5m"
    const Reverse = "\x1b[7m"
    const Hidden = "\x1b[8m"
    const Strikethrough = "\x1b[9m"

    // set foreground and background color
    const [mode, fgColor, bgColor] = color.split(';');

    // the specified color
    let coloredText = '';

    if (mode) {
        coloredText += `\x1b[${mode}m`;
    }
    if (fgColor) {
        coloredText += `\x1b[${fgColor}m`;
    }

    if (bgColor) {
        coloredText += `\x1b[${bgColor}m`;
    }
    return coloredText += text + Reset;
}
