
import { CLI } from "./CLI";
import type { CLIAction, CLISettings } from "./types";

export * from "./utils";

// export * from "./args/types";
export * from "./types";

/**
 * set global settings, like `version`
 */
export function setConfig(settings: CLISettings) {
  const { unknownError, help, error } = settings
  if (unknownError) CLI.settings.unknownError = unknownError
  if (help) CLI.settings.help = help
  if (error) CLI.settings.error = error
}

/**
* The command is generated from this style string
* @param format — The final output style of the command
*/
export const cli = CLI.createCLI
