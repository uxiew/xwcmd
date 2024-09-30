import { row, type ColumnOptions } from "minicolumns";
import stripAnsi from "strip-ansi";
import { colors } from "./colors/picocolors";
import {
  cleanArg,
  concatANSI, fillSpace, parseType, print,
  stringLen, stripFlag, toArray
} from "./utils";
import type {
  RenderSettings,
  Output, FormatArgs,
  SettingGroup,
  RequiredMeta,
  DefaultArgs,
  ExtraGroup,
  AllRenderSettings
} from "./types";

export class Render {

  settings: RenderSettings = {
    indentLevel: 2,
    /** default description's number of spaces from the left */
    descPadLeft: 28,
  }

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
    Arguments: [],
    Commands: [],
    Flags: [],
    Examples: [],
    Tail: [],
  }

  get type() {
    return this.meta.parent?.type
  }

  get parent() {
    return this.meta.parent?.render
  }

  /**
   * indent Level, default 2
   */
  constructor(readonly meta: RequiredMeta, readonly flagInfo: FormatArgs[]) {
    if (meta.type === 'main') {
      this.addLine({
        group: 'Header',
        line: `${meta.description} ${colors.gray(`(ver ${meta.version})`)}`
      });
    }
    this.setUsage(meta)
  }

  setArgument(args: DefaultArgs) {
    const { default: dArgs } = this.meta
    this.addExtra({
      type: 'Arguments',
      info: args.map(([flag, desc = '']) => {
        let [type, _, r] = parseType(flag)
        return [,
          cleanArg(flag),
          , , desc + colors.dim(` (${type}${(r ? colors.yellow(', Required') : '')})`),
        ]
      })
    });
  }

  setUsage(meta: RequiredMeta) {
    this.extras.Usage = [];
    const { parent: cmd, name, type, default: dArgs } = meta

    const ARGS = dArgs ? ' <...arguments>' : ''
    this.addLine({
      group: 'Usage',
      line: type === 'sub'
        ? colors.yellow(cmd?.name + ' ' + name) +
        colors.gray(`${ARGS} <command> [...flags] [...args]`)
        : colors.yellow(name) + colors.gray(`${ARGS} <command> [...flags] [...args]`)
    });
  }

  /**
   * add Flags or Commands to output
   */
  addExtra({ type, info }: { type: ExtraGroup, info: FormatArgs[] }) {
    let maxAliasLen = 0, padLeft = fillSpace(this.settings.indentLevel);
    this.extras[type] = info.map(([alias, flag, hint, _, desc, defaultValue]) => {
      const aliasFlag = alias ? alias.split(',').map(a => concatANSI(a, '-')).join(', ') : ''
      const defaultV = typeof defaultValue === 'undefined' ? '' : colors.dim(` (default: ${JSON.stringify(defaultValue)})`)
      const flagArr: string[] = [
        colors.yellow(aliasFlag),
        colors[type === 'Arguments' ? 'cyan' : 'yellow'](type === 'Flags' ? (aliasFlag ? ', ' : '  ') + concatANSI(flag, '--') : flag),
        hint ? colors.dim(hint) : '',
        desc + defaultV
      ]
      maxAliasLen = Math.max(maxAliasLen, stringLen(aliasFlag))
      return flagArr
    })

    this.extras[type].forEach((flag) => {
      flag[0] = flag[0].padStart(maxAliasLen + flag[0].length - stringLen(flag[0]))
      flag.unshift(padLeft + fillSpace(2))
    })
    // console.log(`addExtra-- - `, this.extras)
  }

  /**
   * Change the Command's output usage.
   */
  set(settings: AllRenderSettings) {
    const {
      header, Usage, examples, tail
    } = { ...settings }

    // change the output's group name or group's lines
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
   */
  display() {
    type FormatOptions = Parameters<typeof row>[1]
    const padLeft = fillSpace(this.settings.indentLevel)
    const newLine = '\n'

    //  Commands and Flags Formater and Style
    const FlagStyle = [{ separator: '', align: 'left' }, { separator: '' }, {}, { align: 'left', separator: fillSpace(4) }] as ColumnOptions
    const format: (r: string[][], o?: FormatOptions) => [string[][], FormatOptions]
      = (row, opt = { separator: '' }) => [row.map(a => (a.unshift(padLeft), a)), opt];

    if (this.settings.help) this.addHelp()
    this.addExtra({ type: 'Flags', info: this.flagInfo })

    //  ------ Header -------
    if (this.extras.Header.length > 0) {
      this.extras.Header.forEach((l) => print(l))
    }

    // ------- Usage -------
    if (this.extras.Usage.length > 0) {
      print(newLine + row(
        ...format(
          this.extras.Usage.map((n, i) => {
            return [(i == 0 ? 'Usage: ' : ''), colors.yellow(n)]
          }),
        )
      ))
    }

    // ---- Commands Alias (if has)------
    if (this.meta.alias!.length > 0) {
      print(newLine + row(
        ...format(
          this.meta.alias!.map((n, i) => {
            return [(i == 0 ? 'Alias: ' : ''), this.meta.parent?.meta.name + ' ' + n]
          }),
        )
      ))
    }

    // ------- Arguments -------
    if (this.extras.Arguments.length > 0) {
      // ------ Flags ------
      print(newLine + row(
        ...format([
          ['Arguments:', '', '']
        ])
      ));
      print(row(this.extras.Arguments, FlagStyle));
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
