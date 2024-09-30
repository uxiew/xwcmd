import { Command } from "./command";
import type { DefineCommands } from "./types";
import { XWCMDError } from "./error";

/**
   * invoke given any sub command
   */
export function call(cmd: Command, callArgv: any[] = []) {
  resolveMainCmd()
  return cmd.run(callArgv)
}


export function set() { }

/**
 * render output
 */

/**
 * define command
 */
export function define(defs: DefineCommands) {
  // validate defs
  const { name, args = [], action, version = '', default: d, description = '' } = defs
  if (!name) throw new XWCMDError('Name is required');
  if (!action) throw new XWCMDError('Action is required');
  // pass args to actions
  if (typeof action === 'function') {
    new XWCMDError('Action is required');
  }

  const main = new Command({
    name,
    version,
    description,
  }, args)
    .defineAction(action)
  if (d) main.default(d)
  return main
}
