import type { ArgsOptions } from "./args/types";
import type { Command } from "./command";

export type ProcessArgv = typeof process['argv']

export type Awaitable<T> = () => T | Promise<T>;
export type Resolvable<T> = T | Promise<T> | (() => T) | (() => Promise<T>);

export type CmdOptions = ArgsOptions & {
  required: string[]
  description: Record<string, string>;
  hints: Record<string, string>;
}

type ActionContext = {
  args: ReturnType<Command['parse']>,
  default: Record<string, any>;
  // options?: Command['options'],
}

export type ExtraGroup = 'Commands' | 'Flags' | 'Arguments'
export type Group = 'Header' | 'Tail' | 'Usage' | 'Examples' | ExtraGroup
export type SettingGroup = Exclude<Group, ExtraGroup>

export type CommandAction = (arg: ActionContext['args'], defaultResult?: ActionContext['default']) => Awaited<any>

export type Output = Record<SettingGroup, string[]> & Record<ExtraGroup, string[][]>

/**
 * last string is alias, for example:
 * `t` and `ta` is `target`'s alias
 * ```
 * t,ta, target
 * ```
 */
type Flags = string
type Commands = string
type ArgDataType = 'string' | 'boolean' | 'number' | 'Array'

type Description = string
type Examples = string | string[] | undefined
type ValueHint = string

export type FormatArgs = [Flags, Flags, ValueHint, ArgDataType, Description, DefaultValue?]
export type DefaultValue<T = string> = T | boolean | number | Array<string>

export type SubCmd = Flags | [Flags, Description?]

/** show in Output or not */
export type InOutput = boolean
export type Arg = [Flags, Description] | [Flags, Description, DefaultValue]

export type Args = Array<Arg>
export type DefaultArgs = Array<Exclude<SubCmd, Flags>>

export interface CommandSettings {
  /** print help info, default `true`*/
  help: boolean
  /**
   * TODO Custom error messages
   */
  error?: () => void
  /**
   * Callback function that runs whenever a parsed flag has not been defined in options.
   * return `false` to abort the action run.
   */
  unknownArgsError?: (flag: string, meta: Meta) => any
}

export interface RenderSettings {
  /** indent level, default `2` */
  indentLevel: number
  /** default description's number of spaces from the left, default `28` */
  descPadLeft: number
}

export interface AllRenderSettings extends Partial<RenderSettings> {
  /**
   * tail Extra info
   *
   * ```txt
   *  Learn more about Xxx:    https://xxx
   * ```
   */
  Usage?: string | string[]
  examples?: string | string[]
  // usage?: string | string[]
  tail?: string | string[]
  header?: string | string[]
}

export interface Meta {
  /** command name */
  name: string
  /** command version */
  version?: string
  type?: 'main' | 'sub'
  description?: string
  /** defualt command arguments */
  default?: DefaultArgs
  hint?: string
  alias?: string[]
  /** parent Render */
  parent?: Command | null
  /** command type */
}

export type RequiredMeta = Required<Meta>
export type DefineMeta = Omit<Meta, 'alias' | 'hint' | 'type' | 'parent'>

export interface DefineCommands extends DefineMeta {
  args?: Args,
  action: CommandAction
}
