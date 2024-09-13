import { colors } from './colors/picocolors'
import { Meta } from './types'
import { print } from './utils'

export class XWCLIError extends Error {

    constructor(message: string) {
        super()
        this.name = '[XWCLI]'
        this.message = message
    }
}

export function log(type = '', ...message: any[]) {
    print(colors.cyan('[XWCLI]: ' + type) + ' '), message.forEach((m) => print(m))
}


export function errorWithHelp(meta: Meta, message: string) {
    console.error(colors.red(meta.name + `: ${message} For help, run command with '--help'.`))
}

export function error(message: string) {
    console.error(colors.red(message))
}