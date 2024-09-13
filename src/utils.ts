import { XWCLIError } from "./error";
import type { Arg, Args, CmdOptions, FormatArgs, Meta, ProcessArgv, Resolvable } from "./types";
import stripAnsi from "strip-ansi";

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
 * Check that the required arg is passed in
 */
export function checkRequired(options: CmdOptions, args: ProcessArgv) {
    args.some((a) => {
        if (options.alias && options.alias[a]) return true
    })
    // if (required.length > 0) {
    //     throw new XWCLIError(`The required args is missing: ${required.join(',')}`)
    // }
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

export const toArray = (val: any | any[]) => Array.isArray(val) ? val : [val]

/**
 * Parse command-line arguments.
 * @example
 * ```js
 *   ' <axx|c> ' -> 'axx|c'
 * ```
 */
export const parseByChar = (val: string, symbols = ['<', '>']) => val.match(new RegExp(symbols[0] + '([^]*)' + symbols[1]))?.[1] ?? ''

export const cleanDefaultFlags = (val: string) => val.replace(DEFAULT_PREFIX, '')
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
 *     required['pkg', 're']
 *   }
 * ```
 */
export const parseDefaultParams = (defaultFlag: string) => {
    const result = {
        description: {},
        alias: {},
        hints: {},
        required: [],
        _: [] as string[]
    }
    const params = (defaultFlag.match(/\[([^]*)\]/)?.[1] ?? '')
    if (params.length > 0)
        params.split(',').forEach(param => {
            const p = param.trim()
            argsHandle([p, ''], result)
            result._.push(cleanArg(p.replace(/!/, '')))
        })
    else return
    return result
}

/**
 * remove `<xxx>`、`| xxx` and trim space
 */
export const cleanArg = (val: string) => {
    let trimmed = val.replace(/<.*>/, '').replace(/(\[.*\])/g, (a) => a.replace(/\|/g, '#')).replace(/\|.+$/, '').replace('#', '|')
    return trimmed.trim();
}

/**
 * @return {Array} all flags alias include flag itself.
 * @example
 *
 * ```js
 *  [i, in, sxsinstall [aa!|number] <hintxxx> | asd]
 * ->
 *  ['i', 'in','sxsinstall <hintxxx> | asd']
 * ```
 */
export const splitFlag = (val: string) => {
    return val.replace(/\[(.+)\]/, '').split(/,(?![^<]*>)/).map((f) => f.trim())
}

type OptionalType = 'string' | 'boolean' | 'number' | 'array'

/**
 * parse flag and it's type from string like `parse | number ` 
 */
export function parseType(value: string): [OptionalType, string] {
    const type = (/\|(.+)$/.exec(value.replace(/<.*>/, ''))?.[1] ?? 'string').trim() as OptionalType
    return [type, cleanArg(value)]
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
        const flag = cleanArg(draftFlag)
        if (i === flagArr.length - 1) {
            let [type, val] = parseType(draftFlag);
            if (val.endsWith('!')) {
                val = val.slice(0, -1)
                options.required.push(val)
            }
            options[type] ? options[type].push(val) : (options[type] = [val]);
            (options.alias || (options.alias = {}))[val] = alias
            if (typeof defaultValue !== 'undefined') {
                (options.default || (options.default = {}))[val] = defaultValue
            }
            options.description[val] = description ?? ''
            options.hints[val] = parseByChar(draftFlag)
        } else {
            alias.push(flag)
        }
    })
}

/**
 * parse define params args to args Parser，result like this:
 * 
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
export function parseCliArgs(args: Args) {
    const options: CmdOptions = {
        alias: {},
        description: {},
        hints: {},
        required: []
    };
    if (args.length === 0) return options
    args.forEach((arg) => {
        const [flags, description] = arg
        // THINK: `Arg | [Arg, InOutput]` show in output or not
        if (Array.isArray(flags)) {
            const showInOutput = !!description
            const flagArr = flags[0].split(/,(?![^<]*>)/)
            const flag = cleanArg(flagArr[flagArr.length - 1])
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
 *  split alias and flag, and hint value,default value
 * @example
 *
 * ```js
 * [
 *     [`m,me, ${colors.blue('mean')}! <hint> |array`, 'Is a description', 'default value],
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
            throw new XWCLIError('The args definition error.');
        }
        const alias = splitFlag(flags)
        const flag = alias.pop()
        if (flag === undefined) {
            throw new XWCLIError('The args missing flag!');
        }
        const [type, val] = parseType(flag)
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
    const newANSIStr = str.replace(/\x1B\[[0-9;]*[mGK](.*?)\x1B\[[0-9;]*[mGK]/g, (m, p) => (m ? m.replace(p, insertStr + p) : m))
    return newANSIStr === str ? insertStr + str : newANSIStr
}

export function resolveValue<T>(input: Resolvable<T>): T | Promise<T> {
    return typeof input === "function" ? (input as any)() : input;
}
