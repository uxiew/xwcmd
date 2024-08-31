import type { ArgsOptions } from "./args/types";
import type { Command } from "./command";

export type Awaitable<T> = () => T | Promise<T>;
export type Resolvable<T> = T | Promise<T> | (() => T) | (() => Promise<T>);

export type CmdOptions = ArgsOptions & {
    [key in 'description' | 'hints']: Record<string, string>;
}

export type CommandAction = (info?: any) => Awaited<any>

export type Output = Record<Group, string[]>

/** 
 * last string is alias, for example:
 * `t` and `ta` is `target`'s alias 
 * ```
 * t,ta, target
 * ```
 */
type Flags = string

type Description = string
type Examples = string | string[] | undefined
type ValueHint = string | string[]

export type DefaultValue<T = string> = T | boolean | number | Array<string>

export type SubCmd = Flags | [Flags, Description?]

/** show in Output or not */
export type InOutput = boolean
export type Arg = [Flags, Description] | [Flags, Description, DefaultValue]

export type Args = Array<Arg | [Arg, InOutput]>

export type Group = 'Header' | 'Tail' | 'Usage' | 'Commands' | 'Flags' | 'Examples'


export interface RenderSettings {
    /** indent level, default `2` */
    indentLevel: number
    /** show default value, default `true`*/
    showDefaultValue: boolean
    /** disable help, default `true`*/
    needHelp: boolean
    /** default description's number of spaces from the left, default `30` */
    descPadLeft: number
}

export interface Settings extends Partial<RenderSettings> {

    /** event before rendering ends, could edit the terminal ouput */
    render?: (logInfo: string) => string
    /**
     * in terminal, show Group or string type 
     * like `Usage`、`Flags`、`Examples`
     */
    group?: {
        [K in Group]?: string | string[]
    }
    /**
     * tail Extra info
     * 
     * ```txt
     *  Learn more about Xxx:    https://xxx
     * ```
     */
    tail?: string | string[]
    header?: string | string[]
}

export interface Meta {
    name: string,
    version: string,
    alias: string[]
    hints: string,
    parent: null | Command,
    type: 'main' | 'sub',
}

export type DefineMeta = Omit<Meta, 'alias' | 'hints' | 'type' | 'parent'>

export interface DefineCommands extends DefineMeta {
    args?: Args,
    action: CommandAction
}