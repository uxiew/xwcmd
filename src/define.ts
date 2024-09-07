import { Command } from "./command";
import type { DefineCommands } from "./types";
import { CmdError } from "./error";
/***
 * 
 * define a single command
 * 
 * ```sh
 *  single mycommand
 *  single -i mycommand
 *  single -n mycommand
 * ```
 * 
 * @example
 * 
 * ```ts
 *  parseCmd('',()=>{
 *      
 *  })
 * ```
 */
export function runCmd(options: any, runner: () => void) {
    return new Command('c').run()
}

export function parseArgs(options: any, runner: () => void) {
    return new Command(s).run()
}

export function renderUsage() {

}

export function define(defs: DefineCommands) {
    // validate defs
    const { name, args = [], action, description = '' } = defs
    if (!name) throw new CmdError('Name is required');
    if (!action) throw new CmdError('Action is required');
    // pass args to actions
    if (typeof action === 'function') {
        new CmdError('Action is required');
    }

    return new Command({
        name, version: defs.version, type: 'main',
        alias: [],
        description,
        hint: '',
        parent: null
    }, args)
        .defineAction(action)
}

export function defineCommand(defs: DefineCommands) {
    // validate defs
    const { name, args = [], action } = defs
    if (!name) throw new CmdError('Name is required');
    if (!action) throw new CmdError('Action is required');
    // pass args to actions
    if (typeof action === 'function') {
        new CmdError('Action is required');
    }

    return new Command({
        name, version: defs.version, type: 'main',
        description: '',
        alias: [],
        hint: '',
        parent: null
    }, args)
        .defineAction(action)
}

