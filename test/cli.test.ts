import type { MockInstance } from 'vitest';
import { resolveSubCmd, type Meta } from '../src';
import { colors } from '../src/colors/picocolors';
import { CLI } from '../src/CLI';
import { subCLIStr } from './demo';

describe('Command', () => {
  let cmd: CLI, mockError: MockInstance
  const getErrorInfo = (meta: Meta, message: string) => colors.red(meta.name + `: ${message} For help, run command with '--help'.`)

  afterEach(() => {
    mockError.mockRestore();
  });
  beforeEach(async () => {
    mockError = vi.spyOn(console, 'error').mockImplementation((a) => a);
    // 创建一个 Command 实例用于测试
    cmd = (await import('./demo')).getCmd()
  });

  it('test subcommand created correctly', () => {
    const subCmd = cmd.sub('', subCLIStr, () => {
      console.log('sub install action run');
    })
    expect(subCmd.meta).toEqual({
      type: 'sub',
      name: 'install',
      alias: ['i', 'in'],
      hint: 'lodash',
      description: 'desc',
      version: cmd.meta.version,
      parent: cmd
    });
  });

  it('should error when invalid flag', () => {
    const invalidFlag = '--invalid';
    // const invalidFlag2 = '--invalid';
    cmd.argv = ['node', 'app', invalidFlag];
    // must defineAction
    cmd.action(() => {

    }).on();

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

    cmd.run(['s', '-o', 'xs']);
    expect(subCmd.run).toHaveBeenCalledTimes(1);
  });

  it('should error when invalid sub command and flag', () => {
    // Usage: bun add [flags] <pkg> [...<pkg>]
    const subCmd = cmd.sub(
      ['i,in, install [,] <lodash>', 'install"s description'],
      [
        ['r,!recursive', 'recursive desc', false]
      ], (a, b) => {
        console.log(a, b);
      }).default(['-xxx!'])
    // const argv = ['node', 'app', 'ix'];
    // no action, no real run, so no error will be triggered
    cmd.defineAction(() => { })
    cmd.run(['ix']);

    expect(mockError).toHaveBeenCalledTimes(1);
    expect(mockError).toHaveBeenLastCalledWith(getErrorInfo(cmd.meta, `Invalid Command 'ix'.`))
  });

  it('Run any async sub command by invoking the `call` method', async () => {
    const subCmd = cmd.sub(
      ['i,in, install [-xxx!] <lodash>', `install's description`],
      [
        ['r,!recursive', 'recursive desc', false]
      ], (a, b) => {
        console.log(`install running`, a, b);
      }).sub(
        ['fetch', `fetch's description`],
        (a, b) => {
          console.log(`fetch running`, a, b);
          return fetch(`https://jsonplaceholder.typicode.com/todos/${b.id}`)
            .then(response => response.json())
        }).default(['-id!'])
      .sub(
        ['xa', `xa's description`]
        , (a, b) => {
          console.log(`xa running`, a, b);
        }).default(['-x1!'])
    subCmd.sub(
      ['xx', `xx's description`]
      , (a, b) => {
        return { a, b }
      }).default(['-x2!'])
    // no action, no real run, so no error will be triggered
    cmd.defineAction(() => { })

    cmd.default(['...pksg!'], ['!boolean!'], ['-ss!']);

    const resFetch = await subCmd.call('fetch', ['12', 'a', 'bc'])
    const resXX = await subCmd.call('xx', ['12', 'a', 'bc'])
    expect(Object.keys(resFetch)).toContain('userId')
    expect(resXX.b).toEqual({ x2: 12 })
  })

});

describe('version | help show', () => {
  let cmd: Command
  beforeEach(() => {
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

  // it('should not run display help when defaultHelp disabled', () => {
  //   const argv = ['node', 'app'];
  //   cmd.set({ defaultHelp: false })
  //   cmd.run(argv);
  //   // expect(result).toEqual(cmd.runDefault());
  // });

  it('should run version command when --version flag is present', () => {
    const argv1 = ['--version'];
    const argv2 = ['-v'];
    const mockVersion = vi.spyOn(console, 'log')
    cmd.run(argv1);
    cmd.run(argv2);
    // expect(mockVersion).toHaveBeenCalledTimes(2)
  });

  it(`Should show help when '--help' flag is present`, () => {
    const argv2 = ['xx', '-a', 'xx', '--help'];
    const argv1 = ['-h'];
    const mockHelp = vi.spyOn(cmd, 'help')
    cmd.run(argv1);
    cmd.run(argv2);
    expect(mockHelp).toHaveBeenCalledTimes(2)
  });

})
