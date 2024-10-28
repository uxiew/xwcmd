import { parse as argvParse } from "./argv/parser";
import process from "node:process";
import {
  FLAG_STR, print, toCamelCase,
  isFlag, matchSubCmd, stripFlag, format,
  resolveSubCmd, resolveMainCmd, simpleEqual,
  getAlias,
  parseCLIArgs,
} from "./utils";
import { errorWithHelp, error, log } from "./error";
import type {
  CLIOptions, ProcessArgv,
  CLIAction, Meta,
  CLISettings, ParsedResult,
  CLIParamDef,
} from "./types";
import type { ArgsOptions, Argv } from "./argv/types";
import { parseCli } from "./parser";

type CLIDataType = Partial<ParsedResult> & Pick<ParsedResult, 'meta'>;

/**
 * manager all command/CLI
 */
export class CLI {

  static settings: CLISettings = {
    clean: true,
    removeType: true,
    colorful: true,
    help: true,
    // TODO
    // This allows you to pass arguments and following options
    // to another program without using `--` to terminate option parsing
    // passThrough: false,
  }

  meta: Meta
  /** subCommands */
  subs: CLI[] = []
  /**
   * process the action function
   * @param { Record<string, any> } result - default command params resovled
   * @param { ArgvBase } resolved - argv parsed result
   */
  private process: (result?: Record<string, any>, resolved?: Argv) => Awaited<unknown>
    = () => { }

  /**
   *
   * !Note: mainCommand is different from subCommand's argv
   *
   * @example
   *
   * ```json
   * [
   *  '/node-versions/vx.x.x/bin/node', // subCmd will remove this item
   *  '/Projects/x/cli.js', // subCmd will remove this item
   *  'subCmd', // subCmd will remove this item
   *  '-h'
   * ]
   * ```
   */
  argv: ProcessArgv = process.argv.slice(2)

  /** Options for parsing given arguments. */
  private options!: CLIOptions

  get main() {
    return resolveMainCmd(this)
  }

  get name() {
    return this.meta.name
  }

  constructor(private output: string, private CLIData?: CLIDataType) {
    this.init(CLIData || parseCli(output))
  }

  private init(parsed: CLIDataType) {
    this.meta = {
      args: parsed.args!,
      ...parsed.meta,
    }
    this.options = parsed.opts!

    parsed.cmds?.forEach(({ name, alias }) => {
      this.subs.push(new CLI('', {
        meta: {
          name,
          version: this.meta.version,
          type: 'sub',
          alias
        },
      }))
    })
    return this
  }

  static createCLI(output: string | CLIParamDef, action?: CLIAction) {
    const isStr = typeof output === 'string'
    const cli = new CLI(
      isStr ? output : '',
      isStr ? undefined : parseCLIArgs(output)
    )
    action && cli.action(action)
    return cli
  }

  /**
   * parse command line argv
   * @param {ArgsOptions} options - args parser options
   */
  private parse(options: ArgsOptions = this.options, argv: ProcessArgv = this.argv) {
    const defaultOpts: ArgsOptions = {
      unknown: (flag) => {
        if (CLI.settings.unknownError) {
          return CLI.settings.unknownError(flag, this.meta)
        }
        return errorWithHelp(this.meta, `Invalid Argument '${flag}'.`)
      }
    }

    const result = argvParse(argv, Object.assign(defaultOpts, options))
    // TODO check choices
    return result
  }

  version(): string
  version(ver: string): this;
  version(ver?: string) {
    if (ver) {
      this.meta.version = ver
      return this
    }
    return this.meta.version
  }

  opts() {
    return this.parse()
  }

  /**
   * define cli's action function
   */
  action(action: CLIAction) {
    this.process = async (result, resolved) => {
      // remove `_`, `--` redundant keys
      if (result?._) {
        const { '--': __, ...res } = result;
        result = res
      }
      const parsed = resolved ?? this.parse();
      // abort
      if (!parsed) return
      return await action(parsed, result, this)
    }
    return this
  }

  /**
   * invoke given any sub command
   * @param { String } name - command's name
   */
  call(name: string, callArgv: any[]) {
    const sub = resolveSubCmd(this, name)
    if (sub.cmd === null) {
      throw new Error(`No '${name}' sub command found!`)
    }
    return sub.cmd.run(callArgv)
  }

  /**
   * print the help info
   * @param {string} helpInfo - Custom output help string
   */
  help(output?: string) {
    if (output) {
      this.output = output
    }
    //  display the help
    else if (CLI.settings.help) {
      this.output && print(format(this.output, CLI.settings))
    }
    return this
  }

  /**
   * run command with default arguments(args)
   * @example
   *
   * ```sh
   *  bun xxxx
   *  npm i xxxx
   * ```
   */
  private runWithArgs(args = this.argv) {
    const { args: params } = this.meta
    if (!params) return this.process()
    //  insert default params to capture the user input to the specific flag
    let flagIndex = args.findIndex((v) => isFlag(v)),
      n = 0, pL = params._.length,
      _argv = args.slice(0, flagIndex < 0 ? undefined : flagIndex);

    if (_argv.length >= pL) {
      // `params._`'s last one is not array，slice `_argv`
      if (!params.array?.includes(params._[pL - 1])) {
        _argv = _argv.slice(0, pL)
      }
    }
    for (let i = 0; i < _argv.length; i++) {
      if (i % 2 === 0) {
        const isF = isFlag(_argv[i])
        const param = params._[n]
        if (param && !isF) {
          _argv.splice(i, 0, FLAG_STR + params._[n])
          n++
        }
      }
    }

    // check required param
    params.required?.every((r) => {
      if (!_argv.includes(FLAG_STR + r))
        throw new Error(`Missing required parameter '${r}'!`)
    })

    const argvs = args.slice(
      args.findIndex((v) => v === _argv[_argv.length - 1]) + 1
    )

    // parse cli's arguments
    const argsRes = this.parse(params, _argv)
    if (!argsRes) return
    // parse cli's options/flags'
    const flagsRes = this.parse(this.options, argvs)
    if (!flagsRes) return
    return this.process(argsRes, flagsRes)
  }

  /**
  * CLI program's main entry method,
  * just like the `parse` method for other programs
  */
  on() {
    this.run()
  }

  /**
   * parse args and run the action, Normally no parameters are required
   * @param {Array<String>} argv - custom process argv, default: `process.argv.slice(2)`
   */
  async run(argv: ProcessArgv = this.argv): Promise<unknown> {
    const argv_ = argv[0]
    /**
    * add `--help` for output help info
    * (['h', 'help', '', 'string', 'Print this help menu'])
    */
    const showHelp = argv.includes('--help') || argv.includes('-h')
    const showVersion = argv.includes('--version') || argv.includes('-v')
    // TODO check required args
    if (!argv_) return this.help()
    if (isFlag(argv_)) {
      if (showHelp) return this.help()
      if (showVersion) return print(this.meta.version)

      const flag = stripFlag(argv_), cmdFlag = getAlias(argv_, this.options.alias!)

      // like `npm -D i x`, Move boolean/undefined value to the end,
      // need check all commands flag include sub commands.
      // if main cmd and sub cmd both have `-D` so that may be a problem
      if (this.options.boolean?.includes(stripFlag(cmdFlag || argv_))) {
        // move first arg to the end
        let newArg = [...argv]
        const last = newArg.splice(0, 1)[0]
        newArg = [...newArg, last]
        if (!simpleEqual(newArg, argv)) {
          this.argv = newArg
          return this.run()
        }
      }
      return this.process()
    }
    // When matching the specified args
    else {
      const [cmd] = this.subs.filter((subCmd, i) => matchSubCmd(subCmd.meta, argv_))
      if (cmd) {
        // keep original process.argv
        cmd.argv = argv.slice(1)
        if (showHelp) return cmd.help()
        return cmd.run()
      }
      /** `node app subcmd x xx xxx -f xxxx` */
      /**  the `x` is not subCommand, it will be treated as a flag */
      else {
        if (showHelp) return this.help()
        if (this.meta.args._.length > 0) return this.runWithArgs(argv)
        return errorWithHelp(this.meta, `Invalid Command '${argv_}'.`)
      }
    }
  }

  /**
   * define a subCommand
   */
  sub(output: string | CLIParamDef, action: CLIAction) {
    let cli: CLI
    const create = (exist: boolean, data: string | CLIParamDef) => {
      if (!exist) cli = CLI.createCLI(data, action)
      this.subs.push(cli)
    }
    if (typeof output === 'string') {
      const p = parseCli(output)
      create(this.subs.some((cmd) => {
        if (cmd.name === output) {
          cli = cmd
            .action(action)
            .version(this.version())
          return cli
        }
        if (cmd.name === p.meta.name) {
          cli = cmd
            .init(p)
            .action(action)
            .version(this.version())
            .help(output)
          return cli
        }
      }), output)
    } else {
      create(this.subs.some((cmd) => {
        if (cmd.name === output.name) {
          cli = cmd
            .init(parseCLIArgs(output))
            .action(action)
            .version(this.version())
          return cli
        }
      }),
        output
      )
    }
    return cli!
  }

}
