import { colors } from "../src";
import type { Arg, Args, CmdOptions, FormatArgs, Meta, Resolvable } from "../src/types";
import { matchSubCmd, stringLen, parseCliArgs, cleanArg, splitFlag, parseType } from '../src/utils'

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

    it('`parseType` should work', () => {
        expect(parseType("test <hint> | array ")).toEqual(['array', 'test']);
    })

    it('`splitFlag` should work', () => {
        expect(splitFlag("t,te, test <hint> | array ")).toEqual(['t', 'te', 'test <hint> | array']);
    })


    it('`cleanArg` work as expect', () => {
        expect(cleanArg("tesT")).toBe('tesT');
        expect(cleanArg(" tesT ")).toBe('tesT');
        expect(cleanArg(" tesT |xxx <'test'>")).toBe('tesT');
        expect(cleanArg(" tesT <'test'>")).toBe('tesT');
    });

    it('`parseCliArgs` should work', () => {
        expect(parseCliArgs([
            ['x,xxx <hintxxx>', 'this is x desc'],
            ['s,str <hint|<like this>>', 'this is str desc', 'str default value'],
            ['n,number |number', 'this is number desc', 'number default value']
        ])).toEqual({
            description: { xxx: 'this is x desc', str: 'this is str desc', number: 'this is number desc' },
            hints: { xxx: 'hintxxx', str: 'hint|<like this>', number: '' },
            alias: { xxx: ['x'], str: ['s'], number: ['n'] },
            number: ['number'],
            string: ['xxx', 'str'],
            default: { str: 'str default value', number: 'number default value' },
        });

    });

})
