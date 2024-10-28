import { parse } from "../src/argv/parser";
import { colors } from "../src/colors/picocolors";
import {
  matchSubCmd, formatArgs, isFlag, isLongFlag, isShortFlag, format,
  parseValue,
  parseCLIArgs
} from '../src/utils'
import { CLIStr } from './demo'

// 模拟 meta 对象
const meta = {
  name: "testCmd",
  alias: ["alias1", "alias2"]
};

describe('test all utils function', () => {
  it('`format` the output string', () => {
    expect(format(CLIStr)).toBe(`  This is a mycli description. (version: 1.1.22)

  Usage: mycli <...arguments> <command> [...flags]

  Arguments:
    in        in's description (default: "ah") <number>
    pkg       pks's description [array]

  Commands:
    i,    install         lodash, axios, react
    u,un,uninstall      uninstall's description

    For more info, run any command with the --help flag.

  Flags:
    -t,-y, --target  <delay>               You kan see it is a description (default: "astronaut") <string>
    -m, --mean   [xxxxa]                   Is a description
    -l, --list1                            Thisis a desc for list1.(choices:["c1","c2","c3"]) [string]
        --array1                           array1's description,so test a long description, LOL, no other meaning (default: ["xx","sd"])   [array]
    -b, --boolean1                         Boolean s desc (default: false)  [boolean]
        --number1                          I am number1's desc (default: 0)   [number]
        --nom-test                         test a long d阿萨斯escription, LOL, no other meaning <boolean>

  Examples:
    Add a xx from the npm registry
    bun add zod
    bun add zod@next
    bun add zod@3.0.0`);
  });

  it('should work right when currentCmd matches name or an alias', () => {
    expect(matchSubCmd(meta, "testCmd")).toBe(true);
    expect(matchSubCmd(meta, "alias1")).toBe(true);
    expect(matchSubCmd(meta, "alias2")).toBe(true);
    expect(matchSubCmd(meta, "notAMatch")).toBe(false);
  });

  it('`parseCLIArgs` should work right when currentCmd matches name or an alias', () => {
    expect(parseCLIArgs({
      meta: { name: "subCLI" },
    })).toEqual({
      meta: {
        name: 'subCLI',
        type: 'sub',
      },
      cmds: [],
      opts: {
        alias: {},
        default: {},
      },
      args: {
        _: [],
        default: {},
      }
    });
    expect(parseCLIArgs({
      meta: { name: "subCLI1" },
      options: { number: { type: 'number', default: 1 } },
    })).toEqual({
      meta: {
        name: 'subCLI1',
        type: 'sub',
      },
      cmds: [],
      opts: {
        number: ['number'],
        alias: {},
        default: { number: 1 },
      },
      args: {
        _: [],
        default: {},
      }
    });

  });

  it('`parseValue` should return the length of a string exclude the ANSI color codes', () => {
    const val: string[] = [];
    expect(parseValue(val)).toEqual([]);
    expect(parseValue('val')).toEqual('val');
    expect(parseValue('["1", false]')).toEqual(['1', false]);
    expect(parseValue('[1, "2"]')).toEqual([1, '2']);
    expect(parseValue('false')).toEqual(false);
    expect(parseValue('123')).toEqual(123);
    expect(parseValue('60s')).toEqual('60s');
  });

  it('args parser should work correctly', () => {
    /*
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
    const argv = ['node', 'program.js', 'i', '--_$1', 'false', '--_$2', 'x,s', 'aaa', '--re', '--x'];
    const options = {
      string: ['_$1'],
      boolean: ['re'],
      array: ['_$2'],
      unknown: function (flag) {
        expect(flag).toEqual('--x')
        console.log('Unknown flag: "%s"', flag);
      }
    };
    const args = parse(argv.slice(3), options);

    expect(args).toEqual({
      "_": [],
      "_$1": "false",
      "_$2": [
        "x,s",
        "aaa",
      ],
      "re": true,
    });
  })

  it('`isFlag` should work', () => {
    const flag = '--test';
    const sflag = '-t';
    expect(isFlag(flag)).toBe(true);
    expect(isFlag(sflag)).toBe(true);
    expect(isLongFlag(flag)).toBe(true);
    expect(isShortFlag(sflag)).toBe(true);
  });

})
