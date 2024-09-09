import { parse } from "./args/parser";
import process from "node:process";
import { Render } from "./render";
import {
    cleanArg, parseCliArgs, isFlag, matchSubCmd, splitFlag,
    parseHint, stripFlag, toCamelCase,
    formatArgs,
    toArray,
    print
} from "./utils";
import { error, log } from "./error";
import stripAnsi from "strip-ansi";
import type { ArgsOptions, Argv } from "./args/types";
import type { Args, CmdOptions, CommandAction, FormatArgs, Meta, Settings, SubCmd } from "./types";

type ProcessArgv = typeof process['argv']

/**
 * manager all command 
 */
export class Command {

    render: Render;
    /** subCommands */
    private subs: Command[] = []
    /** handle the action function */
    private handle = () => { }

    /**
     * 
     * !Note: mainCommand is different from subCommand's rawArgs
     * 
     * @example
     * 
     * ```json
     * [
     *  '/Users/xxx//node-versions/v20.11.0/bin/node',
     *  '/Projects/x/cli.test.ts',
     *  'subCmd', // if this `subCmd` is subCommand's name , it will be removed 
     *  '-h'
     * ]
     * ```
     */
    rawArgs: ProcessArgv = process.argv

    /** 
     * default command name, or it's alias name
    */
    defaultCmd: string = ''

    /** Options for parsing given arguments. */
    options: CmdOptions
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
    args: FormatArgs[]

    get name() {
        return this.meta.name
    }
    get resolved(): Argv {
        return this.parse(this.options)
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
        this.args = formatArgs(cliArgs)
        this.render = new Render(meta, this.args)
        this.set({
            header: meta.description,
        })
    }

    static create(meta: Meta, flags: Args = []) {
        return new Command(meta, flags)
    }

    /**
     * parse command line argv
     */
    private parse(options: ArgsOptions = {}) {
        return parse(this.rawArgs.slice(2), options)
    }

    /**
     * set main action
     */
    defineAction(action: CommandAction) {
        this.handle = () => action({
            args: this.resolved
        })
        return this
    }

    /**
     * set render settings
     */
    set(settings: Settings) {
        this.render.set(settings)
    }

    version() {
        print(`${this.name}, ${this.meta.version}`);
    }

    /**
     * print the help info
     */
    help() {
        // add subCommand's info
        // [subCmdName, parseHint(subCmd), desc]
        this.render.addExtraInfo({
            type: 'Commands',
            info: this.subs.map(({ meta: { name: cmdName, description = '', hint = '' } }) => ['', cmdName, hint, 'string', description])
        })
        // display the help 
        return this.render.display()
    }

    examples(lines: Settings['examples']) {
        this.render.set({
            examples: lines
        })
    }

    /**
     * run default command.
     * If no command is set or no matching subcommand is found, the corresponding log or help information is displayed
     */
    private runDefault() {
        if (this.defaultCmd && this.subs.length === 0) {
            log("No command set!")
        }

        // find sub command
        const run = this.subs.some((subCmd) => {
            if (matchSubCmd(subCmd.meta, this.defaultCmd)) {
                subCmd.handle()
                return true
            }
        })
        if (!run) {
            if (this.defaultCmd) log(`'${this.defaultCmd}' command not found!`)
            else {
                if (this.render.settings.defaultHelp) this.help()
            }
        }
    }

    /**
     * parse args and run the action, Normally no parameters are required
     * @param {Array} argv - custom process argv, default: `process.argv`
     */
    run(argv: ProcessArgv = this.rawArgs) {
        const cmdFlag = argv[2]
        const showHelp = argv.includes('--help') || argv.includes('-h')
        const showVersion = argv.includes('--version') || argv.includes('-v')
        // try {
        if (!cmdFlag) return this.runDefault()
        if (showVersion) {
            return this.version()
        }
        if (isFlag(cmdFlag)) {
            if (showHelp) return this.help()
            const flag = stripFlag(cmdFlag)

            const isFlag = Object.entries(this.options.alias!).some(([flagName, alias]) => {
                // make `xxx-aa` equals `xxxAa`  
                if (stripAnsi(flagName) === flag || toCamelCase(stripAnsi(flagName)) === flag
                    || alias.some((a) => stripAnsi(a) === flag)
                ) return true
            })
            if (isFlag) return this.handle()
            else return error(this.meta, `Invalid Argument '${cmdFlag}'.`)
        }
        // When matching the specified args
        else {
            const isSubCmd = this.subs.some(subCmd => {
                if (matchSubCmd(subCmd.meta, cmdFlag)) {
                    // keep original process.argv
                    const subArgv = [...argv]
                    subArgv.splice(2, 1)
                    subCmd.rawArgs = subArgv
                    if (showHelp) subCmd.help()
                    else subCmd.run()
                    return true
                }
            })

            if (!isSubCmd) {
                // return `Invalid command: ${ tmp }`
                return error(this.meta, `Invalid Command '${cmdFlag}'.`)
            }
        }
    }

    /**
     * define subCommand
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

        /** `['i', 'in', 'install']` */
        const alias = splitFlag(subCmd).map(cleanArg)
        // init subCommand
        this.subs.push(new Command({
            type: 'sub',
            name: alias.pop()!,
            version: this.meta.version,
            alias: alias,
            description: desc,
            hint: parseHint(subCmd),
            parent: this.render,
        }, args)
            .defineAction(action)
        )
        return this.subs[this.subs.length - 1]
    }

    /**
     * set default Command
     */
    default(cmd: string) {
        this.defaultCmd = cmd
        return this
    }
}

