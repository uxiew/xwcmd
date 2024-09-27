import { parse } from "./args/parser";
import type { ArgsOptions, Argv } from "./args/types";
import process from "node:process";
import { Render } from "./render";
import {
  FLAG_STR, print, toArray, toCamelCase,
  cleanArg, parseCliArgs,
  isFlag, matchSubCmd, splitFlag,
  parseByChar, formatArgs,
  parseDefaultArgs, stripFlag,
  getSubCmd, getMainCmd,
} from "./utils";
import { XWCMDError, errorWithHelp, log } from "./error";
import type {
  Args, CmdOptions, ProcessArgv,
  CommandAction, FormatArgs, Meta,
  RequiredMeta, Settings, SubCmd, Awaitable
} from "./types";
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
   *  '/node-versions/vx.x.x/bin/node', // subCmd will remove this item
   *  '/Projects/x/cli.js', // subCmd will remove this item
   *  'subCmd', // subCmd will remove this item
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
      default: '',
      alias: [],
      hint: '',
      parent: null,
      ...meta,
    }
    this.options = parseCliArgs(cliArgs)
    this.formatArgs = formatArgs(cliArgs)
    this.render = new Render(this.meta as RequiredMeta, this.formatArgs)
    this.set({
      header: this.meta.description,
    })
    this.default(this.meta.default!)
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

    return parse(argv, Object.assign(defaultOptions, options))
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
      return await action(parsed, result)
    }
    return this
  }

  /**
   * set default Command
   */
  default(cmd: string) {
    // check `cmd`
    if (cmd && cmd.length > 0 && !cmd.startsWith('[')) {
      throw new XWCMDError(`Invalid default command arguments '${cmd}' format.`)
    }
    // override sub default command
    this.defaultCmd = cmd
    return this
  }

  /**
   * invoke given any sub command
   */
  call(cmdName: string, callArgv: any[]) {
    const mainCmd = getMainCmd(this)
    const sub = getSubCmd(cmdName, mainCmd.subs, [])
    if (sub.cmd === null) {
      throw new XWCMDError(`No '${cmdName}' sub command found!`)
    }
    return sub.cmd.run(callArgv)
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
    // [subCmdName, parseByChar(subCmd), desc]
    this.render.addExtraInfo({
      type: 'Commands',
      info: this.subs.map(({ meta: { name: cmdName, description = '', hint = '' } }) => ['', cmdName, hint, 'string', description])
    })
    // TODO for all commands, display the help
    if (getMainCmd(this).render.settings.help) this.render.display()
    else {

    }
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
  private runDefault(args = this.argv) {
    const params = parseDefaultArgs(this.defaultCmd)
    if (!params) return this.process()
    // if (!params) return errorWithHelp(this.meta, `Invalid Command ${colors.underline(flag)}.`)
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
    params.required.every((r) => {
      if (!_argv.includes(FLAG_STR + r))
        throw new XWCMDError(`Missing required parameter '${colors.underline(r)}'!`)
    })

    const argvs = args.slice(
      args.findIndex((v) => v === _argv[_argv.length - 1]) + 1
    )

    const defaultResult = this.parse(params, _argv)
    if (!defaultResult) return
    const result = this.parse(this.options, argvs)
    if (!result) return
    return this.process(defaultResult, result)
  }

  on() {
    this.argv = this.argv.slice(2)
    this.run()
  }

  /**
   * parse args and run the action, Normally no parameters are required
   * @param {Array<String>} argv - custom process argv, default: `process.argv.slice(2)`
   */
  async run(argv: ProcessArgv = this.argv): Promise<unknown> {
    const argv_ = argv[0]
    const showHelp = argv.includes('--help') || argv.includes('-h')
    const showVersion = argv.includes('--version') || argv.includes('-v')
    // TODO check required args
    if (!argv_) return this.help()
    // if ()
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
          // move first arg to the end
          argv.push(argv.splice(0, 1)[0])
          return this.run(argv)
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
        if (!this.defaultCmd) return errorWithHelp(this.meta, `Invalid Command '${argv_}'.`)
        else return this.runDefault(argv)
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
    const defaultArg = parseByChar(subCmd, ['\[', '\]'])
    // init subCommand
    this.subs.push(new Command({
      name: alias.pop()!,
      version: this.meta.version,
      default: defaultArg ? `[${defaultArg}]` : '',
      type: 'sub',
      alias: alias,
      description: desc,
      hint: parseByChar(subCmd),
      parent: this,
    }, args)
      .defineAction(action)
    )

    return this.subs[this.subs.length - 1]
  }

}
