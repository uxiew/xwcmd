import { Command } from "./command";
import type { DefineCommands } from "./types";
import { XWCMDError } from "./error";

export function define(defs: DefineCommands) {
  // validate defs
  const { name, args = [], action,
    version = '',
    description = '' } = defs
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
  }, args)
    .defineAction(action)
}
