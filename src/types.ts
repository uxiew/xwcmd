import type { ArgsOptions } from "./args/types";
import type { Command } from "./command";
import type { Render } from "./render";

export type Awaitable<T> = () => T | Promise<T>;
export type Resolvable<T> = T | Promise<T> | (() => T) | (() => Promise<T>);

export type CmdOptions = ArgsOptions & {
    [key in 'description' | 'hints']: Record<string, string>
}

type ActionContext = {
    args: Command['resolved'],
    // options?: Command['options'],
}

export type Group = 'Header' | 'Tail' | 'Usage' | 'Commands' | 'Flags' | 'Examples'
export type SettingGroup = Exclude<Group, 'Commands' | 'Flags'>

export type CommandAction = (context: ActionContext) => Awaited<any>

export type Output = Record<SettingGroup, string[]> & Record<'Commands' | 'Flags', string[][]>

/** 
 * last string is alias, for example:
 * `t` and `ta` is `target`'s alias 
 * ```
 * t,ta, target
 * ```
 */
type Flags = string
type Commands = string
type ArgType = 'string' | 'boolean' | 'number' | 'Array'

type Description = string
type Examples = string | string[] | undefined
type ValueHint = string

export type FormatArgs = [Flags, Flags, ValueHint, ArgType, Description, DefaultValue?]
export type DefaultValue<T = string> = T | boolean | number | Array<string>

export type SubCmd = Flags | [Flags, Description?]

/** show in Output or not */
export type InOutput = boolean
export type Arg = [Flags, Description] | [Flags, Description, DefaultValue]

export type Args = Array<Arg>

export interface RenderSettings {
    /** indent level, default `2` */
    indentLevel: number
    /** show default value, default `true`*/
    showDefaultValue: boolean
    /** default help when no default command is provided, default `true` */
    defaultHelp: boolean
    /** print help info, default `true`*/
    help: boolean
    /** default description's number of spaces from the left, default `28` */
    descPadLeft: number
}

export interface Settings extends Partial<RenderSettings> {
    /** event before rendering ends, could edit the terminal ouput */
    render?: (logInfo: string, output: Output, settings: RenderSettings) => string
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
    name: string,
    version?: string,
    description?: string,
    type?: 'main' | 'sub',
    alias?: string[]
    hint?: string,
    /** parent Render */
    parent?: null | Render,
    /** command type */
}

export type DefineMeta = Omit<Meta, 'alias' | 'hint' | 'type' | 'parent'>

export interface DefineCommands extends DefineMeta {
    args?: Args,
    action: CommandAction
}