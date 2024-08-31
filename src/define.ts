import process from "node:process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Command } from "./command";
import type { DefineCommands } from "./types";
import { CmdError } from "./error";
import { formatArgs } from "./utils";
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
    const { name, args, action } = defs
    if (!name) throw new CmdError('Name is required');
    if (!action) throw new CmdError('Action is required');
    // pass args to actions
    if (typeof action === 'function') {
        new CmdError('Action is required');
    }

    return new Command({
        name, version: defs.version, type: 'main',
        alias: [],
        hints: '',
        parent: null
    }, args)
        .defineAction(action)
}

export function defineCommand(defs: DefineCommands) {
    // validate defs
    const { name, args, action } = defs
    if (!name) throw new CmdError('Name is required');
    if (!action) throw new CmdError('Action is required');
    // pass args to actions
    if (typeof action === 'function') {
        new CmdError('Action is required');
    }
    if (args) {
        // throw `error: Invalid Argument '${x}'`
    }

    return new Command({
        name, version: defs.version, type: 'main',
        alias: [],
        hints: '',
        parent: null
    }, args)
        .defineAction(action)
}

