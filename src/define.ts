import { Command } from "./command";
import type { ProcessArgv, DefineCommands } from "./types";
import { XWCMDError } from "./error";
import { parseCliArgs } from "./utils";
import { parse } from "./args/parser";

export function runCmd(options: any, runner: () => void) {
  return new Command('c').run()
}

/**
 * Parses input arguments and applies defaults.
 * @param {ProcessArgv} argv - the process argv
 * @param {Exclude<DefineCommands['args'], undefined>} args - args,like `['a,arg <hint>','desc','default_value]`
 */
export function parseArgs(argv: ProcessArgv, args: Exclude<DefineCommands['args'], undefined>) {
  return parse(argv.slice(2), parseCliArgs(args))
}

export function define(defs: DefineCommands) {
  // validate defs
  const { name, args = [], action, version = '', description = '' } = defs
  if (!name) throw new XWCMDError('Name is required');
  if (!action) throw new XWCMDError('Action is required');
  // pass args to actions
  if (typeof action === 'function') {
    new XWCMDError('Action is required');
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
