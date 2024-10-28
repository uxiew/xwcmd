import { CLIGroup, CLIOpts, Meta, ParsedResult, TypeOpts } from "./types";
import { argvTypes, parseValue, stripFlag, toCamelCase } from "./utils";

const ARGUMENTS_DESC_REG = /\s*[^(-+\w+\s+.+?\s+)](\w+)\s+(.+?)\s+/;

/**
* Matches the last optional `[string]` or `< string>`
* @example
* ```sh
*  ... [data_type]
* ```
*/
const TYPE_REG = /\s*(?:([\[|<]\w+[>|\]]))/;

/**
* get default value
* @example
* ```sh
* ...  (default: true) ...
* ```
*/
const DEFAULT_REG = /(\(default:\s*["']?(.*?)["']?\))?/;


/**
* data type and is Required?
* @example
* ```sh
*  ...
*  ...   -f, --flag   ...
*  ...
* ```
*/
const FLAG_NAME_ALIAS_REG = /\s*(-(\w+))?,?\s?--(\w+)/;


function combineReg(a: RegExp, b: RegExp) {
  return new RegExp(a.source + b.source)
}

export const SIGN_REG = /(?=\s*(;;|\n\s*\n))/;

// Extract regular expressions for CLI name, Arguments, Commands, and Flags data

/**
* match the Usage part.
* @example
* ```sh
*   Usage: mycli <...arguments> <command> [...flags]
* ```
*/
export const metaRegex = /\s*(?:.*?)\s*(\(ver(?:sion)?:\s*v?(.+?)\))\s*usage:\s*(\w+)/i;

/**
* match the Arguments part.
* @example
* ```sh
*   Commands:
*     install       lodash, axios, react
*     uninstall     uninstall's description
*   ;;
* ```
*/
const argumentsRegex = combineReg(/Arguments:\s*([\s\S]*?)/, SIGN_REG)

/**
* match the Commands part.
* @example
* ```sh
*   Commands:
*     install       lodash, axios, react
*     uninstall     uninstall's description
*   ;;
* ```
*/
const commandsRegex = combineReg(/Commands:\s*([\s\S]*?)/, SIGN_REG)


/**
* match the Flags/Options part.
* @example
* ```sh
*   Flags:
*     -m, --mean   [xxxxa]                   Is a description
*   ;;
* ```
*/
const flagsRegex = combineReg(/(?:[Ff]lag|[Oo]ption)s:\s*([\s\S]*?)/, SIGN_REG);

function groupType(options: TypeOpts, typeStr: string, name: string) {
  // Parse the output correctly or incorrectly
  let parseError = true;
  const defVal = (key: string) => {
    // @ts-ignore
    options[key] = options[key] || []
  }
  argvTypes.forEach((t, i) => {
    if (new RegExp(t).test(typeStr)) {
      defVal(t)
      // @ts-ignore
      options[t].push(name)
      parseError = false
    }
    if (`<${t}>` === typeStr) {
      (options.required || (options.required = [])).push(name)
    }
    // once
    if (i === 0) {
      if (!typeStr) {
        // @ts-ignore
        options.string.push(name)
        parseError = false
      }
    }
  })
  return parseError
}

/**
* parse cli's output help string
*
* @param text - output help
* @param options - parseCLI Options
*/
export function parseCli(text: string, options?: {
  type: Meta['type']
}) {
  const parsers: Record<CLIGroup, (m: RegExpMatchArray) => any> = {
    // CLI meta
    meta: (m) => ({
      name: m[3],
      version: m[2],
      type: 'main',
    }),
    /**
     * Parse command-line default arguments
     *```ts
     *  {
     *    string: ['pkg'],
     *    boolean: ['re'],
     *    array: [files],
     *    required:['pkg', 're'],
     *    _:[],
     * }
     *```
     */
    args: (match) => match[1].split('\n').reduce((args, cur) => {
      const [, name, catelog, value, type] = cur.match(/(\w+)\s+(?:.+?)(?:\s*\((default|choices):\s*["']?(.*?)["']?\))?\s*([\[|<]\w+[>|\]])/) || [];
      args._.push(name)
      if (catelog) {
        args[catelog][name] = parseValue(value)
      }
      args.error = groupType(args, type, name)
      return args
    },
      // @ts-ignore
      { default: {}, _: [] } as Meta['args']
    ),
    // sub commands
    cmds: (match) => match[1].split('\n').map(cmd => {
      const [, alias] = cmd.match(/((?:\w+(?:,\s*)?)+)\s*(?:\w+)(?:.+)/) || [];
      const c = alias?.split(/,\s*/)
      return { name: c.pop(), alias: c };
    }),
    // CLI flags/options
    opts: (match) => match[1].split('\n').reduce((options, f) => {
      /**
      * parse flags string, the last string `[data_type]` can not be ignored!
      * @example
      * ```sh
      *   ...
      *   -f, --flag <number>   description (default: true) [data_type]
      *   -t, --no-test [text]  description (default: "value") [data_type, required]
      *   ...
      * ```
      */
      const [, alias, name, catelog, value, type, _,] =
        f.match(/(?:(-[\w,\s-]+),\s+)?--([\w-]+)(?:\s+(?:[\[|<]\w+[>|\]]))?\s+(?:.+?)(?:\s*\((default|choices):\s*["']?(.*?)["']?\))?\s*([\[|<]\w+[>|\]])?$/) || [];

      // t means data type
      options.error = groupType(options, type, name)

      const sFlags = alias?.split(/,\s*/).map(a => stripFlag(a))
      sFlags?.length > 0 && (options.alias[name] = sFlags)

      if (catelog) {
        //TODO if (default: 60s) means `one minute`
        options[catelog][name] = parseValue(value)
      }
      return options;
    }, {
      alias: {},
      default: {},
      choices: {},
    } as Required<CLIOpts>)
  };

  const result = ([
    ['meta', metaRegex],
    ['args', argumentsRegex],
    ['cmds', commandsRegex],
    ['opts', flagsRegex],
  ] as [CLIGroup, RegExp][]).reduce((result, [key, regex]) => {
    const match = text.match(regex);
    result[key] = match ? parsers[key](match) : [];
    return result;
  }, {} as ParsedResult)

  if (result.args.error && result.opts.error || !result.meta.name || !result.meta.version) {
    throw new Error("The provided CLI output string is incorrect!")
  }
  return result
};
