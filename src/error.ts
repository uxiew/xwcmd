import { colors } from './colors/picocolors'
import { Meta } from './types'
import { print } from './utils'

export function log(type = '', ...message: any[]) {
  print('[XWCMD]: ' + type + ' '), message.forEach((m) => print(m))
}

export function errorWithHelp(meta: Meta, message: string) {
  console.error(colors.red(meta.name + `: ${message} For help, run command with '--help'.`))
}

export function error(message: string) {
  console.error(colors.red(message))
}
