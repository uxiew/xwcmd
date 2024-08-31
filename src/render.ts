import { colors, createColors, formatter } from "./colors/picocolors";
import type { Meta, RenderSettings, Settings, Group, CmdOptions, Output } from "./types";
import type { Argv } from "./args/types";
import { argTrim, concatANSI, fillSpace, getExcludedANSILen, parseAlias } from "./utils";

export class Render {

  /** 
   * the most suitable final description's number of spaces from the left
   * calculated by the longest flag's length
   */
  private lenForLayout = 8


  settings: RenderSettings = {
    indentLevel: 2,
    showDefaultValue: true,
    needHelp: true,
    /** default description's number of spaces from the left */
    descPadLeft: 30,
  }

  private render: (info: string) => string = (i) => i

  parent: Render | null = null

  /**
   * Organize all the information to be output
   * @example
   *
   * ```js
   *  {
   *    Usage: ['xwcmd [Flags] [command]'],
   *    Commands: [
   *      '-h, --help     Display help (version: 1.1.0)'
   *      'xxx'
   *    ],
   *    ...
   *  }
   * ```
   */
  private output: Output = {
    Header: [],
    Usage: [],
    Commands: [],
    Flags: [],
    Examples: [],
    Tail: [],
  }

  get type() {
    return this.meta.type
  }

  /** 
   * indent Level, default 2
   */

  constructor(readonly meta: Meta, readonly info: { args: Argv, options: CmdOptions }) {
    this.addLine({
      group: 'Usage',
      line: this.type === 'sub'
        ? [this.meta.name].concat(this.meta.alias).map(n => {
          return `${colors.yellow(this.meta.parent?.name + ' ' + n)} ${colors.gray('[Flags] [...args]')}`
        })
        : `${colors.yellow(this.meta.name)} ${colors.gray('[Flags] [command]')}`
    });
    // Current command is 'sub2', its alias is 's2', and hint is the content after '<'

    this.initArgs(info.options)
    if (!this.settings.needHelp) this.addHelp()
  }

  /**
   * calc number of spaces from the left. (for flags)
   * 
   * @param {string} info - this info to display
   * @param {string} other - need exclude the other infos's length
   */
  private calcPadLen(needPadLen: number, innerStr: string) {
    return needPadLen + innerStr.length - getExcludedANSILen(innerStr)
  }

  private initArgs(options: CmdOptions) {
    // this.addLine({
    //   group: 'Commands',
    //   line: `help     Display help(version: ${ this.meta.version })`
    // })
    const { description, default: defaultValue = {}, alias = {}, hints } = options
    // display default value
    const defaultInfo = (name: string) => typeof defaultValue[name] !== 'undefined' ? ` (default: ${typeof defaultValue[name] === 'string' ? '"' + defaultValue[name] + '"' : JSON.stringify(defaultValue[name])})` : ''
    const valueHint = (name: string) => Array.isArray(hints[name]) ? hints[name].join(',') : typeof hints[name] === 'undefined' ? '' : hints[name]

    let maxLenAlias = 0, maxLenName = 0
    this.addLine({
      group: 'Flags',
      line: Object.entries(description).map(([name, desc], i, arr) => {
        // @ts-expect-error hidden in the output
        if (desc === false) return false
        const aliasStr = alias[name].length > 0 ? alias[name].map(a => concatANSI(a, '-')).join(', ') + ', ' : ''

        const visibleLenForAlias = getExcludedANSILen(aliasStr)
        const visibleLenForName = getExcludedANSILen(name)
        maxLenAlias = Math.max(maxLenAlias, visibleLenForAlias)
        maxLenName = Math.max(maxLenName, visibleLenForName)

        return [visibleLenForName, aliasStr, desc, name]
      }).map((val) => {
        const [vLen, alias, desc, name] = val as [boolean, string, string, string, string]
        if (vLen === false) return ''

        const paddedAlias = alias.padStart(this.calcPadLen(maxLenAlias, alias))

        const lenBeforeName = maxLenAlias + this.settings.indentLevel + 2 + 2
        const lenOfAliasAndName = maxLenName + lenBeforeName >= this.settings.descPadLeft ? maxLenName + lenBeforeName + 2 : this.settings.descPadLeft

        const paddedName = name.padEnd(this.calcPadLen(lenOfAliasAndName - lenBeforeName, name))

        return paddedAlias + concatANSI(paddedName, '--') + desc + (this.settings.showDefaultValue ? `${colors.gray(defaultInfo(name))} ` : '')
      })
    })
  }
  /**
   * Change the Command's output usage.
   */
  set({ render, group, tail, header, showDefaultValue, indentLevel = this.settings.indentLevel }: Settings) {
    this.settings.indentLevel = indentLevel
    // change the output's group name or group's lines
    if (typeof render === 'function') this.render = render

    if (group) {
      Object.entries(group).forEach(([name, logs]) => {
        if (Object.keys(this.output).includes(name)) {
          this.addLine({
            group: name as Group,
            line: logs,
          })
        }
      })
    }

    if (header || tail) {
      [header, tail].forEach((group, i) => {
        (typeof group !== 'undefined') && (Array.isArray(group) ? group : [group]).forEach((line) => this.addLine({ group: i === 0 ? 'Header' : 'Tail', line }))
      })
    }

    this.addLine({ group: 'Header', line: `------------test --------- `, loc: 'top' });

    if (showDefaultValue) this.settings.showDefaultValue = showDefaultValue
  }

  addHelp() {
    const flag = colors.yellow('-h, --help')
    const cmdFlag = colors.gray('<command>') + ' --help'
    const flagDesc = 'Print this help menu'
    const cmdDesc = 'Print help text for command'

    this
      .addLine({
        group: 'Flags',
        line: flag + flagDesc.padStart(this.calcPadLeftLen(flagDesc, flag, this.lenForLayout)),
        loc: 'bottom'
      })
      .addLine({
        group: 'Commands',
        line: cmdFlag + cmdDesc.padStart(this.calcPadLeftLen(cmdDesc, cmdFlag, this.lenForLayout)),
        loc: 'bottom'
      })
  }

  /**
   * add a line to output
   *
   * @param {Group} group the group to which the text belongs
   * @param {string | string[]} line string to add
   * @param { "top" | "bottom"}  loc Text add location, optional value 'top' or 'bottom', default 'bottom'
   */
  private addLine({
    group,
    line,
    loc = 'bottom'
  }: {
    group: Group,
    line: string | string[],
    loc?: "top" | "bottom"
  }) {
    const method = loc === 'top' ? 'unshift' : 'push'
    const lines = Array.isArray(line) ? line : [line]

    /** @param {number} n - indentation level */
    const fill = (n: number = 0) => lines.forEach((l) => l !== '' && this.output[group][method](fillSpace(n) + l))

    switch (group) {
      case 'Header': {
        fill()
      } break
      case 'Usage':
      case 'Commands':
      case 'Flags':
      case 'Examples': {
        fill(this.settings.indentLevel + 2)
      } break
      case 'Tail': {
        fill()
      }
        break;
    }

    return this
  }

  /** 
   * group all infos, and render them by order
   * 
   * ```sh
          * Usage: xwcmd[Flags][command]
            * 
   * Commands:
   * help     Display help(version: 1.1.0)
          * 
   * Flags:
   * --help
          * Output usage information
            * -S, --sections   get epub file sections
              *   
   * Examples:
   * Add a dependency from the npm registry
          * bun add zod
            * 
   * Learn more about Bun: https://bun.sh/docs
   * ```
   */
  private group() {
    const output = this.output
    const { Header, Usage, Commands, Flags, Examples, Tail } = output
    const lines = [
      Header,
      Usage,
      Commands,
      Flags,
      Examples,
      Tail
    ]

    return lines.filter(Boolean).join('\n')
  }

  /**
   * alias: Options
   */
  private addFlags(flags: any) {

  }

  /**
   * add usage examples
   */
  private addExample() {

  }

  /** 
   * show all command info on the terminal
   * * make link linkable
   * 
   * @param {'mian'|'sub'} type - show main or sub command info, default 'main'
   * ```sh
          * Usage: xwcmd[Flags][command]
            * 
   * Commands:
   * help     Display help(version: 1.1.0)
          * 
   * Flags:
   * --help
          * Output usage information
            * -S, --sections   get epub file sections
              *   
   * Examples:
   * Add a dependency from the npm registry
          * bun add zod
            * 
   * Learn more about Bun: https://bun.sh/docs
   * ```
   */
  show() {
    this.group()

    // this.addLine({
    //   group: 'Commands',
    //   line: Object.entries(description).map(([name, desc]) => {
    //     const flagName = alias[name] ? alias[name].map(a => `- ${ a } `).join(', ') + `, --${ name } ` : `--${ name } `
    //     const paddedFlag = flagName.padStart(14)
    //     console.log(name, paddedFlag);
    //     return `${ paddedFlag }${ fillSpace(paddedFlag.length) }${ desc }${ defaultInfo(name) } `
    //   })
    // })

    console.log('sssssss:', this.meta, this.info, this.output);
    const padLeft = fillSpace(this.settings.indentLevel)
    // TODO linkable
    Object.entries(this.output).forEach(([name, lines], i) => {
      const newLine = '\n'
      if ("Usage" === name) {
        lines.forEach((l, i) => {
          console.log(this.render(
            // when Header is empty, don't add a newLine before Usage
            (this.output.Header.length === 0 || i !== 0 ? '' : newLine)
            + padLeft + (i === 0 ? name : 'Alias') + ':' + (
              i === 0
                ? l.slice(this.settings.indentLevel + 1)
                : l.slice(this.settings.indentLevel + 1)
            )));
        })
        return
      }
      // Don't show those "Header,Tail" group name
      else if (!"Header,Tail".includes(name)) {
        if (this.type === 'sub') {
          // handle sub command info

        }

        // no info to show
        if (lines.length === 0) return;
        // display header Group Name
        console.log(this.render(newLine + padLeft + name + ':'));
      }
      // when Tail is not empty, add a newLine 
      lines.length > 0 && console.log(this.render((name === 'Tail' ? newLine : '') + lines.join('\n')));
    });
  }

}

/**
 * 
 * 
 * @example
 * ```sh
        Usage: xdw[Flags][command]
        Examples:
    Add a dependency from the npm registry
    bun add zod
    bun add zod @next
    bun add zod @3.0.0

    Add a dev, optional, or peer dependency
    bun add - d typescript
    bun add--optional lodash
    bun add--peer esbuild
          ```
 */