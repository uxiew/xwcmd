import type { ArgsOptions, Argv, Arrayable, BaseArgsOptions } from "./argv/types";
import type { CLI } from "./CLI";

export type ProcessArgv = typeof process['argv']

export type Awaitable<T> = () => T | Promise<T>;
export type Resolvable<T> = T | Promise<T> | (() => T) | (() => Promise<T>);

export type TypeOpts = BaseArgsOptions & { required?: CLIOptions['required'] }

/**
* cmd.sub's parameter
*/
export type CLIItemDef = {
  [k in string]: {
    type?: keyof Omit<BaseArgsOptions, 'default' | 'alias'>
    alias?: Arrayable<string>
    default?: DefaultValue
    choices?: Required<CLIOptions>['choices'][string]
    required?: boolean
  }
}
export type CLIParamDef = Partial<Omit<MetaResult, 'type'>>
  & Pick<MetaResult, 'name'>
  & {
    /** cli's arguments */
    arguments?: Omit<CLIItemDef, 'alias'>
    options?: CLIItemDef
  }

export type CLIOptions = ArgsOptions & {
  /** Parsing encountered error */
  error?: ArgsResult['error']
  /**
  * add choices for this command, constraint some arg value can only be one of the choices
  */
  choices?: Record<string, (string | number | boolean)[]>
  required?: string[]
}

interface BaseResult {
  name: string;
}

export interface MetaResult extends BaseResult {
  version: string;
  type: Meta['type'];
  alias?: Meta['alias'];
}

type ArgsResult = TypeOpts & {
  error?: boolean
  _: string[],
}

interface CmdsResult extends BaseResult {
  alias: string[];
}

export type CLIGroup = 'meta' | 'args' | 'cmds' | 'opts'

type Result<T extends CLIGroup> =
  T extends 'args' ? ArgsResult :
  T extends 'cmds' ? CmdsResult[] :
  T extends 'opts' ? CLIOptions :
  never;

export type ParsedResult = {
  [K in CLIGroup]: K extends 'meta' ? MetaResult : Result<K>;
}

export type CLIOpts = Omit<CLIOptions,
  'shortFlagGroup'
  | 'parseNumber'
  | 'populate--'
  | 'camelize'
  | 'coerce'
  | 'unknown'
>

type ActionContext = {
  args: ReturnType<CLI['parse']>,
  default: Record<string, any>;
  cmd: CLI,
}

export type ExtraGroup = 'Commands' | 'Flags' | 'Arguments'
export type Group = 'Header' | 'Tail' | 'Usage' | 'Examples' | ExtraGroup
export type SettingGroup = Exclude<Group, ExtraGroup>

export type CLIAction = (arg: ActionContext['args'],
  defaultResult: ActionContext['default'],
  cmd: ActionContext['cmd']) => Awaited<any>

export type Output = Record<SettingGroup, string[]> & Record<ExtraGroup, string[][]>

// export type FormatArgs = [Flags, Flags, ValueHint, ArgDataType, Description, DefaultValue?]

export type DefaultValue<T = string> = T | boolean | number | Array<string>

/** show in Output or not */
export type InOutput = boolean
// export type Arg = [Flags, Description] | [Flags, Description, DefaultValue]

// export type Args = Array<Arg>
// export type DefaultArgs = Array<Exclude<SubCmd, Flags>>

export interface CLISettings {
  /** Output orignal info, default `false` */
  clean: boolean
  /** Output with colors */
  colorful: boolean
  /** Output with type info, default `true`*/
  removeType: boolean
  /** print help, default `true`*/
  help: boolean
  /**
   * TODO Custom error messages
   */
  error?: () => void
  /**
   * Callback function that runs whenever a parsed flag has not been defined in options.
   * return `false` to abort the action run.
   */
  unknownError?: (flag: string, meta: Meta) => any
}

export interface RenderSettings {
  /** indent level, default `2` */
  indentLevel: number
  /** default description's number of spaces from the left, default `28` */
  descPadLeft: number
}

export interface Meta {
  /** CLI name */
  name: string
  /** CLI version */
  args: ArgsResult,
  version: string
  /** the command is main command or sub command */
  type: 'main' | 'sub'
  // description?: string
  /** defualt command arguments */
  // default?: DefaultArgs
  // hint?: string
  alias?: string[]
  /** parent Render */
  parent?: CLI | null
  /** command type */
}

export type RequiredMeta = Required<Meta>
export type DefineMeta = Omit<Meta, 'alias' | 'hint' | 'type' | 'parent'>
