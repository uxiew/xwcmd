import { Command } from "./command";
import { Render } from "./render";
import type { DefineCommands, CommandSettings } from "./types";
import { XWCMDError } from "./error";
import { ArgsOptions } from "./args/types";

/**
 * set global settings, like `version`,`render.settings`
 */
export function setConfig(settings: CommandSettings) {
  const { unknownArgsError, help, error } = settings
  if (unknownArgsError) Command.settings.unknownArgsError = unknownArgsError
  if (help) Command.settings.help = help
  if (error) Command.settings.error = error
}

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
