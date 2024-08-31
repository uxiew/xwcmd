import { parse } from "./args/parser";
import type { Argv } from "./args/types";
import process from "node:process";
import type { Args, CmdOptions, CommandAction, Meta, Settings, SubCmd } from "./types";
import { Render } from "./render";
import { argTrim, formatArgs, matchSubCmd, parseAlias } from "./utils";
import { CmdError, log } from "./error";


type ProcessArgv = typeof process['argv']

/**
 * manager all command 
 */
export class Command {

    render: Render;
    /** subCommands */
    private subs: Command[] = []

    private rawArgv: ProcessArgv = process.argv
    defaultCmd: string = ''

    /** Options for parsing given arguments. */
    options: CmdOptions
    resolvedArgs: Argv

    /** handle the main action function */
    handle: CommandAction = () => { }

    get name() {
        return this.meta.name
    }

    constructor(private readonly meta: Meta, private readonly args?: Args) {
        this.options = args ? formatArgs(args) : {
            description: {},
            hints: {}
        }
        this.resolvedArgs = this.parse()
        console.log(`--------------${meta.name}----------------`);
        this.render = new Render(meta, { args: this.resolvedArgs, options: this.options })
    }

    static create(meta: Meta, flags?: Args) {
        return new Command(meta, flags)
    }

    /**
     * parse command line argv
     */
    private parse() {
        return parse(this.rawArgv.slice(2), this.options)
    }

    /**
     * set main action
     */
    defineAction(action: CommandAction) {
        this.handle = () => {
            log(`run action: ${this.meta.name}`, this.rawArgv, this.options, this.resolvedArgs)
            return action({
                _argv: this.rawArgv,
                args: this.resolvedArgs
            })
        }
        return this
    }

    /**
     * set render settings
     */
    set(settings: Settings) {
        if (settings.needHelp) {
            this.addHelp()
        }
        this.render.set(settings)
    }

    private runDefaultCmd() {
        if (this.subs.length === 0 && this.defaultCmd) {
            log("Default command Not set!")
        }
        let i = 0, length = this.subs.length
        for (; i < length; i += 1) {
            const subCmd = this.subs[i];
            // simple alias support
            if (matchSubCmd(subCmd.meta, this.defaultCmd)) {
                return subCmd.handle()
            }
        }
        if (i === length) {
            if (this.defaultCmd) log(`"${this.defaultCmd}" command not found!`)
        }
    }

    help() {
        //    show help
        return this.render.show()
    }

    /**
     * add help command
     */
    addHelp() {
        this.render.addHelp()
        //    show help
        return this.sub('help', async (un) => {
            this.help()
        })
    }

    /**
     * parse args and run 
     */
    run() {
        try {
            // run default command
            if (this.resolvedArgs._.length === 0) {
                this.runDefaultCmd()
                this.render.show()
            }
            // When matching the specified args
            else {
                this.subs.forEach(subCmd => {
                    if (matchSubCmd(subCmd.meta, this.rawArgv[2])) {
                        if (this.render.settings.needHelp &&
                            (this.rawArgv[3] === '--help' || this.rawArgv[3] === '-h')) {
                            console.log(`subCmd`, subCmd);
                            return subCmd.help()
                        }
                        subCmd.handle()
                    }
                })
                // maybe remove this line, but now is ok?
                if (this.resolvedArgs._.length === 0) {
                    this.handle()
                }
                // this.subs...show('sub')
            }
        } catch (error) {
            throw new CmdError(error)
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

        const [subCmd, _desc] = Array.isArray(cmd) ? cmd : [cmd]

        // add RenderOutput
        // this.render.addSubInfo(subCmd);

        const alias = parseAlias(argTrim(subCmd))
        // init subCommand
        this.subs.push(new Command({
            name: alias.length > 1 ? alias.pop()! : alias[0],
            version: this.meta.version,
            alias: alias.length >= 1 ? alias : [],
            hints: subCmd.match(/<(.*?)>/)?.[1] ?? '',
            type: 'sub',
            parent: this,
        }, args).defineAction(action))
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

