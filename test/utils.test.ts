import { parse } from "ofi";
import { colors } from "../src";
import type { Arg, Args, CmdOptions, FormatArgs, Meta, Resolvable } from "../src/types";
import { matchSubCmd, stringLen, parseCliArgs, cleanArg, splitFlag, parseType, parseByChar, parseDefaultParams } from '../src/utils'

// 模拟 meta 对象
const meta = {
    name: "testCmd",
    alias: ["alias1", "alias2"]
};

describe('test utils function', () => {
    it('should work right when currentCmd matches name or an alias', () => {
        expect(matchSubCmd(meta, "testCmd")).toBe(true);
        expect(matchSubCmd(meta, "alias1")).toBe(true);
        expect(matchSubCmd(meta, "alias2")).toBe(true);
        expect(matchSubCmd(meta, "notAMatch")).toBe(false);
    });

    it('`stringLen` should return the length of a string exclude the ANSI color codes', () => {
        expect(stringLen(colors.yellow("string"))).toEqual(6);
    });
});


describe(`parse define's args utils function`, () => {

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
        const argv = ['node', 'program.js', 'i', '--_$1', 'false', '--_$2', 'xs', 'aaa', '--re', '--x'];
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
                "xs",
                "aaa",
            ],
            "re": true,
        });
    })

    it('`parseType` should work correctly', () => {
        expect(parseType("test <hint> | array ")).toEqual(['array', 'test']);
    })

    it('`parseDefaultParams` should work correctly', () => {
        expect(parseDefaultParams('[pkg!, re!|boolean, files|array]')).toEqual({
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

    it('`splitFlag` should work correctly', () => {
        expect(splitFlag("t,te, test [n|number] <hint> | array ")).toEqual(['t', 'te', 'test  <hint> | array']);
        expect(splitFlag("t,te, test [n|number, xx!|string] <hint> | array ")).toEqual(['t', 'te', 'test  <hint> | array']);
    })


    it('`cleanArg` work as expect', () => {
        expect(cleanArg("tesT")).toBe('tesT');
        expect(cleanArg(" tesT ")).toBe('tesT');
        expect(cleanArg(" tesT |xxx <'test'>")).toBe('tesT');
        expect(cleanArg(" tesT <'test'>")).toBe('tesT');
        expect(cleanArg("tesT [x!|array] | array")).toBe('tesT [x!|array]');
        expect(cleanArg("tesT [x!|array] | array | xxx")).toBe('tesT [x!|array]');
    });

    it('`parseCliArgs` should work', () => {
        expect(parseCliArgs([
            ['x,xxx! <hintxxx>', 'this is x desc'],
            ['s,str <hint|<like this>>', 'this is str desc', 'str default value'],
            ['n,number |number', 'this is number desc', 'number default value']
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
