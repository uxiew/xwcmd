import { parse } from "../src/args/parser";
import { colors } from "../src";
import { matchSubCmd, stringLen, parseCliArgs, cleanArg, splitFlag, parseType, parseByChar, parseDefaultParams, formatArgs } from '../src/utils'
import stripAnsi from "strip-ansi";

// 模拟 meta 对象
const meta = {
  name: "testCmd",
  alias: ["alias1", "alias2"]
};

describe('test all utils function', () => {
  it('should work right when currentCmd matches name or an alias', () => {
    expect(matchSubCmd(meta, "testCmd")).toBe(true);
    expect(matchSubCmd(meta, "alias1")).toBe(true);
    expect(matchSubCmd(meta, "alias2")).toBe(true);
    expect(matchSubCmd(meta, "notAMatch")).toBe(false);
  });

  it('`stringLen` should return the length of a string exclude the ANSI color codes', () => {
    expect(stringLen(colors.yellow("string"))).toEqual(6);
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

  it('`parseType` should work correctly', () => {
    expect(parseType("-test <hint>")).toEqual(['number', 'test']);
    expect(parseType("!test ")).toEqual(['boolean', 'test']);
    expect(parseType("!test ")).toEqual(['boolean', 'test']);
    const v1 = colors.blue('...list')
    const v2 = '...list'

    expect(parseType(stripAnsi(v1))).toEqual(['array', 'list']);
    expect(parseType(v2 + '<files>')).toEqual(['array', 'list']);
  })

  it('`parseDefaultParams` should work correctly', () => {
    expect(parseDefaultParams('[pkg!, !re!, ...files]')).toEqual({
      "_": [
        "pkg",
        "re",
        "files",
      ],
      "alias": {
        "files": [],
        "pkg": [],
        "re": [],
      },
      "array": [
        "files",
      ],
      "boolean": [
        "re",
      ],
      "description": {
        "files": "",
        "pkg": "",
        "re": "",
      },
      "hints": {
        "files": "",
        "pkg": "",
        "re": "",
      },
      "required": [
        "pkg",
        "re",
      ],
      "string": [
        "pkg",
      ],
    });
  })

  it('`parseByChar` should work correctly', () => {
    expect(parseByChar("t,te, test <hint| < xxx>> | array ")).toEqual('hint| < xxx>');
  })

  it('`formatArgs` should work correctly', () => {
    expect(formatArgs([
      [`t,te, ...${colors.yellow('test')} <hint>`, 'desc', []],
      [`t,te, -test <hint>`, 'desc', []],
      [`t,te, !${colors.yellow('test')} <hint>`, 'desc', []]
    ])).toEqual([
      ['t,te', 'test', 'hint', 'array', 'desc', []],
      ['t,te', 'test', 'hint', 'number', 'desc', []],
      ['t,te', 'test', 'hint', 'boolean', 'desc', []]
    ]);
  })

  it('`splitFlag` should work correctly', () => {
    expect(splitFlag("t,te, ...test [+n] <hint> ")).toEqual(['t', 'te', '...test  <hint>']);
    expect(splitFlag("t,te, test [+n, xx!] <hint>")).toEqual(['t', 'te', 'test  <hint>']);
  })


  it('`cleanArg` work as expect', () => {
    expect(cleanArg("tesT")).toBe('tesT');
    expect(cleanArg(" tesT ")).toBe('tesT');
    expect(cleanArg(" tesT |xxx <'test'>")).toBe('tesT');
    expect(cleanArg(" tesT <'test'>")).toBe('tesT');
    expect(cleanArg("...tesT [...x!]")).toBe('tesT [...x!]');
    expect(cleanArg("...tesT [...x!] | array | xxx")).toBe('tesT [...x!]');
  });

  it('`parseCliArgs` should work', () => {
    expect(parseCliArgs([
      ['x,xxx! <hintxxx>', 'this is x desc'],
      ['s,str <hint|<like this>>', 'this is str desc', 'str default value'],
      ['n,-number', 'this is number desc', 'number default value']
    ])).toEqual({
      description: { xxx: 'this is x desc', str: 'this is str desc', number: 'this is number desc' },
      hints: { xxx: 'hintxxx', str: 'hint|<like this>', number: '' },
      alias: { xxx: ['x'], str: ['s'], number: ['n'] },
      number: ['number'],
      string: ['xxx', 'str'],
      default: { str: 'str default value', number: 'number default value' },
      required: ['xxx']
    });

  });

})
