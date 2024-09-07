import { parse } from "./args/parser";
import process from "node:process";
import { Render } from "./render";
import {
    argTrim, parseCliArgs, isFlag, matchSubCmd, splitFlag,
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

    /**
     * ```json
     * [
     *  '/Users/xxx//node-versions/v20.11.0/bin/node',
     *  '/Projects/x/cli.test.ts',
     *  '-h'
     * ]
     * ```
     */
    private rawArg: ProcessArgv = process.argv
    /** default command name*/
    defaultCmd: string = ''

    /** Options for parsing given arguments. */
    options: CmdOptions
    resolved: Argv
    /**
     * clear args like
     * @example
     *
     * ```js
     * [
     *  [alias, flag, value hint, description, default value, data type]
     * ]
     * ```
     * 
     */
    args: FormatArgs[]

    /** handle the action function */
    handle = () => { }
    error = (msg: string) => { }

    get name() {
        return this.meta.name
    }

    constructor(private readonly meta: Meta, private readonly cliArgs: Args) {
        this.options = parseCliArgs(cliArgs)
        this.args = formatArgs(cliArgs)
        this.resolved = this.parse(this.options)
        this.render = new Render(meta, this.args)
        this.set({
            header: meta.description,
        })
        this.error = error.bind(null, meta)
    }

    static create(meta: Meta, flags: Args = []) {
        return new Command(meta, flags)
    }

    /**
     * parse command line argv
     */
    private parse(options: ArgsOptions = {}) {
        return parse(this.rawArg.slice(2), options)
    }

    /**
     * set main action
     */
    defineAction(action: CommandAction) {
        this.handle = action.bind(null, {
            rawArg: this.rawArg,
            args: this.resolved,
            options: this.options
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
            info: this.subs.map(({ meta: { name: cmdName, description = '', hint } }) => ['', cmdName, hint, 'string', description]
            )
        })
        // display the help
        return this.render.display()
    }

    examples(lines: Settings['examples']) {
        this.render.set({
            examples: lines
        })
    }

    private runDefaultCmd() {
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
     * parse args and run the action
     */
    run(argv: ProcessArgv = this.rawArg) {
        const cmdFlag = argv[2]
        const showHelp = argv.includes('--help') || argv.includes('-h')
        const showVersion = argv.includes('--version') || argv.includes('-v')
        // try {
        if (!cmdFlag) return this.runDefaultCmd()
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
            if (isFlag) this.handle()
            else this.error(`Invalid Argument '${cmdFlag}'.`)
        }
        // When matching the specified args
        else {
            const isSubCmd = this.subs.some(subCmd => {
                if (matchSubCmd(subCmd.meta, cmdFlag)) {
                    // keep original process.argv
                    const argv = [...subCmd.rawArg]
                    argv.splice(2, 1)
                    if (showHelp) subCmd.help()
                    else subCmd.run(argv)
                    return true
                }
            })

            if (!isSubCmd) {
                // return `Invalid command: ${ tmp }`
                return this.error(`Invalid command '${cmdFlag}'.`)
            }
        }
        // } catch (error) {
        //     throw new CmdError(error)
        // }
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
        const alias = splitFlag(subCmd).map(argTrim)
        // init subCommand
        this.subs.push(new Command({
            type: 'sub',
            name: argTrim(alias.pop()!),
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

