import { Command } from "./command";
import type { ProcessArgv, DefineCommands } from "./types";
import { XWCLIError } from "./error";
import { parseCliArgs } from "./utils";
import { parse } from "./args/parser";

export function runCmd(options: any, runner: () => void) {
    return new Command('c').run()
}

/**
 * Parses input arguments and applies defaults.
 */
export function parseArgs(argv: ProcessArgv, args: Exclude<DefineCommands['args'], undefined>) {
    return parse(argv, parseCliArgs(args))
}

export function renderUsage() {

}

export function define(defs: DefineCommands) {
    // validate defs
    const { name, args = [], action, version = '', description = '' } = defs
    if (!name) throw new XWCLIError('Name is required');
    if (!action) throw new XWCLIError('Action is required');
    // pass args to actions
    if (typeof action === 'function') {
        new XWCLIError('Action is required');
    }

    return new Command({
        name,
        version,
        description,
        type: 'main',
        alias: [],
        hint: '',
        parent: null
    }, args)
        .defineAction(action)
}

export function defineCommand(defs: DefineCommands) {
    // 
}

