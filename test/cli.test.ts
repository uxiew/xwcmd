import type { MockInstance } from 'vitest';
import { colors, type Meta } from '../src';
import { Command } from '../src/command';
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

  it('test subcommand created correctly', () => {
    const subCmd = cmd.sub(['i,in, install <lodash>', 'desc'], () => {
      console.log('install action run');
    })
    expect(subCmd.meta).toEqual({
      type: 'sub',
      name: 'install',
      alias: ['i', 'in'],
      hint: 'lodash',
      description: 'desc',
      version: '1.1.1',
      parent: cmd
    });
  });

  // it('should not run display help when defaultHelp disabled', () => {
  //   const argv = ['node', 'app'];
  //   cmd.set({ defaultHelp: false })
  //   cmd.run(argv);
  //   // expect(result).toEqual(cmd.runDefault());
  // });

  it('should run version command when --version flag is present', () => {
    const argv = ['node', 'app', '--version'];
    const mockVersion = vi.spyOn(cmd, 'version')
    cmd.run(argv);
    expect(mockVersion).toHaveBeenCalledOnce()
  });

  it(`Should show help when '--help' flag is present`, () => {
    const argv = ['node', 'app', 'xx', '-a', 'xx', '-t', 'testa', '--help'];
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
    // const invalidFlag2 = '--invalid';
    cmd.argv = ['node', 'app', invalidFlag];
    // must defineAction
    cmd.defineAction(() => {

    }).run();

    expect(mockError).toBeCalledTimes(1)
    expect(mockError).toHaveLastReturnedWith(getErrorInfo(cmd.meta, `Invalid Argument '${invalidFlag}'.`))
  });

  it('should run sub command when matching', () => {
    const subCmd = cmd.sub(['s,subcmd', 's description'], [
      ['o,options', 'a desc', 'default options value']
    ], (args) => {
      console.log('<subcmd> running', args);
      expect(Object.keys(args)).toEqual(['options', '_', "--"])
      expect(args.options).toEqual('xs')
    })

    vi.spyOn(subCmd, 'run'); // 将subCmd.run设置为一个spy

    cmd.argv = ['node', 'app', 's', '-o', 'xs'];
    cmd.run();
    expect(subCmd.run).toHaveBeenCalledTimes(1);
  });

  it('should error when invalid sub command and flag', () => {
    // Usage: bun add [flags] <pkg> [...<pkg>]
    const subCmd = cmd.sub(
      ['i,in, install [-xxx!,] <lodash>', 'install"s description'],
      [
        ['r,!recursive', 'recursive desc', false]
      ], (a, b) => {
        console.log(a, b);
      })
    // const argv = ['node', 'app', 'ix'];
    cmd.argv = ['node', 'app', 'ix'];
    // no action, no real run, so no error will be triggered
    cmd.defineAction(() => { })
    cmd.run();

    expect(mockError).toHaveBeenCalledTimes(1);
    expect(mockError).toHaveBeenLastCalledWith(getErrorInfo(cmd.meta, `Invalid Command 'ix'.`))
  });

  it('run sub command when any command invoke call method', () => {
    const subCmd = cmd.sub(
      ['i,in, install [-xxx!] <lodash>', 'install"s description'],
      [
        ['r,!recursive', 'recursive desc', false]
      ], (a, b) => {
        console.log(a, b);
      }).sub(
        ['xa [-xxx!]', 'install"s description']
        , (a, b) => {
          console.log(`xa-xaxx`, a, b);
        }).sub(
          ['xsa [-xxx!]', 'install"s description']
          , (a, b) => {
            console.log(`xa-xaxx`, a, b);
          })

    // no action, no real run, so no error will be triggered
    cmd.defineAction(() => { })

    subCmd.call('xa', [12, 'as', 'cc'])

    cmd.run(['node', 'app', 'ix']);
  })

});
