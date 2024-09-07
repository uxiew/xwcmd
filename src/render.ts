import { column, row, type ColumnOptions } from "minicolumns";
import { colors } from "./colors/picocolors";
import { concatANSI, fillSpace, print, stringLen, toArray } from "./utils";
import type {
  Meta, RenderSettings, Settings,
  Output, FormatArgs,
  SettingGroup
} from "./types";

export class Render {

  settings: RenderSettings = {
    indentLevel: 2,
    showDefaultValue: true,
    defaultHelp: true,
    help: true,
    /** default description's number of spaces from the left */
    descPadLeft: 28,
  }

  private render: (info: string) => string = (i) => i

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
  private extras: Output = {
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

  get parent() {
    return this.meta.parent
  }

  /** 
   * indent Level, default 2
   */

  constructor(readonly meta: Meta, readonly flagInfo: FormatArgs[]) {
    this.addLine({
      group: 'Usage',
      line: this.type === 'sub'
        ? colors.yellow(this.meta.parent?.meta.name + ' ' + this.meta.name) + colors.gray(' [Flags] [...args]')
        : colors.yellow(this.meta.name) + colors.gray(' [Flags] [command]')
    });
  }

  /**
   * calc number of spaces from the left. (for flags)
   * 
   * @param {string} info - this info to display
   * @param {string} other - need exclude the other infos's length
   */
  private calcPadLen(needPadLen: number, innerStr: string) {
    return needPadLen + innerStr.length - stringLen(innerStr)
  }


  /**
   * add Flags or Commands to output
   */
  addExtraInfo({ type, info }: { type: 'Commands' | 'Flags', info: FormatArgs[] }) {
    let maxAliasLen = 0, padLeft = fillSpace(this.settings.indentLevel)
    this.extras[type] = info.map(([alias, flag, hint, dataType, desc, defaultValue]) => {
      const aliasFlag = alias ? alias.split(',').map(a => concatANSI(a, '-')).join(', ') : ''
      const defaultV = typeof defaultValue === 'undefined' ? '' : colors.dim(` (default: ${JSON.stringify(defaultValue)})`)
      const flagArr: string[] = [colors.yellow(aliasFlag), colors.yellow(type === 'Flags' ? (aliasFlag ? ', ' : '  ') + concatANSI(flag, '--') : flag), colors.dim(hint), desc + defaultV]
      maxAliasLen = Math.max(maxAliasLen, stringLen(aliasFlag))
      return flagArr
    })

    this.extras[type].forEach((flag) => {
      flag[0] = flag[0].padStart(maxAliasLen + flag[0].length - stringLen(flag[0]))
      flag.unshift(padLeft + fillSpace(2))
    })
  }

  /**
   * Change the Command's output usage.
   */
  set(settings: Settings) {
    const {
      render, header, Usage, examples, tail
    } = { ...settings }
    Object.assign(this.settings, settings)

    // change the output's group name or group's lines
    if (typeof render === 'function') this.render = (str: string) => render(str, this.extras, this.settings)
    if (Usage) {
      this.extras.Usage = toArray(Usage)
    }

    if (header || examples || tail) {
      [header, examples, tail].forEach((group, i) => {
        (typeof group !== 'undefined') && toArray(group).forEach((line) => this.addLine({
          group: i === 0
            ? 'Header' : i === 1
              ? 'Examples' : 'Tail',
          line
        }))
      })
    }
  }

  /**
   * add `--help` for log help info
   */
  addHelp() {
    this.flagInfo.push(['h', 'help', '', 'string', 'Print this help menu'])
    // this.info.alias ? (this.info.alias.help = ['h']) : (this.info.alias = { help: ['h'] })
  }

  /**
   * add a line to extras
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
    group: SettingGroup,
    line: string | string[],
    loc?: "top" | "bottom"
  }) {
    const method = loc === 'top' ? 'unshift' : 'push'
    toArray(line).forEach((l) => l !== '' && this.extras[group][method](l))
    return this
  }

  /** 
   * show all command info on the terminal
   * * make link linkable
   * 
   * @example
   * ```sh
   * this is a description for this command. (1.1.0)
   * 
   * Usage: xwcmd[Flags][command]
   * 
   * Commands:
   *   help             Display help
   * 
   * Flags:
   *   --help           Output usage information
   * -S, --sections   get epub file sections
   *   
   * Examples:
   *   Add a dependency from the npm registry
   *   bun add zod
   * 
   * Learn more about Bun: https://bun.sh/docs
   * ```
   */
  display() {
    type FormatOptions = Parameters<typeof row>[1]
    const padLeft = fillSpace(this.settings.indentLevel)
    const newLine = '\n'

    //  Commands and Flags Formater and Style
    const FlagStyle = [{ separator: '', align: 'left' }, { separator: '' }, {}, { align: 'left', separator: fillSpace(4) }] as ColumnOptions
    const format: (r: string[][], o?: FormatOptions) => [string[][], FormatOptions]
      = (row, opt = { separator: '' }) => [row.map(a => (a.unshift(padLeft), a)), opt];

    // Current command is 'sub2', its alias is 's2', and hint is the content after '<'
    if (this.settings.help) this.addHelp()
    this.addExtraInfo({ type: 'Flags', info: this.flagInfo })

    //  ------ Header -------
    if (this.extras.Header.length > 0) {
      this.extras.Header.forEach((l) => print(l))
      print('')
    }

    // ------- Usage -------
    print(row(
      ...format(
        this.extras.Usage.map((n, i) => {
          return [(i == 0 ? 'Usage: ' : ''), colors.yellow(n)]
        }),
      )
    ))

    // ---- Commands Alias (if has)------
    if (this.meta.alias.length > 0) {
      print(row(
        ...format(
          this.meta.alias.map((n, i) => {
            return [(i == 0 ? 'Alias: ' : ''), this.meta.parent?.meta.name + ' ' + n]
          }),
        )
      ))
    }


    // --------- Commands ---------
    if (this.extras.Commands.length > 0) {
      print(newLine + row(
        ...format([
          ['Commands:', '', ''],
        ])
      ))

      //  Commands info
      print(row(this.extras.Commands, FlagStyle));
      print(newLine + padLeft + fillSpace(2) +
        `For more info, run any command with the ${colors.gray(colors.italic('--help'))} flag.`)
    }

    if (this.extras.Flags.length > 0) {
      // ------ Flags ------
      print(newLine + row(
        ...format([
          ['Flags:', '', '']
        ])
      ));
      print(row(this.extras.Flags, FlagStyle));
    }

    // ------- Examples ------
    if (this.extras.Examples.length > 0) {
      print(newLine + row(
        ...format([
          ['Examples:', '', ''],
        ])
      ))
      this.extras.Examples.forEach((l) => print(l))
    }

    // -------- Tail ------
    if (this.extras.Tail.length > 0) {
      print('')
      this.extras.Tail.forEach((l) => print(l))
    }
  }

}