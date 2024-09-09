import type { MockInstance } from 'vitest';
import { colors, define, type Meta } from '../src';
import { Command } from '../src/command';
import * as log from '../src/error';
import { isFlag } from '../src/utils';

describe('Command', () => {
    let cmd: Command, mockError: MockInstance
    const getErrorInfo = (meta: Meta, message: string) => colors.red(meta.name + `: ${message} For help, run command with '--help'.`)

    afterEach(() => {
        mockError.mockRestore();
    });
    beforeEach(() => {
        mockError = vi.spyOn(console, 'error').mockImplementation((a) => a);
        // 创建一个 Command 实例用于测试
        cmd = new Command({
            name: "test",
            version: "1.1.1",
            alias: [],
            type: "main",
            hint: '',
        }, [
            ['-a,arget', "arget desc", "arget default value"],
            ['-t,test', "test desc", "test default value"]
        ]);
    });

    it('`define` should work as expected', () => {
        const a = define({
            name: 'test',
            version: '1.1.1',
            args: [
                ["a,aa,assertion <name>", "default"],
                ["b,bb,benchmark <name>", "default"],
            ],
            action: () => {
                console.log('test action run');
            }
        })
        expect(a.meta).toEqual({
            type: 'main',
            name: 'test',
            version: '1.1.1',
            description: '',
            hint: '',
            alias: [],
            parent: null
        })
    })

    it('test subcommand created correctly', () => {
        const subCmd = cmd.sub(['i,in, install <lodash>', 'desc'], () => {
            console.log('install action run');
        })
        expect(subCmd.meta).toEqual({
            name: 'install',
            alias: ['i', 'in'],
            hint: 'lodash',
            description: 'desc',
            version: '1.1.1',
            type: 'sub',
            parent: cmd.render
        });
    });

    it('should run default command when default command set', () => {
        const argv = ['node', 'app'];
        cmd.sub(['i,in, install <lodash>'], () => {
            console.log('install action run');
        })
        cmd.sub(['a,ax, axxxx <sss>'], () => {
            console.log('axxxx');
        })
        cmd.default('i')
        const result = cmd.run(argv);
        expect(result).toEqual(cmd.runDefault());
    });

    it('should not run default command when defaultHelp disabled', () => {
        const argv = ['node', 'app'];
        cmd.set({ defaultHelp: false })
        const result = cmd.run(argv);
        expect(result).toEqual(cmd.runDefault());
    });

    it('should run version command when --version flag is present', () => {
        const argv = ['node', 'app', '--version'];
        const mockVersion = vi.spyOn(cmd, 'version')
        cmd.run(argv);
        expect(mockVersion).toHaveBeenCalledOnce()
    });

    it('should show help when --help flag is present', () => {
        const argv = ['node', 'app', '--help'];
        const mockHelp = vi.spyOn(cmd, 'help')
        cmd.run(argv);
        expect(mockHelp).toHaveBeenCalledOnce()
    });

    it('should handle flag when isFlag and not help', () => {
        const flag = '--test';
        const argv = ['node', 'app', flag];
        cmd.run(argv);
        expect(isFlag(flag)).toBe(true);
    });

    it('should error when invalid flag', () => {
        const invalidFlag = '--invalid';
        const argv = ['node', 'app', invalidFlag];
        cmd.run(argv);
        expect(mockError).toBeCalledTimes(1)
        expect(mockError).toHaveLastReturnedWith(getErrorInfo(cmd.meta, `Invalid Argument '${invalidFlag}'.`))
    });

    it('should run sub command when matching', () => {
        const subCmd = cmd.sub(['s,subcmd', 's description'], [
            ['o,options', 'a desc', 'default options value']
        ], (a) => {
            console.log('<subcmd> running', a);
            expect(Object.keys(a)).toEqual(['args'])
            expect(a.args.options).toEqual('xs')
        })

        vi.spyOn(subCmd, 'run'); // 将subCmd.run设置为一个spy

        cmd.rawArgs = ['node', 'app', 's', '-o', 'xs'];
        cmd.run();
        expect(subCmd.run).toHaveBeenCalledTimes(1);
    });

    it('should error when invalid sub command and flag', () => {
        const subCmd = cmd.sub(['i,in, install <lodash>'], () => { })
        const argv = ['node', 'app', 'ix'];
        cmd.run(argv);

        expect(mockError).toHaveBeenCalledTimes(1);
        expect(mockError).toHaveBeenLastCalledWith(getErrorInfo(cmd.meta, `Invalid Command 'ix'.`))

        const argva = ['node', 'test', 'i', '-x'];
        cmd.run(argva);
        expect(mockError).toHaveLastReturnedWith(getErrorInfo(subCmd.meta, `Invalid Argument '-x'.`));
    });

});
