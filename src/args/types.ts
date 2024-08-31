import { DefaultValue } from "../types";

// type Arrayable<T> = Array<DefaultValue<T>>;
type Arrayable<T> = T[];
type Mapped<T> = Record<string, T>;
type Anyable<T extends string | number | symbol> = Record<T, any>;

export declare interface ArgsOptions {
    /**
     * Arguments that should be parsed as booleans.
     * @example
     * ```ts
     * import { parse } from 'ofi';
     *
     * parse(process.argv.slice(2), {
     *      boolean: ['x', 'y', 'dice']
     * });
     *
     * ```
     * `node program.js --x --y=true --no-dice`:
     *
     * ```js
     * { _: [], x: true, y: true, dice: false }
     * ```
     */
    boolean?: Arrayable<string>;

    /**
     * Arguments that should be parsed as strings. (even if they resemble a number)
     * @example
     * ```ts
     * import { parse } from 'ofi';
     *
     * parse(process.argv.slice(2), {
     *      string: ['name', 'surname']
     * });
     *
     * ```
     * `node program.js --name=joe --surname mama`:
     *
     * ```js
     * { _: [], name: 'joe', surname: 'mama' }
     * ```
     */
    string?: Arrayable<string>;

    /**
     * Arguments that should be parsed as numbers.
     * @example
     * ```ts
     * import { parse } from 'ofi';
     *
     * parse(process.argv.slice(2), {
     *      number: ['x', 'y']
     * });
     *
     * ```
     * `node program.js --x=3 --y 90.3`:
     *
     * ```js
     * { _: [], x: 3, y: 90.3 }
     * ```
     */
    number?: Arrayable<string>;

    /**
     * Arguments that should be parsed as arrays.
     * @example
     * ```ts
     * import { parse } from 'ofi';
     *
     * parse(process.argv.slice(2), {
     *      array: ['foo', 'bar']
     * });
     *
     * ```
     * `node program.js --foo=1,2,3,4 --bar a b c`:
     *
     * ```js
     * { _: [], foo: [1, 2, 3, 4], bar: ['a', 'b', 'c'] }
     * ```
     */
    array?: Arrayable<string>;

    /**
     * Set default values.
     * @example
     * ```ts
     * import { parse } from 'ofi';
     *
     * parse(process.argv.slice(2), {
     *      default: { name: 'joe' }
     * });
     * ```
     * `node program.js`:
     *
     * ```js
     * { name: 'joe', _: [] }
     * ```
     */
    default?: Mapped<DefaultValue>;

    /**
     * Set aliases of options.
     * @example
     * ```ts
     * import { parse } from 'ofi';
     *
     * parse(process.argv.slice(2), {
     *      alias: { foo: 'f', bar: ['b'] },
     *      boolean: ['foo']
     * });
     * ```
     * `node program.js -f -b 123`:
     *
     * ```js
     * { _: [], foo: true, bar: 123 }
     * ```
     */
    alias?: Mapped<Arrayable<string>>;

    /**
     * Populate `'--'` property in `Argv` with everything after double-dash (`--`, aka. end-of-flags).\
     * Default: `false`
     * @example
     * `--foo 1 -- --baz test`:
     * ```js
     * { foo: 1, '--': ['--baz', 'test'] }
     * ```
     */
    'populate--'?: boolean;

    /**
     * Should values that look like numbers be parsed into them.\
     * This doesn't apply to strings.\
     * Default: `true`
     */
    parseNumber?: boolean;

    /**
     * Should a group of short options be treated as seperate flags.\
     * Default: `false`
     * @example
     * `-abc`:
     * ```js
     * { a: true, b: true, c: true }
     * ```
     */
    shortFlagGroup?: boolean;

    /**
     * Convert results to camel-case.\
     * Default: `false`
     * @example
     * `--test-case 1`:
     * ```js
     * { testCase: 1 }
     * ```
     */
    camelize?: boolean;

    /**
     * Custom synchronous function for parsing provided argument.\
     * Default: `undefined`
     * @example
     * ```ts
     * import { parse } from 'ofi';
     *
     * parse(process.argv.slice(2), {
     *      boolean: ['foo'],
     *      coerce: {
     *          foo: (arg) => arg ? 'banana' : 'plum'
     *      }
     * });
     * ```
     * `node program.js --foo`:
     *
     * ```js
     * { _: [], foo: 'banana' }
     * ```
     */
    coerce?: Mapped<(value: any) => any>;

    /**
     * Callback function that runs whenever a parsed flag has not been defined in options.\
     * Default: `undefined`
     * @param {string} flag Unknown flag.
     * @example
     * ```ts
     * import { parse } from 'ofi';
     *
     * parse(process.argv.slice(2), {
     *      boolean: ['foo'],
     *      unknown: function (flag) {
     *          console.log('Unknown flag: "%s"', flag);
     *      }
     * });
     * ```
     * `node program.js --foo --baz`:
     *
     * ```markdown
     * Unknown flag: "--baz"
     * ```
     */
    unknown?: (flag: string) => any;
}

declare type ArgvBase = Anyable<string> & {
    /**
     * Arguments that weren't associated with any option.
     */
    _: string[];
}

declare type ArgvPopulated<T extends boolean | undefined> = T extends true ? ArgvBase & {
    /**
     * Everything after `'--'` (end-of-flags) is treated as an argument and is stored here.\
     * Requires `'populate--'` option to be set to `true`.
     * @see https://unix.stackexchange.com/questions/11376/what-does-double-dash-mean
     */
    '--': string[];
} : ArgvBase;

/** Parsed arguments. */
export declare type Argv<T extends ArgsOptions['populate--'] = false> = ArgvPopulated<T>;

export type { Arrayable, Mapped };