// Parser is from [ofi](https://github.com/mrozio13pl/ofi) "1.3.4" (MIT)
// modify behavior was consistent with [mri](https://github.com/lukeed/mri)

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Argv, ArgsOptions, Arrayable, Mapped } from './types';
import { isFlag, isLongFlag, isShortFlag, toKebabCase, isNumericLike, toCamelCase, QUOTES_REGEX, stripFlag } from '../utils';
import { parseValue, getAlias } from '../utils';

/**
 * Parse command-line arguments.
 *
 * @param {Arrayable<string>} args Arguments to parse (e.g., `process.argv.slice(2)`).
 * @param {Options} [options] Options for parsing given arguments.
 * @returns {Argv} Parsed arguments.
 *
 * @example
 * ```ts
 * import { parse } from 'ofi';
 *
 * parse(process.argv.slice(2), {
 *      number: ['size'],
 *      string: ['foo', 'name', 'surname'],
 *      boolean: ['dice', 'friendly'],
 *      array: ['list', 'my-numbers'],
 *      alias: { foo: ['f'] },
 *      default: { surname: 'obama', list: [] }
 * });
 * ```
 *
 * This would give the following results:
 *
 * `node program.js --size=3 --name barack -f baz --no-dice --friendly`:
 * ```js
 * {
 *   _: [],
 *   size: 3,
 *   name: 'barack',
 *   surname: 'obama',
 *   foo: 'baz',
 *   dice: false,
 *   list: [],
 *   friendly: true
 * }
 * ```
 *
 * `node program.js --list a b c -N hi there --myNumbers=13,1,2,3 -fas`:
 * ```js
 * {
 *   _: ['hi', 'there'],
 *   surname: 'obama',
 *   list: [ 'a', 'b', 'c' ],
 *   N: true,
 *   'my-numbers': [ 13, 1, 2, 3 ],
 *   foo: true,
 *   a: true,
 *   s: true
 * }
 * ```
 */
export function parse<T extends ArgsOptions>(args: Arrayable<string> | string, options = {} as T): Argv<T['populate--'] extends boolean ? T['populate--'] : false> | undefined {
  /**
   * Default options.
   */
  const defaultOptions = {
    shortFlagGroup: true,
    camelize: true,
    'populate--': false
  } as ArgsOptions;

  options = { ...defaultOptions, ...options };

  const result: Argv = { _: [] };
  const defaults = options.default || {};
  const alias = options.alias || {};
  const coerce = options.coerce || {};
  const camelize = options.camelize ? toCamelCase : (str: string) => str;

  // get every single flag
  const flags = [...Object.keys(defaults), ...Object.keys(coerce), ...Object.values(options).flat().filter(val => typeof (val) === 'string')].map(toCamelCase);

  if (typeof args === 'string') args = args.match(/"([^"]+)"|(\S+)/g) || args.split(/(\s+)/);

  // this is meant to filter out eg. empty spaces
  args = args.filter(Boolean);

  // populate '--'
  if (options['populate--']) result['--'] = [];

  let i = 0;
  let arg: string;

  /**
   * Get value of a flag if exists.
   * @returns {string | undefined}
   */
  function getNext(): any {
    // look for quotes
    const arr = arg.split('=')
    if (arr[1]) return arr[1];
    if (args[i + 1] && (!isFlag(args[i + 1]))) {
      i++; // skip key
      return parseValue(args[i])
    }
  }

  for (; i < args.length; i++) {
    arg = getAlias(args[i].split('=')[0], alias) || args[i].split('=')[0];

    if (args[i].split('=')[1]) arg += '=' + args[i].split('=')[1];

    if (!isFlag(args[i])) {
      result._.push(parseValue(args[i]));
      continue;
    }
    if (typeof (options.unknown) === 'function' && !getAlias(arg, alias) && !flags.includes(arg.replace(/-/g, ''))) {
      if (options.unknown(args[i].split('=')[0]) === false) return;
    }
    if (isLongFlag(arg)) {
      // Long option (e.g., --option or --option=value)
      // Use double hyphen (`--`) to signal the end of command-line options.
      if (arg === '--') {
        const rest = args.slice(i + 1).map(val => parseValue(val));
        result._.push(...rest);
        options['populate--'] && result['--'].push(...rest);
        break;
      }

      const [name, value] = arg.slice(2).split('=');
      const opt = toKebabCase(name);
      const res = camelize(opt);
      const next = value || args[i + 1];

      if (options.boolean?.includes(opt.replace(/^no-/, ''))) {
        if (opt.startsWith('no-')) {
          // For options like --no-something or --noSomething, set the boolean value to false
          result[camelize(opt.replace(/^no-/, ''))] = false;
        } else {
          // Set the value based on the input
          result[opt] = result[res] = next && !isFlag(next) && getNext()
        }
      } else if (options.number?.includes(opt)) {
        // if (!isNumericLike(next)) continue;

        result[opt] = result[res] = getNext();
      } else if (options.string?.includes(opt)) {
        // if (!getNext()) continue;
        i++
        result[opt] = result[res] = isFlag(next) ? '' : String(next);
      } else if (options.array?.includes(opt)) {
        if (!next) continue;

        if (value) {
          result[opt] = result[res] = value.split(',').map(val => parseValue(val));
          continue;
        }

        while (!!args[i + 1] && !isFlag(args[i + 1])) {
          if (!Array.isArray(result[res])) result[opt] = result[res] = [];
          i++;
          result[res].push(parseValue(args[i]));
        }
        result[opt] = result[res] = result[res] || defaults[opt] || defaults[res];
      } else {
        result[opt] = result[res] = parseValue(getNext()) || defaults[opt] || defaults[res];
      }
    } else if (isShortFlag(arg)) {
      // Short option (e.g., -f)
      // These are gonna be automatically converted into booleans.
      arg = arg.split('=')[0];

      if (!options.shortFlagGroup) {
        result[arg.slice(1)] = true;
        continue;
      }

      // leave only alphabetical (including other languages) and numerical characters
      arg = arg.replace(/[^\dA-Za-z\u00C0-\u1FFF\u2C00-\uD7FF]/g, '');

      // An arg like `-abc` will return `{ a: true, b: true, c: true}`.
      for (let j = 0; j < arg.length; j++) {
        const opt = getAlias('-' + arg[j], alias) || arg[j];
        // const argK = stripFlag(arg[j])
        // const val = (typeof result[argK] !== undefined) || true
        // console.log(`result`, arg[j], opt)

        // result[camelize(argK)] = val;
        result[camelize(stripFlag(opt))] = true;
      }
    }
  }

  // Convert coerce functions.
  for (const flag in coerce) {
    if (result[flag] !== void 0 && typeof (coerce[flag]) === 'function') {
      result[flag] = coerce[flag](result[flag]);
    }
  }

  return Object.assign(defaults, result) as Argv<T['populate--']>;
}
