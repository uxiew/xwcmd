import { parse } from "./args/parser";
import type { ArgsOptions, Argv } from "./args/types";
import process from "node:process";
import { Render } from "./render";
import {
  cleanArg, parseCliArgs, isFlag, matchSubCmd, splitFlag,
  parseByChar,
  formatArgs,
  toArray,
  print,
  checkRequired,
  FLAG_STR,
  parseDefaultParams,
  stripFlag,
  toCamelCase,
  traverseToCall,
  getMainCmd,
} from "./utils";
import { XWCMDError, errorWithHelp, log } from "./error";
import type { Args, CmdOptions, ProcessArgv, CommandAction, FormatArgs, Meta, Settings, SubCmd, Awaitable } from "./types";
import { colors } from "./colors/picocolors";
import stripAnsi from "strip-ansi";


/**
 * manager all command
 */
export class Command {

  render: Render;
  /** subCommands */
  subs: Command[] = []
  /**
   * process the action function
   * @param { Record<string, any> } result - default command params resovled
   * @param { ArgvBase } resolved - argv parsed result
   */
  private process: ((result?: Record<string, any>, resolved?: Argv) => Awaited<unknown>)
    = () => { }

  /**
   *
   * !Note: mainCommand is different from subCommand's argv
   *
   * @example
   *
   * ```json
   * [
   *  '/node-versions/vx.x.x/bin/node',
   *  '/Projects/x/cli.js',
   *  'subCmd', // if this `subCmd` is subCommand's name , it will be removed
   *  '-h'
   * ]
   * ```
   */
  argv: ProcessArgv = process.argv

  /**
   * default command name, or it's alias name
  */
  defaultCmd: string = ''

  /** Options for parsing given arguments. */
  private options: CmdOptions
  /**
   * clear args like
   * @example
   *
   * ```js
   * [
   *  [alias, flag, value hint, description, default value, data type]
   * ]
   * ```
   */
  formatArgs: FormatArgs[]

  get name() {
    return this.meta.name
  }
  get type() {
    return this.meta.type
  }

  constructor(readonly meta: Meta, private readonly cliArgs: Args) {
    this.meta = {
      type: 'main',
      version: '',
      description: '',
      alias: [],
      hint: '',
      parent: null,
      ...meta,
    }
    this.options = parseCliArgs(cliArgs)
    this.formatArgs = formatArgs(cliArgs)
    this.render = new Render(meta, this.formatArgs)
    this.set({
      header: meta.description,
    })
  }

  static create(meta: Meta, flags: Args = []) {
    return new Command(meta, flags)
  }

  /**
   * parse command line argv
   * @param {ArgsOptions} options - args parser options
   */
  private parse(options: ArgsOptions = this.options, argv: ProcessArgv = this.argv) {
    const defaultOptions: ArgsOptions = {
      shortFlagGroup: false,
      "populate--": true,
      camelize: true,
      unknown: (flag) => {
        errorWithHelp(this.meta, `Invalid Argument '${flag}'.`)
        // abort
        return false
      }
    }

    return parse(argv.slice(2), Object.assign(defaultOptions, options))
  }

  /**
   * set action function
   */
  defineAction(action: CommandAction) {
    this.process = async (result, resolved) => {
      // remove `_`, `--` redundant keys
      if (result?._) {
        const { _, '--': __, ...res } = result;
        result = res
      }
      const parsed = resolved ?? this.parse();
      console.log(`fetch running - process`, parsed)
      return await action(parsed, result)
    }
    return this
  }

  /**
   * set default Command
   */
  default(cmd: string) {
    // check `cmd`
    if (this.type === 'main' && cmd.length > 0 && !cmd.startsWith('[')) {
      throw new XWCMDError(`Invalid default command parameters '${cmd}' format.`)
    }
    // override sub default command
    this.defaultCmd = cmd
    return this
  }

  /**
   * invoke given any sub command
   */
  call(name: string, callArgv: any[]) {
    const mainCmd = getMainCmd(this)
    const argv = traverseToCall(name, mainCmd.subs, [])
    if (argv === false) {
      throw new XWCMDError(`No '${name}' sub command found!`)
    }
    return mainCmd.run(['_', '_', ...argv, ...callArgv].map(s => String(s)))
  }

  /**
   * set settings, like `version`,`render.settings`
   */
  set(settings: Settings & {
    version?: string,
    /**
     * TODO Custom error messages
     */
    error?: () => void,
    /**
     * Callback function that runs whenever a parsed flag has not been defined in options.
     * return `true` to abort the action run.
     */
    unknownArgsError?: (flags: string) => void,
  }) {
    const { version, unknownArgsError } = settings
    // TODO
    if (unknownArgsError) this.options.unknown = unknownArgsError
    if (version) {
      this.meta.version = version
    }
    this.render.set(settings)
  }

  version() {
    print(this.meta.version);
  }

  /**
   * print the help info
   */
  help() {
    // TODO fix default command Usage
    // add subCommand's info
    // [subCmdName, parseByChar(subCmd), desc]
    this.render.addExtraInfo({
      type: 'Commands',
      info: this.subs.map(({ meta: { name: cmdName, description = '', hint = '' } }) => ['', cmdName, hint, 'string', description])
    })
    // display the help
    return this.render.display()
  }

  /**
   * add examples for this command, it will display in help info.
   */
  examples(lines: Settings['examples']) {
    this.render.set({
      examples: lines
    })
  }

  /**
   * TODO
   * add choices for this command, constraint some arg value can only be one of the choices
   * otherwise display `Invalid Argument` error
   */
  choices(values: any[]) {
    // values
  }

  /**
   * run default command.
   * @example
   *
   * ```sh
   *  bun xxxx
   *  npm i xxxx
   * ```
   */
  private runDefault() {
    const params = parseDefaultParams(this.defaultCmd)
    if (!params) return this.process()
    // if (!params) return errorWithHelp(this.meta, `Invalid Command ${colors.underline(flag)}.`)
    //  insert default params to capture the user input to the specific flag

    let flagIndex = this.argv.findIndex((v) => isFlag(v)),
      n = 0, pL = params._.length,
      _argv = this.argv.slice(0, flagIndex < 0 ? undefined : flagIndex);

    if (_argv.length >= 2 + pL) {
      // last one is not array，slice `_argv`
      if (!params.array?.includes(params._[pL - 1])) {
        _argv = _argv.slice(0, 2 + pL)
      }
    }
    for (let i = 0; i < _argv.length; i++) {
      // if (!isFlag(arg)) defaultArgv = _argv.slice(0, i)
      if (i > 0 && i % 2 === 0) {
        const isF = isFlag(_argv[i])
        const param = params._[n]
        // console.log(i, arg, n, params._[n], isF);
        if (param && !isF) {
          _argv.splice(i, 0, FLAG_STR + params._[n])
          n++
        }
      }
    }

    // check required param
    params.required.every((r) => {
      if (!_argv.includes(FLAG_STR + r, 2)) throw new XWCMDError(`Missing required parameter '${colors.underline(r)}'!`)
    })

    const argvs = this.argv.slice(0)
    argvs.splice(2, this.argv.findIndex((v) => v === _argv[_argv.length - 1]) - 1)

    const defaultResult = this.parse(params, _argv)
    if (!defaultResult) return
    const result = this.parse(this.options, argvs)
    if (!result) return
    return this.process(defaultResult, result)
  }

  /**
   * parse args and run the action, Normally no parameters are required
   * @param {Array} argv - custom process argv, default: `process.argv`
   */
  async run(argv: ProcessArgv = this.argv): Promise<unknown> {
    const argv_ = argv[2]
    const showHelp = argv.includes('--help') || argv.includes('-h')
    const showVersion = argv.includes('--version') || argv.includes('-v')
    // TODO check required args
    if (!argv_) this.help()
    if (isFlag(argv_)) {
      if (showHelp) return this.help()
      if (showVersion) return this.version()

      let cmdFlag = '', flag = stripFlag(argv_)
      const isCmdFlag = Object.entries(this.options.alias!).some(([flagName, alias]) => {
        cmdFlag = stripAnsi(flagName)
        if (cmdFlag === flag) return true
        // make `xxx-aa` equals `xxxAa`
        cmdFlag = toCamelCase(cmdFlag)
        if (cmdFlag === flag) return true
        if (alias.some((a) => stripAnsi(a) === flag)) return true
      })

      if (isCmdFlag) {
        // like `npm -D install tsx`, Move boolean/undefined value to the end, need check all commands flag include sub commands.
        if (this.options.boolean?.includes(cmdFlag)) {
          argv.push(argv.splice(2, 1)[0])
          return this.run(argv)
        }
      }
      // else {
      //     return errorWithHelp(this.meta, `Invalid Argument '${argv_}'.`)
      // }
      return this.process()
    }
    // When matching the specified args
    else {
      let subIndex: number = -1
      const isSubCmd = this.subs.some((subCmd, i) => {
        if (matchSubCmd(subCmd.meta, argv_)) {
          // keep original process.argv
          const subArgv = [...argv]
          subArgv.splice(2, 1)
          subCmd.argv = subArgv
          if (showHelp) subCmd.help()
          else { subIndex = i }
          return true
        }
      })

      /** `node app subcmd x xx xxx -f xxxx` */
      /**  the `x` is not subCommand, it will be treated as a flag */
      if (isSubCmd && subIndex > -1) {
        return this.subs[subIndex].run()
      }
      else {
        if (showHelp) this.help()
        if (!this.defaultCmd) return errorWithHelp(this.meta, `Invalid Command '${argv_}'.`)
        else return this.runDefault()
      }
    }
  }

  /**
   * define subCommand
   * @example
   * ```js
   *  cmd.sub(
   *  ['i,in,install','desc','default_value'],
   *  [
   *     ['r,recursive |boolean','desc',false]
   *  ],
   *  ()=>{}
   * )
   * ```
   */
  sub(cmd: SubCmd, action: CommandAction): Command;
  sub(cmd: SubCmd, args: Args, action: CommandAction): Command;
  sub(cmd: SubCmd, argOrAction: Args | CommandAction, maybeAction?: CommandAction): Command {
    let action: CommandAction;
    let args: Args;

    if (typeof argOrAction === 'function') {
      action = argOrAction as CommandAction;
      args = []
    } else {
      args = argOrAction
      action = maybeAction as CommandAction;
    }

    const [subCmd, desc = ''] = toArray(cmd)

    /** @example ['i', 'in', 'install'] */
    const alias = splitFlag(subCmd).map(cleanArg)

    // init subCommand
    this.subs.push(new Command({
      name: alias.pop()!,
      version: this.meta.version,
      type: 'sub',
      alias: alias,
      description: desc,
      hint: parseByChar(subCmd),
      parent: this,
    }, args)
      .defineAction(action)
      .default(subCmd)
    )

    return this.subs[this.subs.length - 1]
  }

}
